'use strict';

module.exports = function $module(router, Inventory, cmds, utils) {
  if ($module.exports) {
    return $module.exports;
  }

  router = router || require('../commands/router')();
  Inventory = Inventory || require('./models/Inventory')();
  cmds = cmds || require('../commands/inventory')();
  utils = utils || require('../utils')();


  function importInventory(msg) {
    var corrId = msg.properties.correlationId;
    log.info('Importing inventory from message=%s', corrId);

    var rec = msg.content.data;
    var tagId = Inventory.makeTagId(rec['Tag ID']);
    rec['Tag ID'] = tagId;

    Inventory.findOne({ tagId: tagId }, function(err, inventory) {
      if (err) {
        log.error('Error finding inventory=%s, error=%s, message=%s', tagId, err, corrId);
        router.reply(msg, utils.errors.makeError(err));
        return;
      }

      if (!inventory) {
        inventory = new Inventory();
        inventory.import(rec);
        inventory.save(function(err, i) {
          if (err) {
            log.error('Error saving inventory=%s, error=%s, message=%s', inventory.tagId, err, corrId);
            router.reply(msg, utils.errors.makeError(err));
          } else {
            log.info('Imported inventory=%s, message=%s', inventory.tagId, corrId);
            var res = new cmds.InventoryImported(201, 'Inventory created', i);
            router.reply(msg, res);
            router.tell(res);
          }
        });
      } else {
        log.info('Already exists inventory=%s, message=%s', inventory.tagId, corrId);
        router.reply(msg, new cmds.InventoryImported(304, 'Inventory already exists', inventory));
      }
    });
  }

  router.receive(cmds.ImportInventory.routingKey, importInventory);

  $module.exports = {};
  return {};
};
