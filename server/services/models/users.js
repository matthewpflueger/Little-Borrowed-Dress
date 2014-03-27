'use strict';

module.exports = function(mongoose, crypto) {
  mongoose = mongoose || require('mongoose');
  crypto = crypto || require('crypto');

  var UserSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      match: /\S{5,}/
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /\S+@\S\.\S{2, 4}$/
    },
    hashedPassword: {
      type: String,
      required: true,
      match: /\S+/
    },
    salt: {
      type: String,
      required: true,
      match: /\S+/
    }
  });

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

  return mongoose.model('User', UserSchema);
};







