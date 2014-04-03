'use strict';

module.exports = function $module(router, Customer, Inventory, cmds, utils, when) {
  if ($module.exports) {
    return $module.exports;
  }

  router = router || require('../commands/router')();
  Customer = Customer || require('./models/Customer')();
  Inventory = Inventory || require('./models/Inventory')();
  cmds = cmds || require('../commands/orderitem')();
  utils = utils || require('../utils')();
  when = when || require('when');


  function orderItemImported(msg) {
    log.info('Processing message=%s', msg.fields.routingKey);

    var orderitem = msg.content.orderitem;
    var order = msg.content.order;
    var customer = msg.content.customer;

    log.info(
      'Detected imported orderitem=%s, order=%s, customer=%s',
      orderitem.hash,
      order.orderNumber,
      customer.email);

    if (!order.weddingDate) {
      log.info(
        'Cannot match order=%s, weddingDate=%s, orderitem=%s, assignedInventory=%s',
        order.orderNumber,
        order.weddingDate,
        orderitem.hash,
        orderitem.assignedInventory);
      router.ack(msg);
      return;
    }

    Inventory.find({
      'status': 'for order',
      'itemDescription.style': orderitem.itemDescription[0].style,
      'itemDescription.color': orderitem.itemDescription[0].color,
      'itemDescription.size' : { $all: orderitem.itemDescription[0].size }
    }).exec(function(err, results) {
      if (err) {
        log.error('Inventory query failed %s', err);
        router.noAck(msg);
        return;
      }

      if (!results) {
        log.info(
          'Could not match orderitem=%s, order=%s, customer=%s',
          orderitem.id,
          order.orderNumber,
          customer.email);
        router.ack(msg);
        return;
      }

      log.info('RESULTS');
      results.forEach(function(r) {
        // if (r.reservableOn(order.weddingDate)) {
        //   //we found a dress!
        //   var rsvp = r.reservations.create({});
        //   rsvp.orderitem = orderitem.id;
        //   rsvp.orderNumber = order.orderNumber;
        //   rsvp.date = order.weddingDate;
        //   rsvp.customerEmail = customer.email;
        //   rsvp.customerName = customer.name;
        //   rsvp.customerTelephone = customer.telephone;
        //   r.reservations.push(rsvp);

        //   log.info('FOUND A DRESS ', JSON.stringify(r.toJSON()));
        //   when.join(
        //     router.ask(new cmds.ReserveInventory(r, orderitem, order, customer)),
        //     router.ask(new cmds.FulfillOrderItem(orderitem, r))
        //   ).then(function() {
        //     log.info(
        //       'Reserved inventory=%s, orderitem=%s, order=%s, customer=%s',
        //       r.tagId, orderitem.id, order.orderNumber, customer.email);
        //     router.ack(msg);
        //   }).catch(function(e) {
        //     log.error(
        //       'Failed to reserve inventory=%s, orderitem=%s, order=%s, customer=%s, error=%s',
        //       r.tagId, orderitem.id, order.orderNumber, customer.email, e);
        //     router.tell(new cmds.ReleaseInventory(r, orderitem, order, customer));
        //     router.tell(new cmds.UnfulfillOrderItem(orderitem, r));
        //     router.noAck(msg);
        //   });
        //   return;
        // }
        log.info(JSON.stringify(r.toJSON()));
      });
    });


    /**
     * - if order item unfulfilled (it should be) and there is a wedding date on the order
     *   - look for inventory of the same style, color, size that have a prod date at least
     *     6 weeks before wedding date
     *
     *   - if inventory has no reserved dates then go to reservation procedure
     *   - cycle through each inventory's reserved for dates
     *     - for each inventory reserved date
     *       - calculate reserved span by:
     *         - subtract 3 weeks before reserved date
     *         - add 3 weeks after reserved date
     *       - if order wedding date is in this span then move on to next inventory item
     *
     * Production takes 3 weeks. We pick up on MONDAYS and ship out that same +FRIDAY
Shipping buffer both outbound and inbound is 1 week
Dresses need to arrive 2 weeks before wedding date
Cleaning buffer is also 1 week.

So in a timeline format compared to wedding date (assume weddings are +Fri, +Sat, +Sun):
Dress put into production 6.5 weeks before wedding
Dress shipped 3 weeks before wedding
Dresses arrive to customer 2 weeks before wedding
Dresses come back 1 week after wedding
Dresses are cleaned 2 weeks after wedding
Dress is available for next rental 3 weeks after wedding
     *
     * - RESERVATION PROCEDURE
     *   - issue inventory reserve command
     *   - if successful then issue order fulfill command
     *   - if successful BINGO
     *   - else issue unreserve inventory command and issue unfulfill order command
     */
    router.ack(msg);

    // var rec = msg.content.data;
    // Customer.findOne({ email: rec.EMAIL.trim() }, function(err, customer) {
    //   if (err) {
    //     log.error('Error finding customer=%s, error=%s, message=%s', rec.EMAIL, err, corrId);
    //     router.reply(msg, utils.errors.makeError(err));
    //     return;
    //   }

    //   var numOrderItems = 0;
    //   var order = null;
    //   var orderitem = null;
    //   if (!customer) {
    //     log.info('Creating new customer=%s, message=%s', rec.EMAIL, corrId);
    //     customer = new Customer();
    //     orderitem = customer.import(rec);
    //     order = customer.orders[0];
    //   } else {
    //     var orderNumber = utils.number.makeNumber(rec.ORDER);
    //     var orders = customer.orders.filter(function(o) { return o.orderNumber === orderNumber; });

    //     if (!orders.length) {
    //       log.info('Creating new order=%s, customer=%s, message=%s', orderNumber, customer.email, corrId);
    //       order = customer.orders.create({});
    //       customer.orders.push(order);
    //       orderitem = order.import(rec);
    //     } else {
    //       order = orders[0];
    //       numOrderItems = order.orderitems.length;
    //       log.info('Found order=%s, customer=%s, message=%s', order.orderNumber, customer.email, corrId);
    //       orderitem = order.importOrderItem(rec);
    //     }
    //   }

    //   if (numOrderItems < order.orderitems.length) {
    //     customer.save(function(err, c) {
    //       if (err) {
    //         log.error('Error saving customer=%s, error=%s, message=%s', customer.email, err, corrId);
    //         router.reply(msg, utils.errors.makeError(err));
    //       } else {
    //         log.info(
    //           'Imported orderitem=%s, order=%s, customer=%s, message=%s',
    //           orderitem.hash,
    //           order.orderNumber,
    //           customer.email,
    //           corrId);
    //         var res = new cmds.OrderItemImported(201, 'Order item created', c, order, orderitem);
    //         router.reply(msg, res);
    //         router.tell(res);
    //       }
    //     });
    //   } else {
    //     log.info(
    //       'Already exists orderitem=%s, order=%s, customer=%s, message=%s',
    //       orderitem.hash,
    //       order.orderNumber,
    //       customer.email,
    //       corrId);
    //     router.reply(msg, new cmds.OrderItemImported(304, 'Order item already exists', customer, order, orderitem));
    //   }
    // });
  }

  router.receive(cmds.OrderItemImported.routingKey, orderItemImported);

  $module.exports = {};
  return {};
};
