'use strict';

var browserify = require('browserify-middleware');
var less = require('less-middleware');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
// var expressWinston = require('express-winston');
var express = require('express');
var logger = require('winston');
var path = require('path');
var os = require('os');

var Busboy = require('busboy');
var csv = require('fast-csv');

var app = express();

var logentries = require('node-logentries').logger({
  token:'805cc5af-8388-4634-8781-60adbdf696c7'
});
logentries.winston(logger);

// enable web server logging; pipe those log messages through winston
var winstonStream = {
  write: function(message) {
    logger.info(message.slice(0, -1));
  }
};
app.use(morgan({stream:winstonStream}));

// ...
var clientPath = path.join(process.cwd(), 'client');
var bootstrapPath = path.join(process.cwd(), 'node_modules', 'bootstrap');
var cssDirPath = path.join(os.tmpDir(), 'css-cache');

app.use(bodyParser());
app.use(methodOverride());

app.get('/js/index.js', browserify(path.join(clientPath, 'js', 'index.js')));
app.use('/fonts', express.static(path.join(bootstrapPath, 'fonts')));
app.use(less(path.join(clientPath, 'css'), {
    dest: cssDirPath,
    preprocess: {
      path: function(pathname) {
        return pathname.replace('/css', '');
      }
    }
  }, {
    paths: [path.join(bootstrapPath, 'less')],
    dumpLineNumbers: true
  }, {
    compress: false,
  }));

app.use(express.static(cssDirPath));
app.use(express.static(clientPath));

app.get('/', function(req, res) {
  res.send('hello world');
});


var Rx = require('rx');
var context = require('rabbit.js').createContext();
var pub = null;
context.on('ready', function() {
  logger.info('In context on ready');
  pub = context.socket('PUB');
  pub.connect('events');

  var sub = context.socket('SUB');
  sub.setEncoding('utf8');
  sub.connect('events');

  Rx.Node.fromStream(sub)
    .subscribe(function(x) { logger.info('received data! %s', x); });
});

app.post('/upload-full-form', function (req, res) {

  res.setHeader('Content-Type', 'text/html');

  var fileUploadMessage = '';

  var busboy = new Busboy({ headers: req.headers });
  var fn = null;
  busboy.on('file', function(fieldname, file, filename) { //, encoding, mimetype) {
    logger.info('FileFieldName=%s, FileName=%s', fieldname, filename);
    fn = filename;
    csv
      .fromStream(file, {headers : true})
      .on('record', function(data){
        logger.info('data=', data);
        pub.write(JSON.stringify(data), 'utf8');
      })
      .on('end', function(){
        logger.info('done!');
      });
    file.on('data', function(data) {
      logger.info('FileFieldName=%s, FileFieldDataLength=%d', fieldname, data.length);
    });
    file.on('end', function() {
      logger.info('FileFieldName=%s, Event=Finished', fieldname);
    });
  });
  busboy.on('field', function(fieldname, val) { //, valTruncated, keyTruncated) {
    logger.info('FieldName=%s', val);
  });
  busboy.on('finish', function() {
    fileUploadMessage = fn + ' uploaded to the server at ' + new Date().toString();

    var responseObj = {
      fileUploadMessage: fileUploadMessage
    };
    console.log('Done parsing form!');
    res.send(JSON.stringify(responseObj));
    // res.writeHead(303, { Connection: 'close', Location: '/' });
    // res.end();
  });
  req.pipe(busboy);
});


app.listen(8000);