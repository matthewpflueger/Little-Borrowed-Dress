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

  function all(req, res) {
    query.findInventoryReservationsForDate(req.query).then(function(r) {
      res.json(r);
    }).catch(query.NotFoundError, function(e) {
      res.json(404, utils.errors.makeError(e, null, 404));
    }).catch(function(e) {
      res.json(500, utils.errors.makeError(e));
    });
  }

  function update(req, res) {
    router.ask(new cmds.UpdateInventory(req.inventory, req.body, req.user)).then(function(r) {
      res.json(r.content.status, r.content);
    }).catch(function(e) {
      res.json(500, utils.errors.makeError(e, 'Inventory update failed'));
    });
  }

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
    log.info('About to upload inventory', req.user);
    res.setHeader('Content-Type', 'text/html');


    var busboy = new Busboy({ headers: req.headers });
    var fn = null;
    var inventoryData = [];
    var promises = [];


    busboy.on('file', function(fieldname, file, filename) { //, encoding, mimetype) {
      fn = filename;
      csv
        .fromStream(file, {headers : true})
        .on('record', function(data){
          promises.push(router.ask(new cmds.ImportInventory(data, req.user), 60000));
        })
        .on('end', function() {
          log.info('Inventory uploaded to server file=%s', fn, req.user);

          when.settle(promises).then(function (results) {
            log.info('Upload of inventory complete results.length=%s', results.length, req.user);
            log.debug('Upload of inventory complete results=%j', results, req.user);

            results.forEach(function(r) {
              if (r.state === 'rejected') {
                log.warn('Import of inventory rejected reason=%j', r.reason, req.user);
                return;
              }
              inventoryData.push(r.value.content.inventory);
            });

            res.json(inventoryData);
          }).catch(function(e) {
            log.error('Failed processing upload responses error=%s', e.toString(), req.user);
            res.json(500, utils.errors.makeError(e));
          });
        });
    });

    req.pipe(busboy);
  }

  $module.exports = {
    all: all,
    update: update,
    shipInventory: shipInventory,
    inventoryForOrderItem: inventoryForOrderItem,
    manufactureOrderItem: manufactureOrderItem,
    upload: upload
  };
  return $module.exports;
};
