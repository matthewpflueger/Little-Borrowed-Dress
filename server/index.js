'use strict';

require('./config')();
require('./log')();
require('./services')();
require('./passport')();

var app = require('./express')();

app.listen(conf.get('port'));
log.info('Listening on port=%s', conf.get('port'));
