'use strict';

module.exports = function $module(Busboy, csv, when, router, commands) {
  if ($module.exports) {
    return $module.exports;
  }
  $module.exports = {};

  Busboy = Busboy || require('busboy');
  csv = csv || require('fast-csv');
  when = when || require('when');
  router = router || require('../commands/router')();
  commands = commands || require('../commands/orderitem')();


  $module.exports.upload = function (req, res) {
    res.setHeader('Content-Type', 'text/html');

    var fileUploadMessage = '';

    var busboy = new Busboy({ headers: req.headers });
    var fn = null;
    var customerData = [];
    var promises = [];


    busboy.on('file', function(fieldname, file, filename) { //, encoding, mimetype) {
      fn = filename;
      csv
        .fromStream(file, {headers : true})
        .on('record', function(data){
          if (data.SIZE) {
            data.SIZE = data.SIZE.split('&quot;').join('');
          }

          promises.push(router.ask(new commands.ImportOrderItem(data)));
        })
        .on('end', function() {
          fileUploadMessage = fn + ' uploaded to the server at ' + new Date().toString();
          log.info(fileUploadMessage);
          when.settle(promises).then(function (results) {
            results.forEach(function(r) {
              if (r.state === 'rejected') {
                log.info('Add order item rejected with ', r.reason);
              } else {
                log.info('Add order item worked!!!');
                customerData.push(r.value.data);
              }
            });

            var responseObj = {
              fileUploadMessage: fileUploadMessage,
              response: fileUploadMessage,
              customerData: customerData
            };
            console.log('Done parsing form!');
            res.send(JSON.stringify(responseObj));

          });
        });
    });

    req.pipe(busboy);
  };

  return $module.exports;
};
