'use strict';

module.exports = function(stacktrace) {

  stacktrace = stacktrace || require('stacktrace');

  function log($provide) {
    $provide.decorator('$log', function($delegate) {
      var _error = $delegate.error;
      $delegate._error = _error;

      function send(message, exception) {
        var data = {
          errorUrl: window.location.href,
          errorMessage: message,
          errorData: arguments
        };

        try {
          if (exception && exception.name && /(Error|Exception)$/.test(exception.name)) {
            data.exceptionMessage = exception.toString();
            data.stacktrace = stacktrace({ e: exception });

            if (exception.data) {
              data.exceptionData = exception.data;
            }
          }


          //NOTE: we don't use angular's http service in order
          //to avoid an infinite loop as angular's http service
          //logs errors using this service...
          global.jQuery.ajax({
            type: 'POST',
            url: './errors',
            contentType: 'application/json',
            data: angular.toJson(data)
          });
        } catch(e) {
          _error.apply($delegate, [
            'Failed to log to server data=%O, message=%O, exception=%O, error=%s',
            data, message, exception, e
          ]);
        }
      }

      $delegate.error = function(){
        _error.apply($delegate, arguments);
        send.apply(null, arguments);
        // send(message);
      };

      $delegate.fatal = function(message, exception){ //Adding additional method
        if (exception.data) {
          _error.apply($delegate, [
            exception.toString() + ' data=%O, stacktrace=%O',
            exception.data,
            stacktrace({ e: exception })
          ]);
        } else {
          _error.apply($delegate, arguments);
        }
        send(message, exception);
      };

      return $delegate;
    });

    //FIXME this overrides the default $exceptionHandler rather than delegate - should use a provider...
    $provide.decorator('$exceptionHandler', function($delegate, $log) {
      return function(exception, cause) {
        $log.fatal(cause || 'Uncaught exception', exception);
        // $delegate(cause, exception);
      };
    });
  }

  log.$inject = ['$provide'];

  return log;
};
