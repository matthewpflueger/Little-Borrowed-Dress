'use strict';

module.exports = function(_, moment) {

  _ = _ || require('lodash');
  moment = moment || require('moment');

  function OrderController($scope, $log, $http) {

    function findEntity(customer, orderitemId) {
      return _.find(makeOrderitemRows(customer), function(e) {
        return orderitemId === e.orderitem.id;
      });
    }

    function makeOrderitemRows(customer) {
      // $log.info('makeOrderitemRows customer=%O', customer);
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
      $log.info('Size=%O', entity.orderitem.itemDescription[0].size);
      $log.info('Save entity=%O', $scope.changesToSave);

      $http
        .put('/orders/' + entity.customer._id, entity.customer)
        .success(function(data, status, headers, config) {
          $log.info(
            'Saved customer=%s, status=%s, data=%O, headers=%O, config=%O',
            entity.customer.email, status, data, headers, config);
          var e = findEntity(data, entity.orderitem.id);
          if (e) {
            $log.info('Found entity=%O', e);
            row.entity = e;
          }
        }).error(function(data, status, headers, config) {
          $log.error(
            'Could not save customer=%s, status=%s, data=%O, headers=%O, config=%O',
            entity.customer.email, status, data, headers, config);
          var e = findEntity(data, entity.orderitem.id);
          if (e) {
            $log.info('Found entity=%O', e);
            row.entity = e;
          }
        });

    });

    $scope.all = function() {
      $http
        .get('/orders')
        .success(function(data, status, headers, config) {
          $log.info(
            'Fetched orders=%O, status=%s, headers=%O, config=%O',
            data, status, headers, config);

          // throw new Error('test error');
          $scope.response = data.response;

          var rows = [];

          _.forEach(data.messages, function(c) {
            rows = rows.concat(makeOrderitemRows(c));
          });

          $scope.orderData = rows;
        }).error(function(data, status) {
          $log.error('Failed to fetch orders data=%O, status=%s', data, status);
          var error = new Error('Failed to fetch orders');
          error.data = { data: data, status: status };
          throw error;
        });
    };

    $scope.reserveInventory = function() {
      var orderitem = $scope.orderSelections[0].orderitem.id;
      var inventory = $scope.inventorySelections[0].inventory.id;

      $http
        .post('/reservations/' + orderitem + '/' + inventory)
        .success(function(data, status, headers, config) {
          $log.info(
            'Reserved inventory=%O, status=%s, headers=%O, config=%O',
            data, status, headers, config);
          $scope.orderSelections[0].customer = data.customer;
          $scope.orderSelections[0].order = data.order;
          $scope.orderSelections[0].orderitem = data.orderitem;
          $scope.inventorySelections[0].inventory = data.inventory;
          $scope.inventorySelections[0].availabilityStatus = data.availabilityStatus;
        }).error(function(data, status, headers, config) {
          $log.error(
            'Failed to reserve inventory=%O, status=%s, headers=%O, config=%O',
            data, status, headers, config);
        });
    };

    $scope.releaseInventory = function() {
      if (!$scope.orderSelections[0]) {
        $log.warn('No order selection to release inventory for');
        return;
      }
      var orderitem = $scope.orderSelections[0].orderitem;
      if (!orderitem.inventory) {
        $log.warn('No associated inventory for orderitem=%O', orderitem);
        return;
      }

      $http
        .delete('/reservations/' + orderitem.id + '/' + orderitem.inventory)
        .success(function(data, status, headers, config) {
          $log.info(
            'Released inventory=%O, status=%s, headers=%O, config=%O',
            data, status, headers, config);
          $scope.orderSelections[0].customer = data.customer;
          $scope.orderSelections[0].order = data.order;
          $scope.orderSelections[0].orderitem = data.orderitem;
          queryInventory();
        }).error(function(data, status, headers, config) {
          $log.error(
            'Failed to release inventory=%O, status=%s, headers=%O, config=%O',
            data, status, headers, config);
        });
    };

    $scope.isUploading = false;
    $scope.startUploading = function() {
      $scope.isUploading = true;
    };

    $scope.uploadComplete = function (content) {
      $scope.isUploading = false;
      $scope.response = content.response;

      var orders = [];
      content.messages.forEach(function(m) {
        orders = orders.concat(makeOrderitemRows(m.customer)); //, m.order, m.orderitem));
      });

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
      columnDefs: [
        {field:'order.orderNumber', displayName:'Order', enableCellEdit: false, width: '90'},
        {field:'order.shipByDate', displayName:'Ship By Date', enableCellEdit: false, width: '110', cellFilter: 'date'},
        {field:'order.forDate', displayName:'For Date', enableCellEdit: true, width: '110', cellFilter: 'date'},
        {field:'order.bride', displayName:'Bride', enableCellEdit: true, width: '150'},
        {field:'orderitem.itemDescription[0].style', displayName:'Style', enableCellEdit: true, width: '70'},
        {field:'orderitem.itemDescription[0].size', displayName:'Size', enableCellEdit: true, width: '70', cellFilter: 'join:" | "'},
        {field:'orderitem.itemDescription[0].color', displayName:'Color', enableCellEdit: true, width: '70'},
        {field:'orderitem.backup', displayName:'Backup', enableCellEdit: true, width: '70'},
        {field:'customer.name', displayName: 'Name', enableCellEdit: true, width: '150'},
        {field:'customer.email', displayName: 'Email', enableCellEdit: true, width: '150'},
        {field:'customer.telephone', displayName: 'Phone', enableCellEdit: true, width: '100'},
        {field:'order.shipTo[0].street', displayName: 'Street', enableCellEdit: true, width: '150'},
        {field:'order.shipTo[0].city', displayName: 'City', enableCellEdit: true, width: '100'},
        {field:'order.shipTo[0].state', displayName: 'State', enableCellEdit: true, width: '80'},
        {field:'order.shipTo[0].zipcode', displayName: 'Zip', enableCellEdit: true, width: '50'},
      ]
    };



    $scope.inventoryData = [];
    $scope.inventorySelections = [];
    $scope.searchBy = [true, true, true];


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
          $scope.inventoryData = data;
        }).error(function(data, status, headers, config) {
          $log.error(
            'Failed to find inventory for orderitem=%O, status=%s, data=%O, headers=%O, config=%O',
            orderitem, status, data, headers, config);
          $scope.inventoryData = [];
        });
    }

    $scope.$watchCollection('searchBy', queryInventory);
    $scope.$watchCollection('orderSelections', queryInventory);


    $scope.isInventoryReservable = function() {
      var sel = $scope.inventorySelections[0];
      return sel && sel.availabilityStatus === 'available' && !$scope.hasAssignedInventory();
    };

    $scope.hasAssignedInventory = function() {
      var isAssigned = $scope.orderSelections[0] && $scope.orderSelections[0].orderitem.inventory !== undefined;
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
        // {field:'inventory.status', displayName:'Status'},
        {field:'inventory.tagId', displayName:'Tag Id'},
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
        }).error(function(data, status, headers, config) {
          $log.error(
            'Failed to add orderitem=%O, status=%s, data=%O, headers=%O, config=%O',
            $scope.newOrderItem, status, data, headers, config);
        });
    };
  }

  OrderController.$inject = ['$scope', '$log', '$http', '$filter'];

  return OrderController;
};
