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
module.exports = function $module(winston, logentries) {
  if ($module.exports) {
    return $module.exports;
  }

  // morgan = morgan || require('morgan');
  winston = winston || require('winston');
  logentries = logentries || require('node-logentries');

  if (conf.get('logentries:enable')) {
    console.log('LogEntriesEnabled=true');
    logentries.logger({
      token:'805cc5af-8388-4634-8781-60adbdf696c7'
    }).winston(winston);
  }

  global.log = winston;

  // function Log(logStream) {
  //   logStream = logStream || {
  //     write: function(message) {
  //       log.info(message.slice(0, -1));
  //     }
  //   };

  //   return morgan({ stream: logStream });
  // }

  // Log.$inject = ['logStream'];
  // $module.exports = Log;
  $module.exports = winston;
  return winston;
};
