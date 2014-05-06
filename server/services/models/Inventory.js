'use strict';

module.exports = function $module(mongoose, uuid, _, ItemDescription, Reservation, Note, helpers) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');
  uuid = uuid || require('node-uuid');
  _ = _ || require('lodash');
  ItemDescription = ItemDescription || require('./ItemDescription')();
  Reservation = Reservation || require('./Reservation')();
  Note = Note || require('./Note')();
  helpers = helpers || require('./helpers')();

  var InventorySchema = new mongoose.Schema({
    createdOn: {
      type: Date,
      default: Date.now,
      required: true
    },
    importedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    manufactureRequestedOn: Date,
    manufactureSentOn: Date,
    manufacturedOn: Date,
    productNumber: {
      type: Number,
      // min: 0,
      default: 0,
      required: true,
      // unique: true
    },
    status: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      required: true
    },
    tagId: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      required: true,
      // unique: true
    },
    location: {
      type: String,
      default: 'warehouse',
      trim: true
    },
    receiveBackBy: Date,
    itemDescription: {
      type: [ItemDescription.schema],
      required: true
    },
    notes: [Note.schema],
    reservations: [Reservation.schema],
  }, helpers.schemaOptions({ collection: 'inventory' }));

  InventorySchema.index({ style: 1, color: 1, size: 1});


  function makeTagId(tagId) {
    if (!tagId || !/^3035/.test(tagId)) {
      return uuid.v4();
    }
    return tagId;
  }

  InventorySchema.statics.makeTagId = makeTagId;

  InventorySchema.methods.revertShipForReservation = function(orderitem) {
    var rsvp = this.reservationFor(orderitem);
    this.receiveBackBy = undefined;
    rsvp.shippedOn = undefined;
    rsvp.shippedBy = undefined;
    this.location = 'warehouse';
  };

  InventorySchema.methods.shipForReservation = function(orderitem, user) {
    var rsvp = this.reservationFor(orderitem);
    this.receiveBackBy = rsvp.receiveBackBy;
    rsvp.ship(user);
    this.location = 'customer';
  };

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


  InventorySchema.statics.manufactureForOrderItem = function(customer, order, orderitem, productNumber) {
    var i = new Inventory();
    i.manufactureRequestedOn = new Date();
    i.itemDescription.push(orderitem.itemDescription[0]);
    i.productNumber = productNumber;
    i.status = 'ok';
    i.tagId = this.makeTagId();
    i.location = 'manufacturer';

    if (!i.reserve(customer, order, orderitem)) {
      throw new Error('Unexpected failure reserving inventory to be manufactured');
    }
    i.receiveBackBy = i.reservations[0].reservationStart;
    return i;
  };

  /**
   * Create a reservation on the inventory for the given orderitem.
   *
   * NOTE: Idempotent
   *
   * @param  {[type]} customer  [description]
   * @param  {[type]} order     [description]
   * @param  {[type]} orderitem [description]
   * @return {Boolean}          true if successful/already exists
   */
  InventorySchema.methods.reserve = function(customer, order, orderitem) {
    log.info(
      'Looking for availability for order=%j, orderitem=%j, customer=%j, inventory=%j',
      order, orderitem, customer, this, {});

    var stat = this.availabilityStatus(order.forDate, orderitem);
    if (stat === 'assigned') {
      log.info(
        'Already reserved inventory=%j, customer=%j, order=%j, orderitem=%j',
        this, customer, order, orderitem, {});
      return true;
    } else if (stat !== 'available') {
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

  InventorySchema.methods.isAssignedTo = function(orderitem) {
    return this.reservationFor(orderitem) !== undefined;
  };

  InventorySchema.methods.hasReservations = function() {
    var r = this.reservations;
    return r && r.length && r.length > 0;
  };

  InventorySchema.methods.availableOn = function(date) {
    return this.availabilityStatusOn(date) === 'available';
  };

  InventorySchema.methods.reservationFor = function(orderitem) {
    return _.find(this.reservations, function(r) { return r.isAssignedTo(orderitem); });
  };

  InventorySchema.methods.reservationConflicts = function(date, orderitem) {
    //FIXME we need to take into account the manufacturing of a dress in the reservation request!

    if (!this.hasReservations()) {
      log.info('No reservations for inventory=%j', this, {});
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
    if (this.status !== 'ok') {
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
    this.tagId = makeTagId(rec.tagId || rec['Tag ID']);
    this.manufacturedOn = new Date(rec['Prod Date']);
    this.productNumber = rec.Prod;
    if (!rec.Notes || /^\s*$/.test(rec.Notes) || /OK/ig.test(rec.Notes)) {
      this.status = 'ok';
    } else {
      this.status = rec.Notes;
    }

    if (/Trunk/gi.test(rec.Status)) {
      this.location = rec.Status;
    } else if (/Purchase/gi.test(rec.Status)) {
      this.location = 'purchase';
    }

    var desc = this.itemDescription.create({});
    desc.import(rec);
    this.itemDescription.push(desc);
  };

  InventorySchema.methods.update = function(rec, user) {
    _.each(rec.reservations, function(r) {
      var res = _.find(this.reservations, function(tr) {
        return tr._id.toString() === r._id.toString();
      }, this);
      if (res) {
        res.update(r);
      }
    }, this);

    //FIXME probably a much better way to do readonly fields
    delete rec.createdOn;
    delete rec.id;
    delete rec._id;
    delete rec.__v;
    delete rec.createdOn;
    delete rec.importedBy;
    delete rec.location;
    delete rec.receiveBackBy;
    delete rec.notes;
    delete rec.reservations;
    delete rec.manufactureRequestedOn;
    delete rec.manufactureSentOn;
    delete rec.manufacturedOn;
    delete rec.location;

    _.assign(this, rec);
    this.updatedOn = new Date();
    this.updatedBy = user.id || user;
    return this;
  };

  var Inventory = mongoose.model('Inventory', InventorySchema);
  $module.exports = Inventory;
  return Inventory;
};

