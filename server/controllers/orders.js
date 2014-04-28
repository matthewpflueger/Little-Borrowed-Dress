'use strict';

module.exports = function $module(fs, moment, Customer, utils, Busboy, csv, when, _, router, cmds, query) {
  if ($module.exports) {
    return $module.exports;
  }
  $module.exports = {};

  fs = fs || require('fs');
  moment = moment || require('moment');
  Busboy = Busboy || require('busboy');
  csv = csv || require('fast-csv');
  when = when || require('when');
  _ = _ || require('lodash');
  router = router || require('../commands/router')();
  query = query || require('../services/query')();
  cmds = cmds || require('../commands/orderitem')();
  Customer = Customer || require('../services/models/Customer')();
  utils = utils || require('../utils')();


  function all(req, res) {
    query.findCustomerOrdersByDate(req.query).then(function(r) {
      res.json({
        response: 'Success',
        messages: r
      });
    }).catch(query.NotFoundError, function(e) {
      res.json(404, utils.errors.makeError(e, null, 404));
    }).catch(function(e) {
      res.json(500, utils.errors.makeError(e));
    });
  }

  function order(req, res) {
    var customer = req.customer;
    var o = req.order;
    log.info('Adding to order=%j, orderitem=%j, customer=%j', o, req.body, customer, req.user);

    var orderitem = o.addOrderItem(req.body);
    customer.addNote(req.body.note, req.user, 'OrderItem', orderitem);
    customer.save(function(err, customer) {
      if (err) {
        log.error('Failed to save customer=%j, error=%j', customer, err, req.user);
        return res.json(500, utils.errors.makeError(err, 'Failed to save'));
      }

      var coi = customer.findOrderItem(orderitem);

      log.info('Added to order=%j, orderitem=%j, customer=%j', coi.order, coi.orderitem, coi.customer, req.user);

      res.json({
        customer: coi.customer.toJSON(),
        order: coi.order.toJSON(),
        orderitem: coi.orderitem.toJSON()
      });
    });
  }

  function update(req, res) {
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
  }

  function upload(req, res) {
    res.setHeader('Content-Type', 'text/html');

    var busboy = new Busboy({ headers: req.headers });
    var fn = null;
    var customersById = {};
    var promises = [];
    var records = [];
    var errors = [];

    busboy.on('file', function(fieldname, file, filename) {
      fn = filename;
      csv
        .fromStream(file, {headers : true, ignoreEmpty: true, trim: true})
        .on('parse-error', function(err) {
          log.error('Error parsing during order import error=%j', err, req.user);
        })
        .on('record', function(data){
          //Seriously crappy data export causes issues when converting to JSON
          if (data.Size) {
            data.Size = data.Size.split('&quot;').join('');
          }
          if (data['Free 2nd Size']) {
            data['Free 2nd Size'] = data['Free 2nd Size'].split('&quot;').join('');
          }

          records.push(data);
          promises.push(router.ask(new cmds.ImportOrderItems(data, req.user), 60000));
        })
        .on('end', function() {
          log.info('Order items uploaded to server file=%s, rows=%s', fn, promises.length, req.user);

          when.settle(promises).then(function (results) {
            log.info('Upload of order items complete results.length=%s', results.length, req.user);
            log.debug('Upload of order items complete results=%j', results, req.user);

            _.each(results, function(r, i) {
              if (r.state === 'rejected') {
                log.warn('Add order item rejected reason=%j, record=%j', r.reason, records[i], req.user);
                var ec = r.reason.content || r.reason;
                records[i].error = ec.error || ec.message || JSON.stringify(ec);
                errors.push(records[i]);
                return;
              }


              var content = r.value.content;
              var status = content.status;
              var message = content.message;
              var customer = content.customer;
              if (!customer || !customer.id) {
                log.warn(
                  'Failed to created orderitem status=%s, message=%s, error=%s',
                  status, message, content.error, req.user);
                records[i].error = '' + content.error + ', status: ' + status + ', message: ' + message;
                errors.push(records[i]);
                return;
              }

              log.info(
                'Created orderitem status=%s, message=%s, customer=%s',
                status, message, customer.id, req.user);

              if (!customersById[customer.id] || customersById[customer.id].__v < customer.__v) {
                customersById[customer.id] = customer; //r.value.content;
              }
            });

            var error = {};
            var vals = _.values(customersById);
            log.info('Uploaded orderitems for customers=%s', vals.length, req.user);
            if (errors.length) {
              var errorfn = 'errors_' + moment(new Date()).format('YYYYMMDDHHmmss') + fn;
              var errorfnDownload = 'tmp/' + errorfn;
              var errorfile = conf.get('clientPath') + '/' + errorfnDownload;
              var csvErrorStream = csv.createWriteStream({headers: true});
              var writableStream = fs.createWriteStream(errorfile);

              log.error('Encountered during order upload errors=%j, errorfile=%s', errors, errorfile, req.user);

              writableStream.on('finish', function(){
                log.debug('Done writing error errorfile=%s', errorfile, req.user);
              });

              csvErrorStream.pipe(writableStream);
              _.each(errors, function(e) { csvErrorStream.write(e); });
              csvErrorStream.write(null);

              error.message = '' + errors.length + ' records failed to import.';
              error.href = errorfnDownload;
              error.link = 'Click here to download the failed records.';
            }

            res.json({
              error: error,
              customers: vals
            });
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
    order: order,
    update: update,
    upload: upload
  };
  return $module.exports;
};
