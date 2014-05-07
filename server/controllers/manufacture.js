'use strict';

module.exports = function $module(fs, moment, Busboy, csv, when, query, router, cmds, Customer, utils, _, Inventory) {
  if ($module.exports) {
    return $module.exports;
  }
  $module.exports = {};

  fs = fs || require('fs');
  moment = moment || require('moment');
  Busboy = Busboy || require('busboy');
  csv = csv || require('fast-csv');
  when = when || require('when');
  query = query || require('../services/query')();
  router = router || require('../commands/router')();
  cmds = cmds || require('../commands/inventory')();
  Customer = Customer || require('../services/models/Customer')();
  utils = utils || require('../utils')();
  _ = _ || require('lodash');
  Inventory = Inventory || require('../services/models/Inventory')();


  function sendToManufacturer(req, res) {
    var promises = [];
    var records = [];

    req.body.forEach(function(oi) {
      records.push(oi);
      promises.push(router.ask(new cmds.SendManufactureInventory(oi.inventory, req.user), 60000));
    });

    when.settle(promises).then(function(results) {
      log.info('Sending manufacturer inventory complete results.length=%s', results.length, req.user);
      log.debug('Sending manufacturer inventory complete results=%j', results, req.user);

      var inventoryData = [];
      _.each(results, function(r, i) {
        if (r.state === 'rejected') {
          log.error(
            'Sending of inventory to manufacturer failed reason=%j, record=%j',
            r.reason, records[i], req.user);
          return;
        }
        if (r.value.content.status !== 200) {
          log.warn(
            'Sending of inventory to manufacturer failed message=%j, record=%j',
            r.value.content.message, records[i], req.user);
          return;
        }

        var inv = r.value.content.inventory;
        var d = {
          'Order #': inv.productNumber,
          'Style': inv.itemDescription[0].factoryStyle,
          'Size': inv.itemDescription[0].sizeDesc,
          'Color': inv.itemDescription[0].color,
          'Description': inv.itemDescription[0].factoryDescription,
          'Length': inv.itemDescription[0].cut,
          'LBD Notes': records[i].orderNumber
        };
        inventoryData.push(d);
      });

      return inventoryData;
    }).then(function(data) {
      var fn = 'sendManufactureInventory_' + moment(new Date()).format('YYYYMMDDHHmmss') + '.csv';
      var fnDownload = 'tmp/' + fn;
      var file = conf.get('clientPath') + '/' + fnDownload;
      var csvStream = csv.createWriteStream({headers: true});
      var writableStream = fs.createWriteStream(file);

      log.info('Writing send manufacture inventory csv file=%s', file, req.user);
      log.debug('Writing send manufacturer inventory csv file=%s, data=%j', file, data, req.user);

      writableStream.on('finish', function(){
        log.info('Done writing send manufacture inventory csv file=%s', file, req.user);
      });

      csvStream.pipe(writableStream);
      _.each(data, function(d) { csvStream.write(d); });
      csvStream.write(null);

      res.json({
        message: 'Successfully sent ' + data.length + ' item(s) to manufacturer.',
        href: fnDownload,
        link: 'Click here to download the records.'
      });
      // res.download(file, fn);
    }).catch(function(e) {
      res.json(500, utils.errors.makeError(e, 'Send inventory to manufacturer failed'));
    });
  }


  $module.exports = {
    sendToManufacturer: sendToManufacturer
  };
  return $module.exports;
};
