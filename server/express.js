'use strict';

module.exports = function $module(express, path, os, helpers, passport) {
  if ($module.exports) {
    return $module.exports;
  }

  express = express || require('express');
  path = path || require('path');
  os = os || require('os');
  helpers = helpers || require('view-helpers');
  passport = passport || require('passport');

  var app = express();

  app.set('showStackError', conf.get('showStackError'));
  app.set('view engine', 'html');
  app.set('views', conf.get('viewsPath'));
  app.enable('jsonp callback');
  app.disable('x-powered-by');

  app.locals.pretty = conf.get('prettifyHtml');
  app.locals.cache = conf.get('cache');

  app.use(require('./middleware/logger')());
  app.use(require('body-parser')());
  app.use(require('method-override')());
  app.use(require('cookies').express([conf.get('secret')]));
  app.use(require('cookie-session')({ key: 'sid', keys: [conf.get('secret')] }));
  app.use(require('connect-flash')());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(require('./middleware/csrf')());
  app.use(require('./middleware/xsrf')());
  app.use(helpers(conf.get('appName')));

  app.get(conf.get('jsMain'), require('./middleware/browserify')());

  app.use('/fonts', express.static(path.join(conf.get('bootstrapPath'), '/fonts')));
  app.use(require('./middleware/less')());
  app.use(express.static(conf.get('tmpCssDirPath')));
  app.use(express.static(conf.get('clientPath')));

  app.engine('html', require('consolidate')[conf.get('templateEngine')]);

  app.use('/', require('./routes')());

  $module.exports = app;
  return app;
};
