'use strict';

module.exports = function $module() {
  if ($module.exports) {
    return $module.exports;
  }

  function ImportInventory(data, options) {
    options = options || {};
    this.routingKey = options.routingKey || ImportInventory.routingKey;
    this.data = data;
  }
  ImportInventory.routingKey = 'commands.inventory.import';

  function InventoryImported(status, message, inventory, options) {
    options = options || {};
    this.routingKey = options.routingKey || InventoryImported.routingKey;
    this.status = status;
    this.message = message;
    this.inventory = inventory.toJSON();
  }
  InventoryImported.routingKey = 'events.inventory.import';

  $module.exports = {
    ImportInventory: ImportInventory,
    InventoryImported: InventoryImported
  };

  return $module.exports;
};
