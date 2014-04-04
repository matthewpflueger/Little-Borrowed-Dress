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

  InventorySchema.methods.isAssignedTo = function(searchBy) {

    return false;
  };

  InventorySchema.methods.hasReservations = function() {
    var r = this.reservations;
    return r && r.length && r.length > 0;
  };

  InventorySchema.methods.availabilityStatusOn = function(date) {
    //FIXME status needs to be something other than 'for order'
    if (this.status !== 'for order') {
      return this.status;
    }
    if (!this.hasReservations()) {
      return 'available';
    }

    var conflicts = this.reservations.reduce(function(pv, cv) {
      if (cv.conflictsWith(date)) {
        pv.push(cv);
      }
      return pv;
    }, []);

    if (conflicts.length) {
      log.info('Inventory conflicts=%j', conflicts, {});
      return 'reserved for ' + conflicts[0].type;
    }

    return 'available';
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

