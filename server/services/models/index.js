'use strict';

module.exports = function $module(mongoose) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');

  //this is here for easy command line usage...
  require('../../config')();
  require('../../log')();

  mongoose.connect(conf.get('db'));

  var models = {};
  //sub-docs
  models.ItemDescription = require('./ItemDescription')();
  models.Address = require('./Address')();
  models.Reservation = require('./Reservation')();
  models.OrderItem = require('./OrderItem')();
  models.Order = require('./Order')();

  //collections
  models.User = require('./User')();
  models.Inventory = require('./Inventory')();
  models.Customer = require('./Customer')();


  models.save = function(model) {
    model.save(function(err, m) {
      if (err) {
        log.error(err);
        return null;
      } else {
        return m;
      }
    });
  };

  $module.exports = models;
  return models;
};

