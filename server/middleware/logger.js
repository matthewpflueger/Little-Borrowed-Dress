'use strict';

module.exports = function $module(morgan, stream) {
  if ($module.exports) {
    return $module.exports;
  }

  morgan = morgan || require('morgan');
  stream = stream || { stream: {
    write: function(message) {
      log.info(message.slice(0, -1));
    }
  }};

  var logger = morgan(stream);

  $module.exports = logger;
  return logger;
};