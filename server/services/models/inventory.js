'use strict';

module.exports = function $module(mongoose, uuid, _, ItemDescription, Reservation, helpers) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');
  uuid = uuid || require('node-uuid');
  _ = _ || require('lodash');
  ItemDescription = ItemDescription || require('./ItemDescription')();
  Reservation = Reservation || require('./Reservation')();
  helpers = helpers || require('./helpers')();

  var InventorySchema = new mongoose.Schema({
    createdOn: {
      type: Date,
      default: Date.now,
      required: true
    },
    manufacturedOn: {
      type: Date,
      required: true
    },
    productNumber: {
      type: Number,
      min: 0,
      required: true,
      unique: true
    },
    status: {
      type: String,
      trim: true,
      lowercase: true,
      required: true
    },
    tagId: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      unique: true
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    location: {
      type: String,
      default: '',
      trim: true
    },
    itemDescription: {
      type: [ItemDescription.schema],
      required: true
    },
    reservations: [Reservation.schema]
  }, helpers.schemaOptions({ collection: 'inventory' }));

  InventorySchema.index({ style: 1, color: 1, size: 1});


  function makeTagId(tagId) {
    if (!tagId || /.*n\/a.*/i.test(tagId) || /^\s*$/.test(tagId)) {
      return uuid.v4();
    }
    return tagId;
  }

  InventorySchema.statics.makeTagId = makeTagId;

  InventorySchema.methods.release = function(customer, order, orderitem) {
    //FIXME cannot release inventory if:
    //  - now is past reservationEnd
    //  - inventory/orderitem is no longer editable
    //    - inventory/orderitem has shipped

    log.info(
      'Releasing inventory=%j, order=%j, orderitem=%j, customer=%j',
      this, order, orderitem, customer, {});

    var conflicts = this.reservationConflicts(order.forDate, orderitem);

    log.info('Found conflicts=%j, inventory=%j', conflicts, this, {});

    if (!conflicts.length || conflicts[0].status !== 'assigned') {
      log.error(
        'Not assigned inventory=%j, customer=%j, order=%j, orderitem=%j',
        this, customer, order, orderitem, {});
      return false;
    }

    //FIXME this really should be a cancel - not a removal
    //we really should have an event list and just do rollups as necessary...
    this.reservations.id(conflicts[0].reservation._id).remove();
    return true;
  };

  InventorySchema.methods.reserve = function(customer, order, orderitem) {
    log.info(
      'Looking for availability for order=%j, orderitem=%j, customer=%j, inventory=%j',
      order, orderitem, customer, this, {});
    if (this.availabilityStatus(order.forDate, orderitem) !== 'available') {
      log.warn(
        'Not available inventory=%j, customer=%j, order=%j, orderitem=%j',
        this, customer, order, orderitem, {});
      return false;
    }

    var rsvp = this.reservations.create({});
    rsvp.make(customer, order, orderitem);
    this.reservations.push(rsvp);
    return true;
  };

  InventorySchema.methods.isAssignedTo = function(searchBy) {
    return _.find(this.reservations, function(r) { return r.isAssignedTo(searchBy); }) !== undefined;
  };

  InventorySchema.methods.hasReservations = function() {
    var r = this.reservations;
    return r && r.length && r.length > 0;
  };

  InventorySchema.methods.availableOn = function(date) {
    return this.availabilityStatusOn(date) === 'available';
  };

  InventorySchema.methods.reservationConflicts = function(date, orderitem) {
    if (!this.hasReservations()) {
      return [];
    }

    date = date || Date.now();

    var conflicts = this.reservations.reduce(function(pv, cv) {
      if (cv.isAssignedTo(orderitem)) {
        //make sure if this inventory is assigned to the given orderitem it comes first...
        pv = [{ status: 'assigned', reservation: cv }].concat(pv);
      } else if (cv.conflictsWith(date)) {
        pv.push({ status: 'reserved for ' + cv.orderNumber || cv.type, reservation: cv });
      }
      return pv;
    }, []);

    log.info('Reservation conflicts=%j, inventory=%j, date=%s, orderitem=%j',
      conflicts, this, date, orderitem, {});
    return conflicts;
  };

  InventorySchema.methods.availabilityStatus = function(date, orderitem) {
    //FIXME status needs to be something other than 'for order'
    if (this.status !== 'for order') {
      log.info(
        'Not available for reservation inventory=%j, date=%s, orderitem=%j',
        this, date, orderitem, {});
      return this.status;
    }

    return this.reservationConflicts(date, orderitem).concat([{ status: 'available' }])[0].status;
  };

  InventorySchema.methods.availabilityStatusOn = function(date) {
    return this.availabilityStatus({ date: date });
  };

  InventorySchema.methods.import = function(rec) {
    this.manufacturedOn = new Date(rec['Prod Date']);
    this.productNumber = rec['Prod #'];
    this.status = rec.Status;
    this.tagId = makeTagId(rec.tagId || rec['Tag ID']);
    this.notes = rec.Notes;

    var desc = this.itemDescription.create({});
    desc.import(rec);
    this.itemDescription.push(desc);
  };

  var Inventory = mongoose.model('Inventory', InventorySchema);
  $module.exports = Inventory;
  return Inventory;
};

