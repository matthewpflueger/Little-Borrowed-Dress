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
  models.User = require('./User')();
  models.Inventory = require('./Inventory')();
  models.Customer = require('./Customer')();
  models.Order = require('./Order')();
  models.OrderItem = require('./OrderItem')();
  models.Address = require('./Address')();
  models.ItemDescription = require('./ItemDescription')();


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

