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
  models.User = require('./users')();
  models.Inventory = require('./inventory')();
  models.Customer = require('./customers')();
  models.Order = require('./order')();
  models.OrderItem = require('./orderitem')();
  models.Address = require('./address')();
  models.Telephone = require('./telephone')();


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

