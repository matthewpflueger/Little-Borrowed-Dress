'use strict';

module.exports = function(Busboy, csv, InventoryService) {
  Busboy = Busboy || require('busboy');
  csv = csv || require('fast-csv');
  InventoryService = InventoryService || require('../services/inventory');


  function InventoryController() {}

  InventoryController.upload = function (req, res) {
    res.setHeader('Content-Type', 'text/html');

    var fileUploadMessage = '';

    var busboy = new Busboy({ headers: req.headers });
    var fn = null;
    busboy.on('file', function(fieldname, file, filename) { //, encoding, mimetype) {
      log.info('FileFieldName=%s, FileName=%s', fieldname, filename);
      fn = filename;
      csv
        .fromStream(file, {headers : true})
        .on('record', function(data){
          log.info('data=', data);
          InventoryService.tell(JSON.stringify(data));
          // InventoryService.tell(JSON.stringify(data), 'utf8');
          // pub.write(JSON.stringify(data), 'utf8');
        })
        .on('end', function(){
          log.info('done!');
        });
      file.on('data', function(data) {
        log.info('FileFieldName=%s, FileFieldDataLength=%d', fieldname, data.length);
      });
      file.on('end', function() {
        log.info('FileFieldName=%s, Event=Finished', fieldname);
      });
    });

    busboy.on('field', function(fieldname, val) { //, valTruncated, keyTruncated) {
      log.info('FieldName=%s', val);
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
  };

  return InventoryController;
};

module.exports.$inject = ['busboy', 'fast-csv'];
