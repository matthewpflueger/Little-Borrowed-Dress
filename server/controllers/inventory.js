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
        log.error('Inventory query failed %s', err);
        res.send(500, utils.errors.makeError(err, 'Inventory query failed'));
        return;
      }

      if (!results) {
        log.info(
          'No inventory found for params=%j, orderitem=%s',
          params, orderitem.id, {});
        res.send(404, utils.errors.makeError('No inventory!'));
        return;
      }

      log.info('RESULTS');
      var inventories = [];
      results.forEach(function(r) {
        var availabilityStatus = null;
        if (r.isAssignedTo(orderitem)) {
          availabilityStatus = 'assigned';
        } else {
          availabilityStatus = r.availabilityStatusOn(order.weddingDate);
        }

        inventories.push({
          availabilityStatus: availabilityStatus,
          inventory: r
        });
    //     // if (r.reservableOn(order.weddingDate)) {
    //     //   //we found a dress!
    //     //   var rsvp = r.reservations.create({});
    //     //   rsvp.orderitem = orderitem.id;
    //     //   rsvp.orderNumber = order.orderNumber;
    //     //   rsvp.date = order.weddingDate;
    //     //   rsvp.customerEmail = customer.email;
    //     //   rsvp.customerName = customer.name;
    //     //   rsvp.customerTelephone = customer.telephone;
    //     //   r.reservations.push(rsvp);

        // log.info('FOUND A DRESS ', JSON.stringify(r.toJSON()));
    //     //   when.join(
    //     //     router.ask(new cmds.ReserveInventory(r, orderitem, order, customer)),
    //     //     router.ask(new cmds.FulfillOrderItem(orderitem, r))
    //     //   ).then(function() {
    //     //     log.info(
    //     //       'Reserved inventory=%s, orderitem=%s, order=%s, customer=%s',
    //     //       r.tagId, orderitem.id, order.orderNumber, customer.email);
    //     //     router.ack(msg);
    //     //   }).catch(function(e) {
    //     //     log.error(
    //     //       'Failed to reserve inventory=%s, orderitem=%s, order=%s, customer=%s, error=%s',
    //     //       r.tagId, orderitem.id, order.orderNumber, customer.email, e);
    //     //     router.tell(new cmds.ReleaseInventory(r, orderitem, order, customer));
    //     //     router.tell(new cmds.UnfulfillOrderItem(orderitem, r));
    //     //     router.noAck(msg);
    //     //   });
    //     //   return;
    //     // }
    //     log.info(JSON.stringify(r.toJSON()));
      });

      res.json(inventories);
    });
  };

  $module.exports.orderitem = function(req, res, next, id) {
    log.info('Loading orderitem=%s', id);
    Customer.findOne({ 'orders.orderitems._id': id }).exec(function(err, customer) {
      if (err) {
        return next(err);
      }
      if (!customer) {
        return next(new Error('Failed to load customer ' + id));
      }

      log.info('Found customer=%j', customer, {});
      req.customer = customer;

      //FIXME just horrible - need I say more...
      var found = false;
      _.forEach(customer.orders, function(o) {
        _.forEach(o.orderitems, function(oi) {
          log.info('Inspecting orderitem=%j', oi, {});
          if (oi.id === id) {
            log.info('Found orderitem=%s', id);
            req.orderitem = oi;
            req.order = o;
            found = true;
            return false;
          }
        });

        if (found) {
          return false;
        }
      });

      if (!found) {
        return next(new Error('Failed to load orderitem ' + id));
      }
      next();
    });
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
