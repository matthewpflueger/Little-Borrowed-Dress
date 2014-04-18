'use strict';

module.exports = function $module(when, nodefn, utils, router, cmds) {
  if ($module.exports) {
    return $module.exports;
  }
  $module.exports = {};

  when = when || require('when');
  nodefn = nodefn || require('when/node');
  utils = utils || require('../utils')();
  router = router || require('../commands/router')();
  cmds = cmds || require('../commands/inventory')();


  $module.exports.release = function(req, res) {
    router.ask(new cmds.ReleaseInventory(req.orderitem, req.inventory, req.user)).then(function(r) {
      res.json(r.content.status, r.content);
    }).catch(function(e) {
      res.json(500, utils.errors.makeError(e, 'Inventory release failed'));
    });
  };

  $module.exports.reserve = function(req, res) {
    router.ask(new cmds.ReserveInventory(req.orderitem, req.inventory, req.user)).then(function(r) {
      res.json(r.content.status, r.content);
    }).catch(function(e) {
      res.json(500, utils.errors.makeError(e, 'Inventory reservation failed'));
    });
  };

  return $module.exports;
};
