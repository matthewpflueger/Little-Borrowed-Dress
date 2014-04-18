'use strict';

module.exports = function $module(Busboy, csv, when, query, router, cmds, Customer, utils, _, Inventory) {
  if ($module.exports) {
    return $module.exports;
  }
  $module.exports = {};

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

  function shipInventory(req, res) {
    router.ask(new cmds.ShipInventory(req.orderitem, req.user)).then(function(r) {
      res.json(r.content.status, r.content);
    }).catch(function(e) {
      res.json(500, utils.errors.makeError(e, 'Inventory ship failed'));
    });
  }

  function inventoryForOrderItem(req, res) {
    query.findInventoryForOrderItemForDate(
        req.orderitem,
        req.order.forDate,
        req.query)
    .then(function(results) {
      res.json(results);
    }).catch(query.NotFoundError, function(e) {
      res.send(404, utils.errors.makeError(e));
    }).catch(function(e) {
      log.error(e.toString(), req.user);
      res.send(500, utils.errors.makeError(e));
    });
  }

  function manufactureOrderItem(req, res) {
    router.ask(new cmds.RequestManufactureInventory(req.orderitem, req.user)).then(function(r) {
      res.json(r.content.status, r.content);
    }).catch(function(e) {
      res.json(500, utils.errors.makeError(e, 'Inventory manufacture request failed'));
    });
  }

  function upload(req, res) {
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
                log.info('Add inventory rejected %s', r.reason, req.user);
              } else {
                log.info('Add inventory worked %j', r.value, req.user);
                inventoryData.push(r.value.content.inventory);
              }
            });

            var responseObj = {
              fileUploadMessage: fileUploadMessage,
              response: fileUploadMessage,
              inventoryData: inventoryData
            };

            res.send(JSON.stringify(responseObj));
          });
        });
    });

    req.pipe(busboy);
  }

  $module.exports = {
    shipInventory: shipInventory,
    inventoryForOrderItem: inventoryForOrderItem,
    manufactureOrderItem: manufactureOrderItem,
    upload: upload
  };
  return $module.exports;
};
