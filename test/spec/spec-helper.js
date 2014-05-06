'use strict';

require('../../server/config')();
require('../../server/log')();

var moment = require('moment');

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
  s = '../..' + s[0];
  return require(s);
}

function fdate(date) {
  return moment(date).format('M/D/YY');
}

module.exports = {
  spec: {
    frequire: frequire,
    fdate: fdate
  }
};
