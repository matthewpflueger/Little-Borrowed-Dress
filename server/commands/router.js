'use strict';

module.exports = function $module(amqp, when, uuid, config) {
  if ($module.exports) {
    return $module.exports;
  }

  amqp = amqp || require('amqplib');
  when = when || require('when');
  uuid = uuid || require('node-uuid');
  config = config || conf;


  var correlations = {};
  var replyTo = null;
  var channelDeferred = when.defer();
  var channel = channelDeferred.promise;

  amqp.connect(config.get('amqp')).then(function(conn) {
    process.once('SIGINT', function() { conn.close(); });

    conn.createChannel().then(function(ch) {
      channelDeferred.resolve(ch);
      ch.prefetch(1);

      log.info('About to assert exchange ', config.get('exchange'));
      var ok = ch.assertExchange(config.get('exchange'), 'topic').then(function () {
        log.info('Asserted exchange ', config.get('exchange'));
        return ch;
      });

      ok = ok.then(function(ch) {
        log.info('About to assert replyTo queue');
        return ch.assertQueue('', { exclusive: true }).then(function(qok) {
          log.info('Asserted replyTo queue', qok);
          replyTo = qok.queue;
          return replyTo;
        });
      });

      log.info('About to consume from replyTo queue');
      ok = ok.then(function(queue) {
        log.info('Issuing consume from replyTo queue %s', queue);
        return ch.consume(queue, answer, { noAck: true })
          .then(function() {
            log.info('Consuming from replyTo queue %s', queue);
            return queue;
          });
      });
    });
  });

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

  function ask(command, timeoutIn) {
    if (!command.routingKey) {
      throw new Error('Command %j is missing routingKey', command, {});
    }

    timeoutIn = timeoutIn || 5000;
    var correlationId = uuid();

    log.info('Ask command=%s, timeoutIn=%s', command.routingKey, timeoutIn);
    return channel.then(function(ch) {
      var published = ch.publish(
        command.exchange || config.get('exchange'),
        command.routingKey,
        new Buffer(JSON.stringify(command)),
        {
          correlationId: correlationId,
          replyTo: replyTo
        });

      if (!published) {
        return when.reject('Failed to publish command, channel full');
      }

      var d = when.defer();
      correlations[correlationId] = d;
      return d.promise;
    }).timeout(timeoutIn).finally(function() {
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
          cb(msg);
        });
      });
    });
  }

  $module.exports = {
    ask: ask,
    receive: receive,
    reply: reply
  };
  return $module.exports;
};
