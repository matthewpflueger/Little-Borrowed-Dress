'use strict';

module.exports = function() {
  /*
  {
   "errorUrl":"http://localhost:8000/#!/inventory/manage",
   "errorMessage":"<div class=\"smallGridStyle ng-scope\" data-ng-grid=\"smallGridOptions\">",
   "errorData":{
      "0":"<div class=\"smallGridStyle ng-scope\" data-ng-grid=\"smallGridOptions\">",
      "1":{
         "stack":"TypeError: Cannot set property 'gridDim' of undefined\n    at pre (http://localhost:8000/js/app.js:65070:37)\n    at nodeLinkFn (http://localhost:8000/js/app.js:11666:13)\n    at compositeLinkFn (http://localhost:8000/js/app.js:11097:15)\n    at compositeLinkFn (http://localhost:8000/js/app.js:11100:13)\n    at compositeLinkFn (http://localhost:8000/js/app.js:11100:13)\n    at compositeLinkFn (http://localhost:8000/js/app.js:11100:13)\n    at nodeLinkFn (http://localhost:8000/js/app.js:11680:24)\n    at compositeLinkFn (http://localhost:8000/js/app.js:11097:15)\n    at publicLinkFn (http://localhost:8000/js/app.js:11002:30)\n    at updateView (http://localhost:8000/js/app.js:4965:11)"
      }
   },
   "exceptionMessage":"TypeError: Cannot set property 'gridDim' of undefined",
   "stacktrace":[
      "pre@http://localhost:8000/js/app.js:65070:37",
      "nodeLinkFn@http://localhost:8000/js/app.js:11666:13",
      "compositeLinkFn@http://localhost:8000/js/app.js:11097:15",
      "compositeLinkFn@http://localhost:8000/js/app.js:11100:13",
      "compositeLinkFn@http://localhost:8000/js/app.js:11100:13",
      "compositeLinkFn@http://localhost:8000/js/app.js:11100:13",
      "nodeLinkFn@http://localhost:8000/js/app.js:11680:24",
      "compositeLinkFn@http://localhost:8000/js/app.js:11097:15",
      "publicLinkFn@http://localhost:8000/js/app.js:11002:30",
      "updateView@http://localhost:8000/js/app.js:4965:11"
   ]
}
   */
  return function(req, res) {
    log.error('Javascript error=%j', req.body, req.user);
    res.json({});
  };
};
