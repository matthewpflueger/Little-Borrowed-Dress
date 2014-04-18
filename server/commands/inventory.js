'use strict';

module.exports = function $module(_) {
  if ($module.exports) {
    return $module.exports;
  }

  _ = _ || require('lodash');

  function ShipInventory(orderitem, user, options) {
    _.assign(_.defaults(this, ShipInventory), options);
    this.orderitem = orderitem._id || orderitem;
    this.user = user;
  }
  ShipInventory.routingKey = 'commands.inventory.ship';

  function InventoryShipped(
      availabilityStatus,
      inventory,
      customer,
      order,
      orderitem,
      options) {
    _.assign(_.defaults(this, InventoryShipped), options);
    this.availabilityStatus = availabilityStatus;
    this.inventory = inventory.toJSON();
    this.customer = customer.toJSON();
    this.order = order.toJSON();
    this.orderitem = orderitem.toJSON();
  }
  InventoryShipped.routingKey = 'events.inventory.shipped';
  InventoryShipped.status = 200;
  InventoryShipped.message = 'Inventory for order item shipped';


  function RequestManufactureInventory(orderitem, user, options) {
    _.assign(_.defaults(this, RequestManufactureInventory), options);
    this.orderitem = orderitem._id || orderitem;
    this.user = user;
  }
  RequestManufactureInventory.routingKey = 'commands.inventory.manufacture.request';

  function InventoryManufactureRequested(
      availabilityStatus,
      inventory,
      customer,
      order,
      orderitem,
      options) {
    _.assign(_.defaults(this, InventoryManufactureRequested), options);
    this.availabilityStatus = availabilityStatus;
    this.inventory = inventory.toJSON();
    this.customer = customer.toJSON();
    this.order = order.toJSON();
    this.orderitem = orderitem.toJSON();
  }
  InventoryManufactureRequested.routingKey = 'events.inventory.manufacture.requested';
  InventoryManufactureRequested.status = 201;
  InventoryManufactureRequested.message = 'Inventory manufacture requested';


  function ReserveInventory(orderitem, inventory, user, options) {
    _.assign(_.defaults(this, ReserveInventory), options);
    this.orderitem = orderitem._id || orderitem;
    this.inventory = inventory._id || inventory;
    this.user = user;
  }
  ReserveInventory.routingKey = 'commands.inventory.reserve';

  function InventoryReserved(
      availabilityStatus,
      inventory,
      customer,
      order,
      orderitem,
      options) {
    _.assign(_.defaults(this, InventoryReserved), options);
    this.availabilityStatus = availabilityStatus;
    this.inventory = inventory.toJSON();
    this.customer = customer.toJSON();
    this.order = order.toJSON();
    this.orderitem = orderitem.toJSON();
  }
  InventoryReserved.routingKey = 'events.inventory.reserved';
  InventoryReserved.status = 200;
  InventoryReserved.message = 'Inventory reserved';


  function ReleaseInventory(orderitem, inventory, user, options) {
    _.assign(_.defaults(this, ReleaseInventory), options);
    this.orderitem = orderitem._id || orderitem;
    this.inventory = inventory._id || inventory;
    this.user = user;
  }
  ReleaseInventory.routingKey = 'commands.inventory.release';

  function InventoryReleased(
      availabilityStatus,
      inventory,
      customer,
      order,
      orderitem,
      options) {
    _.assign(_.defaults(this, InventoryReleased), options);
    this.availabilityStatus = availabilityStatus;
    this.inventory = inventory.toJSON();
    this.customer = customer.toJSON();
    this.order = order.toJSON();
    this.orderitem = orderitem.toJSON();
  }
  InventoryReleased.routingKey = 'events.inventory.released';
  InventoryReleased.status = 200;
  InventoryReleased.message = 'Inventory released';


  function ImportInventory(data, options) {
    _.assign(_.defaults(this, ImportInventory), options);
    this.data = data;
  }
  ImportInventory.routingKey = 'commands.inventory.import';

  function InventoryImported(status, message, inventory, options) {
    _.assign(_.defaults(this, InventoryImported), options);
    this.inventory = inventory.toJSON();
  }
  InventoryImported.routingKey = 'events.inventory.import';
  InventoryImported.status = 201;
  InventoryImported.message = 'Inventory imported';

  $module.exports = {
    ShipInventory: ShipInventory,
    InventoryShipped: InventoryShipped,
    RequestManufactureInventory: RequestManufactureInventory,
    InventoryManufactureRequested: InventoryManufactureRequested,
    ReserveInventory: ReserveInventory,
    InventoryReserved: InventoryReserved,
    ReleaseInventory: ReleaseInventory,
    InventoryReleased: InventoryReleased,
    ImportInventory: ImportInventory,
    InventoryImported: InventoryImported
  };

  return $module.exports;
};
