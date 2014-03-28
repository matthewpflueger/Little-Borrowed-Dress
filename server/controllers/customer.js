'use strict';

module.exports = function $module(Busboy, csv, CustomerService) {
  if ($module.exports) {
    return $module.exports;
  }
  Busboy = Busboy || require('busboy');
  csv = csv || require('fast-csv');
  CustomerService = CustomerService || require('../services/customer');


  function CustomerController() {}

  CustomerController.upload = function (req, res) {
    res.setHeader('Content-Type', 'text/html');

    var fileUploadMessage = '';

    var busboy = new Busboy({ headers: req.headers });
    var fn = null;
    var customerData = [];

    busboy.on('file', function(fieldname, file, filename) { //, encoding, mimetype) {
      fn = filename;
      csv
        .fromStream(file, {headers : true})
        .on('record', function(data){
          if (data.SIZE) {
            data.SIZE = data.SIZE.split('&quot;').join('');
          }
          log.info('data=', data);

          CustomerService.tell(JSON.stringify(data));
          customerData.push(data);
          // InventoryService.tell(JSON.stringify(data), 'utf8');
          // pub.write(JSON.stringify(data), 'utf8');
        })
        .on('end', function(){
          log.info('done!');
        });
    });

    busboy.on('finish', function() {
      fileUploadMessage = fn + ' uploaded to the server at ' + new Date().toString();

      var responseObj = {
        fileUploadMessage: fileUploadMessage,
        response: fileUploadMessage,
        customerData: customerData
      };
      console.log('Done parsing form!');
      res.send(JSON.stringify(responseObj));
    });

    req.pipe(busboy);
  };

  $module.exports = CustomerController;
  return CustomerController;
};
