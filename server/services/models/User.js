'use strict';

module.exports = function $module(mongoose, crypto, helpers) {
  if ($module.exports) {
    return $module.exports;
  }

  mongoose = mongoose || require('mongoose');
  crypto = crypto || require('crypto');
  helpers = helpers || require('./helpers')();

  var UserSchema = new mongoose.Schema({
    createdOn: {
      type: Date,
      default: Date.now,
      required: true
    },
    name: {
      type: String,
      required: true,
      match: /^\S{2,}/
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^\S+@\S+\.\S{2,4}$/
    },
    hashedPassword: {
      type: String,
      required: true,
      match: /^\S{5,}$/
    },
    salt: {
      type: String,
      required: true,
      match: /^\S{5,}$/
    }
  }, helpers.schemaOptions({ collection: 'users' }));


  UserSchema.statics.validate = function(email, password, cb) {
    User.findOne({ email: email }, function(err, user) {
      if (err) {
        return cb(err);
      }
      if (!user) {
        return cb(new Error('Unknown user'));
      }
      if (!user.authenticate(password)) {
        return cb(new Error('Invalid password'));
      }
      return cb(null, user.toObject());
    });
  };

  UserSchema.statics.findByEmail = function(email, cb) {
    User.findOne({ email: email }, '-salt -hashed_password', function(err, user) {
      if (err) {
        return cb(err);
      }
      if (!user) {
        return cb(new Error('Unknown user'));
      } else {
        user = user.toObject();
        delete user._bsontype;
        delete user.createdOn;
        delete user._id;
        delete user.__v;
        return cb(null, user);
      }
    });
  };

  UserSchema.virtual('password').set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
  }).get(function() {
    return this._password;
  });

  UserSchema.methods = {
    /**
     * Authenticate - check if the passwords are the same
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api public
     */
    authenticate: function(plainText) {
      return this.encryptPassword(plainText) === this.hashedPassword;
    },

    /**
     * Make salt
     *
     * @return {String}
     * @api public
     */
    makeSalt: function() {
      return crypto.randomBytes(16).toString('base64');
    },

    /**
     * Encrypt password
     *
     * @param {String} password
     * @return {String}
     * @api public
     */
    encryptPassword: function(password) {
      if (!password || !this.salt) {
        return '';
      }
      var salt = new Buffer(this.salt, 'base64');
      return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
    }
  };

  var User = mongoose.model('User', UserSchema);
  $module.exports = User;
  return User;
};







