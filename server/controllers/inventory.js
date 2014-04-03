'use strict';

module.exports = function $module(Busboy, csv, when, router, cmds) {
  if ($module.exports) {
    return $module.exports;
  }
  $module.exports = {};

  Busboy = Busboy || require('busboy');
  csv = csv || require('fast-csv');
  when = when || require('when');
  router = router || require('../commands/router')();
  cmds = cmds || require('../commands/inventory')();


  $module.exports.upload = function (req, res) {
    res.setHeader('Content-Type', 'text/html');

    var fileUploadMessage = '';

    var busboy = new Busboy({ headers: req.headers });
    var fn = null;
    var inventoryData = [];
    var promises = [];


    busboy.on('file', function(fieldname, file, filename) { //, encoding, mimetype) {
      fn = filename;
      csv
        .fromStream(file, {headers : true})
        .on('record', function(data){
          promises.push(router.ask(new cmds.ImportInventory(data)));
        })
        .on('end', function() {
          fileUploadMessage = fn + ' uploaded to the server at ' + new Date().toString();
          log.info(fileUploadMessage);

          when.settle(promises).then(function (results) {
            results.forEach(function(r) {
              if (r.state === 'rejected') {
                log.info('Add inventory rejected %s', r.reason);
              } else {
                log.info('Add inventory worked!!!');
                inventoryData.push(r.value.content.inventory);
              }
            });

            var responseObj = {
              fileUploadMessage: fileUploadMessage,
              response: fileUploadMessage,
              inventoryData: inventoryData
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
