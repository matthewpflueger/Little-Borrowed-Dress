'use strict';

module.exports = function(_, moment) {

  _ = _ || require('lodash');
  moment = moment || require('moment');

  function OrderController($scope, $log, $http) {

    function findEntity(customer, orderitemId) {
      return _.find(makeOrderItemRows(customer), function(e) {
        return orderitemId === e.orderitem.id;
      });
    }

    function makeOrderItemRows(customer) {
      // $log.info('makeOrderItemRows customer=%O', customer);
      var rows = [];
      _.forEach(customer.orders, function(order) {
        _.forEach(order.orderitems, function(orderitem) {
          rows.push({
            customer: customer,
            order: order,
            orderitem: orderitem
          });
        });
      });
      return rows;
    }

    $scope.$on('ngGridEventEndCellEdit', function(evt) {
      var row = evt.targetScope.row;
      var entity = row.entity;
      //FIXME this logic is duplicated from the Order model :(
      entity.order.forDate = new Date(entity.order.forDate);
      entity.order.shipByDate = moment(entity.order.forDate).subtract('weeks', 3).day('Friday').toDate();
      if (entity.orderitem.itemDescription[0].size.match) {
        entity.orderitem.itemDescription[0].size = entity.orderitem.itemDescription[0].size.match(/\d+/g);
      }

      $http
        .put('/orders/' + entity.customer._id, entity.customer)
        .success(function(data, status) {
          $scope.success.message = 'Saved order data.';
          $log.info('Saved customer=%s, status=%s, data=%O', entity.customer.email, status, data);
          var e = findEntity(data, entity.orderitem.id);
          if (e) {
            $log.info('Found entity=%O', e);
            row.entity = e;
          }
        }).error(function(data, status) {
          $scope.error.message = 'Failed to save order data.';
          $log.error('Could not save customer=%s, status=%s, data=%O', entity.customer.email, status, data);
          var e = findEntity(data, entity.orderitem.id);
          if (e) {
            $log.info('Found entity=%O', e);
            row.entity = e;
          }
        });

    });


    $scope.enteredOrdersForName = '';
    $scope.enteredOrdersForEmail = '';
    $scope.enteredOrdersForPhone = '';
    $scope.enteredOrdersForStyle = '';
    $scope.enteredOrdersForColor = '';
    $scope.enteredOrdersForSize = '';
    $scope.enteredOrdersForDate = null;
    $scope.limitToOptions = [10, 25, 50, 100, 200];
    $scope.previousPagesForDate = [];

    $scope.ordersQuery = {
      inclusive: false,
      name: null,
      email: null,
      phone: null,
      ordersForDate: null,
      allocated: true,
      style: null,
      color: null,
      size: null,
      limitTo: 10
    };

    function debounce(fun, timeout) {
      return _.debounce(fun, timeout || 500);
    }

    $scope.$watch('enteredOrdersForName', debounce(function (dt) {
      if (!dt || !/^\w{3,}/.test(dt)) {
        $scope.ordersQuery.name = null;
        return;
      }

      $log.info('Saw update to enteredOrdersForName=%s', dt);
      $scope.ordersQuery.name = dt;
      $scope.all();
    }));

    $scope.$watch('enteredOrdersForEmail', debounce(function (dt) {
      if (!dt || !/^\w{3,}/.test(dt)) {
        $scope.ordersQuery.email = null;
        return;
      }

      $log.info('Saw update to enteredOrdersForEmail=%s', dt);
      $scope.ordersQuery.email = dt;
      $scope.all();
    }));

    $scope.$watch('enteredOrdersForPhone', debounce(function (dt) {
      if (!dt || !/^\d{8,}$/.test(dt)) {
        $scope.ordersQuery.phone = null;
        return;
      }

      $log.info('Saw update to enteredOrdersForPhone=%s', dt);
      $scope.ordersQuery.phone = dt;
      $scope.all();
    }));

    $scope.$watch('enteredOrdersForStyle', debounce(function (dt) {
      if (!dt || !/^[a-z]{3,}$/.test(dt)) {
        $scope.ordersQuery.style = null;
        return;
      }

      $log.info('Saw update to enteredOrdersForStyle=%s', dt);
      $scope.ordersQuery.style = dt;
      $scope.all();
    }));

    $scope.$watch('enteredOrdersForColor', debounce(function (dt) {
      if (!dt || !/^[a-z]{3,}$/.test(dt)) {
        $scope.ordersQuery.color = null;
        return;
      }

      $log.info('Saw update to enteredOrdersForColor=%s', dt);
      $scope.ordersQuery.color = dt;
      $scope.all();
    }));

    $scope.$watch('enteredOrdersForSize', debounce(function (dt) {
      if (!dt || !/\d+/.test(dt)) {
        $scope.ordersQuery.size = null;
        return;
      }

      $log.info('Saw update to enteredOrdersForSize=%s', dt);
      $scope.ordersQuery.size = dt.match(/(\d+)/g);
      $scope.all();
    }));

    function setOrdersForDate(dt) {
      if (!dt || !/^(\d){1,2}\/(\d){1,2}\/(\d){2,4}$/.test(dt)) {
        $scope.ordersQuery.ordersForDate = null;
        return;
      }

      $log.info('Saw update to enteredOrdersForDate %s', dt);
      $scope.previousPagesForDate = [];
      $scope.ordersQuery.ordersForDate = new Date(dt).toISOString();
    }

    //FIXME could use a directive here to keep ordersQuery.ordersForDate and input field in sync
    //check out http://stackoverflow.com/questions/15242592/angular-js-how-to-autocapitalize-an-input-field/15253892#15253892
    $scope.$watch('enteredOrdersForDate', debounce(function (dt) {
      setOrdersForDate(dt);
      $scope.all();
    }));


    $scope.$watch('ordersQuery.allocated', function() {
      $scope.all();
    });

    $scope.$watch('ordersQuery.limitTo', function() {
      $scope.all();
    });

    $scope.nextPage = function() {
      if (!$scope.orderData.length || !$scope.orderData[0].order) {
        $log.warn('No orders to go to next page of');
        return;
      }

      var oq = $scope.ordersQuery;

      $scope.previousPagesForDate.push($scope.orderData[0].order.forDate);
      oq.ordersForDate = $scope.orderData[$scope.orderData.length - 1].order.forDate;
      oq.inclusive = false;
      $scope.all();
    };

    $scope.previousPage = function() {
      if (!$scope.previousPagesForDate.length) {
        $log.error('Trying to go to previous page of orders when no previousPageForDate set');
        return;
      }

      var oq = $scope.ordersQuery;
      oq.ordersForDate = $scope.previousPagesForDate.pop();
      oq.inclusive = true;
      $scope.all();
    };

    $scope.refresh = function() {
      setOrdersForDate($scope.enteredOrdersForDate);
      $scope.previousPagesForDate = [];
      $scope.ordersQuery.inclusive = true;
      $scope.all();
    };

    $scope.all = function() {
      var oq = $scope.ordersQuery;
      var config = { params: oq };

      $scope.info.message = null;
      $http
        .get('/orders', config)
        .success(function(data, status) {
          $log.info('Fetched orders=%O, status=%s', data, status);

          // throw new Error('test error');
          $scope.response = data.response;

          var rows = [];
          _.forEach(data.messages, function(c) {
            rows = rows.concat(makeOrderItemRows(c));
          });

          $scope.orderData = rows;
        }).error(function(data, status) {
          if (status === 404) {
            $scope.info.message = 'No orders found!';
            $scope.orderData = [];
            return;
          }
          $log.error('Failed to fetch orders data=%O, status=%s', data, status);
          $scope.error.message = 'Failed to fetch orders.';
        });
    };

    $scope.reserveInventory = function() {
      var orderSel = $scope.orderSelections[0];
      var inventorySel = $scope.inventorySelections[0];
      var orderitem = orderSel.orderitem.id;
      var inventory = inventorySel.inventory.id;

      $http
        .post('/reservations/' + orderitem + '/' + inventory)
        .success(function(data, status) {
          $log.info('Reserved inventory=%O, status=%s', data, status);
          orderSel.customer = data.customer;
          orderSel.order = data.order;
          orderSel.orderitem = data.orderitem;
          inventorySel.inventory = data.inventory;
          inventorySel.availabilityStatus = data.availabilityStatus;
          queryInventory();
        }).error(function(data, status) {
          $log.error('Failed to reserve inventory=%O, status=%s', data, status);
          $scope.error.message = 'Failed to reserve inventory.';
        });
    };

    $scope.releaseInventory = function() {
      var sel = $scope.orderSelections[0];
      if (!sel) {
        $log.warn('No order selection to release inventory for');
        return;
      }

      var orderitem = sel.orderitem;
      if (!orderitem.inventory) {
        $log.warn('No associated inventory for orderitem=%O', orderitem);
        return;
      }

      $http
        .delete('/reservations/' + orderitem.id + '/' + orderitem.inventory)
        .success(function(data, status) {
          $log.info('Released inventory=%O, status=%s', data, status);
          sel.customer = data.customer;
          sel.order = data.order;
          sel.orderitem = data.orderitem;
          queryInventory();
        }).error(function(data, status) {
          $log.error('Failed to release inventory=%O, status=%s', data, status);
          $scope.error.message = 'Failed to release inventory.';
        });
    };

    $scope.success = {
      message: null
    };

    $scope.clearSuccess = function() {
      $scope.success.message = null;
    };

    $scope.info = {
      message: null
    };

    $scope.clearInfo = function() {
      $scope.info.message = null;
    };

    $scope.warning = {
      message: null
    };

    $scope.clearWarning = function() {
      $scope.warning.message = null;
    };

    $scope.error = {
      message: null
    };

    $scope.clearError = function() {
      $scope.error.message = null;
    };

    $scope.isUploading = false;
    $scope.startUploading = function() {
      $scope.isUploading = true;
    };

    $scope.uploadComplete = function(results) {
      $log.info('Completed upload of order items');
      $scope.isUploading = false;
      global.jQuery('#uploadOrderItemsModal').modal('hide');

      var orders = [];
      results.customers.forEach(function(c) {
        orders = orders.concat(makeOrderItemRows(c));
      });

      _.assign($scope.error, results.error);
      // $scope.error = results.error;
      $scope.orderData = orders;
    };

    $scope.orderData = [];
    $scope.orderSelections = [];
    $scope.gridOptions = {
      data: 'orderData',
      selectedItems: $scope.orderSelections,
      showGroupPanel: true,
      jqueryUIDraggable: true,
      enableCellSelection: true,
      multiSelect: false,
      // enablePinning: true,  //does not work with grouping :(
      showFilter: true,
      showColumnMenu: true,
      enableCellEdit: true,
      enableColumnResize: true,
      enableColumnReordering: true,
      sortInfo: { fields: ['order.shipByDate'], directions: ['desc']},
      rowTemplate: 'views/allocated.html',
      columnDefs: [
        {field:'order.purchasedOn', displayName:'Purchased On', enableCellEdit: false, width: 110, cellFilter: 'date'},
        {field:'order.orderNumber', displayName:'Order', enableCellEdit: false, width: 90},
        {field:'order.type', displayName:'Order', enableCellEdit: false, width: 90},
        {field:'order.shipByDate', displayName:'Ship By Date', enableCellEdit: false, width: 110, cellFilter: 'date'},
        {field:'order.forDate', displayName:'For Date', enableCellEdit: true, width: 110, cellFilter: 'date'},
        {field:'order.bride', displayName:'Bride', enableCellEdit: true, width: 150},
        {field:'orderitem.itemDescription[0].style', displayName:'Style', enableCellEdit: true, width: 70},
        {field:'orderitem.itemDescription[0].size', displayName:'Size', enableCellEdit: true, width: 70, cellFilter: 'join:" | "'},
        {field:'orderitem.itemDescription[0].color', displayName:'Color', enableCellEdit: true, width: 70},
        {field:'orderitem.backup', displayName:'Backup', enableCellEdit: true, width: 70},
        {field:'customer.name', displayName: 'Name', enableCellEdit: true, width: 150},
        {field:'customer.email', displayName: 'Email', enableCellEdit: true, width: 150},
        {field:'customer.telephone', displayName: 'Phone', enableCellEdit: true, width: 100},
        {field:'order.shipTo[0].street', displayName: 'Street', enableCellEdit: true, width: 150},
        {field:'order.shipTo[0].city', displayName: 'City', enableCellEdit: true, width: 100},
        {field:'order.shipTo[0].state', displayName: 'State', enableCellEdit: true, width: 80},
        {field:'order.shipTo[0].zipcode', displayName: 'Zip', enableCellEdit: true, width: 50},
        {field:'orderitem.shippedOn', displayName: 'Shipped On', enableCellEdit: false, width: 110, cellFilter: 'date'},
        {field:'orderitem.receivedBackOn', displayName: 'Received Back', enableCellEdit: false, width: 110, cellFilter: 'date'}
      ]
    };



    $scope.inventoryData = [];
    $scope.inventorySelections = [];
    $scope.searchBy = [true, true, true];
    $scope.orderItemInventory = {
      inventory: null,
      reservation: null
    };


    $scope.resGridOptions = {
      data: 'reservationData',
      enableCellSelection: false,
      multiSelect: false,
      enableColumnResize: true,
      enableColumnReordering: false,
      columnDefs: [
        {field:'inventory.tagId', displayName:'Tag Id'},
        {field:'inventory.productNumber', displayName:'Prod #'},
        {field:'inventory.itemDescription[0].style', displayName:'Style', width: '70'},
        {field:'inventory.itemDescription[0].size', displayName:'Size', width: '70', cellFilter: 'join:" | "'},
        {field:'inventory.itemDescription[0].color', displayName:'Color', width: '70'},
        {field:'reservation.reservationStart', displayName:'Start', width: '100', cellFilter: 'date'},
        {field:'reservation.reservationEnd', displayName:'End', width: '100', cellFilter: 'date'},
      ]
    };

    function queryInventory() {
      if (!$scope.orderSelections[0]) {
        $log.info('No order selected to query inventory for');
        return;
      }
      var orderitem = $scope.orderSelections[0].orderitem;

      //FIXME turn this into a directive...
      if (!$scope.searchBy[0] && !$scope.searchBy[1] && !$scope.searchBy[2]) {
        $scope.searchBy = [true, true, true];
      }
      var config = { params: {
        style: $scope.searchBy[0],
        color: $scope.searchBy[1],
        size: $scope.searchBy[2]
      }};

      $log.info('Querying inventory for orderitem=%O, config=%O', orderitem, config);
      $http.get('/inventory/orderitem/' + orderitem.id, config)
        .success(function(data, status, headers, config) {
          $log.info(
            'Found inventory=%O, status=%s, orderitem=%O, headers=%O, config=%O',
            data, status, orderitem, headers, config);
          $scope.inventoryData = data.inventories;
          if (!data.inventory) {
            $scope.orderItemInventory.status = 'No inventory reserved for order item';
            $scope.orderItemInventory.inventory = null;
            $scope.orderItemInventory.reservation = null;
          } else {
            $scope.reservationData = [{
              inventory: data.inventory,
              reservation: data.reservation
            }];
            $scope.orderItemInventory.status = 'Reserved inventory for order item';
            $scope.orderItemInventory.inventory = data.inventory;
            $scope.orderItemInventory.reservation = data.reservation;
          }
        }).error(function(data, status) {
          $scope.error.message = 'Failed to find inventory.';
          $log.error('Failed to find inventory for orderitem=%O, status=%s, data=%O', orderitem, status, data);
        });
    }

    $scope.$watchCollection('searchBy', queryInventory);
    $scope.$watchCollection('orderSelections', queryInventory);


    $scope.isInventoryReservable = function() {
      var isReservable = false;
      if ($scope.inventorySelections[0] &&
          $scope.inventorySelections[0].availabilityStatus === 'available' &&
          !$scope.hasAssignedInventory()) {
        isReservable = true;
      }
      // $log.info('Determining isInventoryReservable=%s, inventorySelections=%O', isReservable, $scope.inventorySelections[0]);
      return isReservable;
    };

    $scope.hasAssignedInventory = function() {
      var isAssigned = false;
      if ($scope.orderSelections[0] &&
          $scope.orderSelections[0].orderitem.inventory) {
        isAssigned = true;
      }
      // $log.info('Determining hasAssignedInventory=%s, orderSelections=%O', isAssigned, $scope.orderSelections[0]);
      return isAssigned;
    };


    $scope.smallGridOptions = {
      data: 'inventoryData',
      selectedItems: $scope.inventorySelections,
      enableCellSelection: true,
      multiSelect: false,
      enableColumnResize: true,
      enableColumnReordering: true,
      sortInfo: { fields: ['availabilityStatus'], directions: ['asc']},
      columnDefs: [
        {field:'availabilityStatus', displayName:'Availability', width: '170'},
        {field:'inventory.tagId', displayName:'Tag Id'},
        {field:'inventory.productNumber', displayName:'Prod #'},
        {field:'inventory.itemDescription[0].style', displayName:'Style', width: '70'},
        {field:'inventory.itemDescription[0].size', displayName:'Size', width: '70', cellFilter: 'join:" | "'},
        {field:'inventory.itemDescription[0].color', displayName:'Color', width: '70'},
      ]
    };



    $scope.newOrderItem = {};

    $scope.addOrderItem = function() {
      $log.info('newOrderItem=%O', $scope.newOrderItem);
      $http
        .post('/orders/' + $scope.orderSelections[0].order.id + '/orderitem', $scope.newOrderItem)
        .success(function(data, status, headers, config) {
          $log.info(
            'Added orderitem=%O, data=%O, status=%s, headers=%O, config=%O',
            $scope.newOrderItem, data, status, headers, config);
          $scope.newOrderItem = {};

          //FIXME ugly hack to get the new order item to show up - really need to find/replace
          //in the existing customers/orders/orderitems in $scope.orderData...
          $scope.all();

          //FIXME ugly using jQuery here - ui-boostrap anyone?
          global.jQuery('#addOrderItemModal').modal('hide');
        }).error(function(data, status) {
          global.jQuery('#addOrderItemModal').modal('hide');
          $scope.error.message = 'Failed to add order item.';
          $log.error('Failed to add orderitem=%O, status=%s, data=%O', $scope.newOrderItem, status, data);
        });
    };

    $scope.isShippable = function() {
      var sel = $scope.orderSelections[0];
      return $scope.hasAssignedInventory() && !sel.orderitem.shippedOn;
    };

    $scope.shipOrderItem = function() {
      var sel = $scope.orderSelections[0];
      if (!sel) {
        $log.error('No order items selected to ship');
        return;
      }

      $http
        .post('/inventory/ship/' + sel.orderitem.id)
        .success(function(data, status) {
          $log.info(
            'Shipped orderitem=%O, data=%O, status=%s',
            sel.orderitem, data, status);
          sel.customer = data.customer;
          sel.order = data.order;
          sel.orderitem = data.orderitem;
          queryInventory();
        }).error(function(data, status) {
          $log.error('Failed to ship orderitem=%O, status=%s, data=%O', sel.orderitem, status, data);
          $scope.error.message = 'Failed to ship order item.';
        });
    };

    $scope.manufactureOrderItem = function() {
      var sel = $scope.orderSelections[0];
      if (!sel) {
        $log.error('No order items selected to manufacture');
        return;
      }

      $http
        .post('/inventory/manufacture/' + sel.orderitem.id)
        .success(function(data, status) {
          $log.info(
            'Manufactured orderitem=%O, data=%O, status=%s',
            sel.orderitem, data, status);
          sel.customer = data.customer;
          sel.order = data.order;
          sel.orderitem = data.orderitem;
          queryInventory();
        }).error(function(data, status) {
          $log.error('Failed to manufacture orderitem=%O, status=%s, data=%O', sel.orderitem, status, data);
          $scope.error.message = 'Failed to manufacture order item.';
        });
    };
  }

  OrderController.$inject = ['$scope', '$log', '$http'];

  return OrderController;
};
