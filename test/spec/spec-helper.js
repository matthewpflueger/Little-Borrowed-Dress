'use strict';

require('../server/config')();
require('../server/log')();

/**
 * Require and return the file the spec is testing based on the spec's filename.
 * For example, given the path <spec dir>/server/services/models/Reservation.spec.js
 * this function will essentially do:
 *
 * return require('../server/services/models/Reservation');
 *
 * @param  {String} filename
 * @return {Function} whatever was required typically a Function in this application
 */
function frequire(filename) {
  var s = filename.split(__dirname);
  s = s[1].split('.spec.js');
  s = '..' + s[0];
  return require(s);
}

module.exports = {
  frequire: frequire
};
