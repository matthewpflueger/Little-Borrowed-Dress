'use strict';

module.exports = function(_, moment) {
  console.log('Inside OrderController file');

  _ = _ || require('lodash');
  moment = moment || require('moment');

  function OrderController($scope, $log, $http) {

    function makeOrderitemRows(customer) {
      $log.info('makeOrderitemRows customer=%O', customer);
      var rows = [];
      _.forEach(customer.orders, function(order) {
        _.forEach(order.orderitems, function(orderitem) {
          rows.push({
            size: orderitem.itemDescription[0].size.join(' | '),
            customer: customer,
            order: order,
            orderitem: orderitem
          });
        });
      });
      return rows;
    }

    $scope.$on('ngGridEventEndCellEdit', function(evt) {
      var entity = evt.targetScope.row.entity;
      //FIXME this logic is duplicated from the Order model :(
      entity.order.shipByDate = moment(entity.order.weddingDate).subtract('weeks', 3).day('Friday').toDate();
      entity.orderitem.itemDescription[0].size = entity.size.match(/(\d+)/g);
      $scope.changesToSave[entity.customer._id] = entity.customer;
      $log.info('Save entity=%O', $scope.changesToSave);

      $http
        .put('/orders/' + entity.customer._id, entity.customer)
        .success(function(data, status, headers, config) {
          $log.info(
            'Saved customer=%s, status=%s, data=%O, headers=%O, config=%O',
            entity.customer.email, status, data, headers, config);
        }).error(function(data, status, headers, config) {
          $log.error(
            'Could not save customer=%s, status=%s, data=%O, headers=%O, config=%O',
            entity.customer.email, status, data, headers, config);
        });

    });

    $scope.all = function() {
      $http
        .get('/orders')
        .success(function(data, status, headers, config) {
          $log.info(
            'Fetched orders=%O, status=%s, headers=%O, config=%O',
            data, status, headers, config);

          $scope.response = data.response;

          var rows = [];

          _.forEach(data.messages, function(c) {
            rows = rows.concat(makeOrderitemRows(c));
          });

          $scope.orderData = rows;
        }).error(function(data, status, headers, config) {
          $log.error(
            'Failed to fetch orders=%O, status=%s, headers=%O, config=%O',
            data, status, headers, config);
        });
    };

    $scope.isUploading = true;
    $scope.startUploading = function() {
      console.log('uploading....');
      $scope.isUploading = true;
    };

    $scope.uploadComplete = function (content) {
      console.log(content);
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
      columnDefs: [
        {field:'order.orderNumber', displayName:'Order', enableCellEdit: false, width: '90'},
        {field:'order.shipByDate', displayName:'Ship By Date', enableCellEdit: false, width: '110', cellFilter: 'date'},
        {field:'order.weddingDate', displayName:'Wedding Date', enableCellEdit: true, width: '110', cellFilter: 'date'},
        {field:'order.bride', displayName:'Bride', enableCellEdit: true, width: '150'},
        {field:'orderitem.itemDescription[0].style', displayName:'Style', enableCellEdit: true, width: '50'},
        {field:'size', displayName:'Size', enableCellEdit: true, width: '50'},
        {field:'orderitem.itemDescription[0].color', displayName:'Color', enableCellEdit: true, width: '50'},
        {field:'customer.name', displayName: 'Name', enableCellEdit: true, width: '150'},
        {field:'customer.email', displayName: 'Email', enableCellEdit: true, width: '150'},
        {field:'customer.telephone', displayName: 'Phone', enableCellEdit: true, width: '100'},
        {field:'order.shipTo[0].street', displayName: 'Street', enableCellEdit: true, width: '150'},
        {field:'order.shipTo[0].city', displayName: 'City', enableCellEdit: true, width: '100'},
        {field:'order.shipTo[0].state', displayName: 'State', enableCellEdit: true, width: '80'},
        {field:'order.shipTo[0].zipcode', displayName: 'Zip', enableCellEdit: true, width: '50'},
      ]
    };
  }

  OrderController.$inject = ['$scope', '$log', '$http', '$filter'];

  return OrderController;
};
