'use strict';

/**
 * Setup logging.  After executing this function there should be a log object set in the global scope.
 *
 * NOTE: This function expects a global conf object
 *
 * @param  {[type]} morgan     [description]
 * @param  {[type]} winston    [description]
 * @param  {[type]} logentries [description]
 * @return {[type]}            [description]
 */
module.exports = function $module(fs, winston, logentries) {
  if ($module.exports) {
    return $module.exports;
  }

  fs = fs || require('fs');
  winston = winston || require('winston');

  winston.remove(winston.transports.Console);
  if (conf.get('console:enable')) {
    winston.add(winston.transports.Console, {
      colorize: conf.get('console:colorize'),
      timestamp: conf.get('console:timestamp'),
      level: conf.get('console:level')
    });
  }

  if (conf.get('file:enable')) {
    winston.add(winston.transports.File, {
      filename: conf.get('file:filename'),
      colorize: conf.get('file:colorize'),
      timestamp: conf.get('file:timestamp'),
      json: conf.get('file:json'),
      level: conf.get('file:level'),
      maxsize: conf.get('file:maxsize'),
      maxFiles: conf.get('file:maxFiles')
    });
  }

  logentries = logentries || require('node-logentries');

  if (conf.get('logentries:enable')) {
    winston.info('Enabling logentries');
    logentries.logger({
      token: conf.get('logentries:token'),
      handleExceptions: true
    }).winston(winston);
    winston.info('Application booting');
  }

  global.log = winston;

  $module.exports = winston;
  return winston;
};
