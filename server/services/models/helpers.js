'use strict';

module.exports = function $module(_) {
  if ($module.exports) {
    return $module.exports;
  }

  _ = _ || require('lodash');

  function deletePassword(doc, ret) {
    delete ret.salt;
    delete ret.hashedPassword;
    delete ret._password;
  }

  var defaultToOptions = { transform: deletePassword, getters: true };
  var defaultSchemaOptions = {
    autoIndex: false,
    toJSON: defaultToOptions,
    toObject: defaultToOptions
  };

  function schemaOptions(options) {
    return _.extend(options || {}, defaultSchemaOptions);
  }

  $module.exports = {
    schemaOptions: schemaOptions
  };
  return $module.exports;
};