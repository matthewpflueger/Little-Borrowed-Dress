'use strict';

module.exports = function $module(amqp, when, uuid, utils, config) {
  if ($module.exports) {
    return $module.exports;
  }

  amqp = amqp || require('amqplib');
  when = when || require('when');
  uuid = uuid || require('node-uuid');

  utils = utils || require('../utils')();
  config = config || conf;


  var correlations = {};

  var replyToDeferred = when.defer();
  var replyTo = replyToDeferred.promise;

  var channelDeferred = when.defer();
  var channel = channelDeferred.promise;


  function boot() {
    amqp.connect(config.get('amqp')).then(function(conn) {
      process.once('SIGINT', function() { conn.close(); });
      conn.on('error', function(err) { log.error('Connection error=%s', err, {}); });

      conn.createChannel().then(function(ch) {
        ch.on('error', function(err) { log.error('Channel error=%s', err, {}); });
        channelDeferred.resolve(ch);
        ch.prefetch(1, true);

        log.info('About to assert exchange ', config.get('exchange'));
        var ok = ch.assertExchange(config.get('exchange'), 'topic').then(function () {
          log.info('Asserted exchange ', config.get('exchange'));
          return ch;
        });

        ok = ok.then(function(ch) {
          log.info('About to assert replyTo queue');
          return ch.assertQueue('', { exclusive: true }).then(function(qok) {
            log.info('Asserted replyTo queue', qok);
            return qok.queue;
          });
        });

        log.info('About to consume from replyTo queue');
        ok = ok.then(function(queue) {
          log.info('Issuing consume from replyTo queue %s', queue);
          return ch.consume(queue, answer, { noAck: true }).then(function() {
              log.info('Consuming from replyTo queue %s', queue);
              replyToDeferred.resolve(queue);
              return queue;
            });
        });
      });
    });
  }

  boot();


  function answer(msg) {
    var p = correlations[msg.properties.correlationId];
    delete correlations[msg.properties.correlationId];

    if (p) {
      msg.content = JSON.parse(msg.content.toString());
      if (msg.content.error) {
        p.reject(msg);
      } else {
        p.resolve(msg);
      }
    } else {
      log.warn('No correlation found for message ', msg);
    }
  }

  function reply(msg, response) {
    if (!msg || !msg.properties || !msg.properties.replyTo) {
      log.info('No replyTo message=%j, response=%j', msg, response, msg.content.user);
      return when.resolve(true);
    }

    return channel.then(function(ch) {

      if (response.toJSON) {
        response = JSON.stringify(response.toJSON());
      } else {
        response = JSON.stringify(response);
      }

      log.info(
        'About to replyTo message=%s, queue=%s, exchange=%s, response=%s',
        msg.properties.correlationId,
        msg.properties.replyTo,
        msg.fields.exchange,
        response);

      var published = ch.sendToQueue(
        msg.properties.replyTo,
        new Buffer(response),
        { correlationId: msg.properties.correlationId });

      if (!published) {
        log.error('Failed to reply to message=%s, response=%s', msg.properties.correlationId, response, {});
        return when.reject('Failed to publish command, channel full');
      }

      log.info('Replied to message=%s, response=%s', msg.properties.correlationId, response, {});
      ch.ack(msg);

      return when.resolve(true);
    });
  }

  function tell(command) {
    if (!command.routingKey) {
      throw new Error('Command %j is missing routingKey', command, {});
    }

    log.info('Tell command=%s', command.routingKey);
    return channel.then(function(ch) {
      var published = ch.publish(
        command.exchange || config.get('exchange'),
        command.routingKey,
        new Buffer(JSON.stringify(command)));

      if (!published) {
        return when.reject('Failed to tell command, channel full');
      }

      return when.resolve(published);
    });
  }

  function ask(command, timeoutIn) {
    if (!command.routingKey) {
      throw new Error('Command %j is missing routingKey', command, {});
    }

    timeoutIn = timeoutIn || 5000;
    var correlationId = uuid();

    log.info('Asking command=%s, timeoutIn=%s', command.routingKey, timeoutIn);
    return when.join(channel, replyTo).then(function(vals) {
      log.info('Publishing command=%s, timeoutIn=%s', command.routingKey, timeoutIn);
      var ch = vals[0];
      var replyTo = vals[1];

      var published = ch.publish(
        command.exchange || config.get('exchange'),
        command.routingKey,
        new Buffer(JSON.stringify(command)),
        {
          correlationId: correlationId,
          replyTo: replyTo
        });

      if (!published) {
        return when.reject('Failed to ask command, channel full');
      }

      var d = when.defer();
      correlations[correlationId] = d;
      log.info('Published command=%s, timeoutIn=%s', command.routingKey, timeoutIn);
      return d.promise;
    }).timeout(timeoutIn).catch(function(e) {
      log.error('Failed to ask command=%j, error=%s', command, e, command.user);
      throw e;
    }).finally(function() {
      delete correlations[correlationId];
    });
  }

  function receive(routingKey, cb) {
    return channel.then(function(ch) {
      ch.assertQueue('', { exclusive: true }).then(function(qok) {
        return qok.queue;
      }).then(function(queue) {
        return ch.bindQueue(queue, config.get('exchange'), routingKey).then(function() { return queue; });
      }).then(function(queue) {
        return ch.consume(queue, function(msg) {
          msg.content = JSON.parse(msg.content.toString());
          var p = cb(msg);
          return p.then(function(res) {
            reply(msg, res);

            if (res && res.routingKey && /^events/.test(res.routingKey)) {
              tell(res);
            }
          }).catch(function(e) {
            if (e.constructor && /^NotFound/.test(e.constructor.name)) {
              reply(msg, utils.errors.makeError(e, null, 404));
            } else {
              log.error('Unexpected error handling message=%j, error=%s', msg, e, msg.content.user);
              reply(msg, utils.errors.makeError(e));
            }
          });
        });
      });
    });
  }

  function ack(msg) {
    channel.then(function(ch) {
      ch.ack(msg);
    });
  }

  $module.exports = {
    ask: ask,
    receive: receive,
    reply: reply,
    tell: tell,
    ack: ack
  };
  return $module.exports;
};
