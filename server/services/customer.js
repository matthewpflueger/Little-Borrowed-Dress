'use strict';

var context = require('rabbit.js').createContext();
var Rx = require('rx');
var _ = require('lodash');
var Customer = require('mongoose').model('Customer');

context.on('ready', function() {
  log.info('In context on ready');
  var pub = context.socket('PUB');
  pub.connect('customers');
  module.exports.tell = _.partialRight(pub.write.bind(pub), 'utf8');

  var sub = context.socket('SUB');
  sub.setEncoding('utf8');
  sub.connect('customers');

  Rx.Node.fromStream(sub)
    .map(function(x) { return JSON.parse(x); })
    .subscribe(function(x) {
      log.info('received data! %s', x.ORDER);
      Customer.import(x, function(err, m) {
        if (err) {
          log.error('Could not create Customer %s', err);
        } else {
          log.info('Saved Customer ', m.email, m.id);
        }
      });
    });
});
