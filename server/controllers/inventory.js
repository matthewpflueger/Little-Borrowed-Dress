'use strict';

module.exports = function $module(Busboy, csv, when, router, cmds, Customer, utils, _, Inventory) {
  if ($module.exports) {
    return $module.exports;
  }
  $module.exports = {};

  Busboy = Busboy || require('busboy');
  csv = csv || require('fast-csv');
  when = when || require('when');
  router = router || require('../commands/router')();
  cmds = cmds || require('../commands/inventory')();
  Customer = Customer || require('../services/models/Customer')();
  utils = utils || require('../utils')();
  _ = _ || require('lodash');
  Inventory = Inventory || require('../services/models/Inventory')();

  $module.exports.inventoryForOrderitem = function(req, res) {
    log.info('Querying inventory for orderitem=%j, style=%s, color=%s, size=%s',
      req.orderitem, req.query.style, req.query.color, req.query.size, {});

    // var customer = req.customer;
    var order = req.order;
    var orderitem = req.orderitem;
    var params = {};

    if (req.query.style === 'true') {
      params['itemDescription.style'] = orderitem.itemDescription[0].style;
    }
    if (req.query.color === 'true') {
      params['itemDescription.color'] = orderitem.itemDescription[0].color;
    }
    if (req.query.size === 'true') {
      //don't do exact matches on size as this is often too restrictive...
      params['itemDescription.size'] = orderitem.itemDescription[0].size[0];
    }

    if (!Object.keys(params)) {
      //always filter by something...
      params['itemDescription.style'] = orderitem.itemDescription[0].style;
      params['itemDescription.color'] = orderitem.itemDescription[0].color;
      params['itemDescription.size'] = orderitem.itemDescription[0].size;
    }

    log.info('Query inventory params=%j', params, {});

    Inventory.find(params).exec(function(err, results) {
      if (err) {
        log.error('Inventory query failed error=%j', err, req.user);
        res.send(500, utils.errors.makeError(err, 'Inventory query failed'));
        return;
      }

      if (!results) {
        log.info(
          'No inventory found for params=%j, orderitem=%s',
          params, orderitem.id, req.user);
        res.send(404, utils.errors.makeError('No matching inventory found'));
        return;
      }

      var inventories = [];
      results.forEach(function(r) {
        inventories.push({
          availabilityStatus: r.availabilityStatus(order.forDate, orderitem),
          inventory: r
        });
      });
      res.json(inventories);
    });
  };

  $module.exports.manufacture = function(req, res) {
    //for customer
    //for order
    //for order item
    //create an inventory
    //mark it as to be manufactured
    //mark it as reserved for order/orderitem
    //

  };

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
  };

  return $module.exports;
};
