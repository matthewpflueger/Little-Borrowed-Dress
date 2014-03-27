'use strict';

module.exports = function $module(db, mongoose) {
  if ($module.exports) {
    return $module.exports;
  }

  db = db || conf.get('db');
  mongoose = mongoose || require('mongoose');

  mongoose.connect(db);

  var models = {};
  models.User = require('./users')();
  models.Inventory = require('./inventory')();

  $module.exports = models;
  return models;
};

