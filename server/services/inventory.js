'use strict';

var context = require('rabbit.js').createContext();
var Rx = require('rx');
var _ = require('lodash');
var Inventory = require('mongoose').model('Inventory');

context.on('ready', function() {
  log.info('In context on ready');
  var pub = context.socket('PUB');
  pub.connect('events');
  module.exports.tell = _.partialRight(pub.write.bind(pub), 'utf8');

  var sub = context.socket('SUB');
  sub.setEncoding('utf8');
  sub.connect('events');

  Rx.Node.fromStream(sub)
    .map(function(x) { return JSON.parse(x); })
    .subscribe(function(x) {
      log.info('received data! %s', x['Tag ID']);
      Inventory.import(x, function(err, m) {
        if (err) {
          log.error('Could not save Inventory %s', err);
        } else {
          log.info('Saved inventory with tagID=', m.tagId);
        }
      });
    });
});
