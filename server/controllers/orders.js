'use strict';

module.exports = function $module(Customer, utils, Busboy, csv, when, _, hl, rx, router, commands) {
  if ($module.exports) {
    return $module.exports;
  }
  $module.exports = {};

  Busboy = Busboy || require('busboy');
  csv = csv || require('fast-csv');
  when = when || require('when');
  _ = _ || require('lodash');
  hl = hl || require('highland');
  rx = rx || require('rx');
  router = router || require('../commands/router')();
  commands = commands || require('../commands/orderitem')();
  Customer = Customer || require('../services/models/Customer')();
  utils = utils || require('../utils')();


  $module.exports.all = function(req, res) {
    Customer.find().sort('-created').exec(function(err, customers) {
      if (err) {
        res.render('error', { status: 500 });
      } else {
        var responseObj = {
          response: 'Success',
          messages: customers
        };
        res.json(responseObj);
      }
    });
  };

  $module.exports.order = function(req, res) {
    var customer = req.customer;
    var order = req.order;
    log.info('Adding to order=%j, orderitem=%j, customer=%j', order, req.body, customer, req.user);

    var orderitem = order.importOrderItem(req.body);
    customer.save(function(err, customer) {
      if (err) {
        log.error('Failed to save customer=%j, error=%j', customer, err, req.user);
        return res.json(500, utils.errors.makeError(err, 'Failed to save'));
      }

      var o = customer.findOrder(order);
      var oi = o.findOrderItem(orderitem);

      log.info('Added to order=%j, orderitem=%j, customer=%j', o, oi, customer, req.user);

      res.json({
        customer: customer.toJSON(),
        order: o.toJSON(),
        orderitem: oi.toJSON()
      });
    });
  };

  $module.exports.update = function(req, res) {
    var customer = req.customer;
    log.info('Updating customer=%s, body=%j', customer.email, req.body, req.user);
    //FIXME currently we ignore versioning because multiple updates to the same record will fail
    //because while we send back the updated customer object the client DOES NOT use it in its
    //model thereby never getting the new version number of the document :(
    customer.set('name', req.body.name);
    customer.set('email', req.body.email);
    customer.set('telephone', req.body.telephone);
    customer.set('orders', req.body.orders);
    log.info('About to save customer=%j', customer, {});
    customer.save(function(err, customer) {
      if (err) {
        log.error('Failed to save customer=%j, error=%j', customer, err, req.user);
        return res.json(500, utils.errors.makeError(err, 'Failed to save'));
      }
      res.json(customer.toJSON());
    });
  };

  $module.exports.upload = function (req, res) {
    res.setHeader('Content-Type', 'text/html');

    var fileUploadMessage = '';

    var busboy = new Busboy({ headers: req.headers });
    var fn = null;
    var messages = {};
    var promises = [];


    busboy.on('file', function(fieldname, file, filename) {
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
                var customer = r.value.content.customer;
                var order = r.value.content.order;
                var orderitem = r.value.content.orderitem;
                log.info(
                  'Added orderitem=%s, order=%s, customer=%s, customer.__v=%s',
                  orderitem.hash, order.orderNumber, customer.email, customer.__v);
                if (!messages[customer.id] || messages[customer.id].customer.__v < customer.__v) {
                  messages[customer.id] = r.value.content;
                }
              }
            });

            messages = _.values(messages);
            var responseObj = {
              response: fileUploadMessage,
              messages: messages
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
