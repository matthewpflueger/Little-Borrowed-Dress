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
    var records = [];
    var errors = [];


    busboy.on('file', function(fieldname, file, filename) { //, encoding, mimetype) {
      fn = filename;
      csv
        .fromStream(file, {headers : true, ignoreEmpty: true, trim: true})
        .on('parse-error', function(err) {
          log.error('Error parsing during inventory import error=%j', err, req.user);
        })
        .on('record', function(data){
          records.push(data);
          promises.push(router.ask(new cmds.ImportInventory(data, req.user), 60000));
        })
        .on('end', function() {
          log.info('Inventory uploaded to server file=%s', fn, req.user);

          when.settle(promises).then(function (results) {
            log.info('Upload of inventory complete results.length=%s', results.length, req.user);
            log.debug('Upload of inventory complete results=%j', results, req.user);

            _.each(results, function(r, i) {
              if (r.state === 'rejected') {
                log.warn('Import of inventory rejected reason=%j, record=%j', r.reason, records[i], req.user);
                var ec = r.reason.content || r.reason;
                records[i].error = ec.error || ec.message || JSON.stringify(ec);
                errors.push(records[i]);
                return;
              }

              inventoryData.push(r.value.content.inventory);
            });

            //FIXME duplicated from controllers/orders :(
            var error = {};
            if (errors.length) {
              var errorfn = 'errors_' + moment(new Date()).format('YYYYMMDDHHmmss') + fn;
              var errorfnDownload = 'tmp/' + errorfn;
              var errorfile = conf.get('clientPath') + '/' + errorfnDownload;
              var csvErrorStream = csv.createWriteStream({headers: true});
              var writableStream = fs.createWriteStream(errorfile);

              log.error('Encountered during inventory upload errors=%j, errorfile=%s', errors, errorfile, req.user);

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
              inventory: inventoryData
            });
            // res.json(inventoryData);
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
