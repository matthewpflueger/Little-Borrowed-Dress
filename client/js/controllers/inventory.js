'use strict';

module.exports = function(_, moment) {

  _ = _ || require('lodash');
  moment = moment || require('moment');

  function InventoryController($scope, $log, $http) {
    // function findEntity(customer, orderitemId) {
    //   return _.find(makeOrderItemRows(customer), function(e) {
    //     return orderitemId === e.orderitem.id;
    //   });
    // }

    // function makeOrderItemRows(customer) {
    //   // $log.info('makeOrderItemRows customer=%O', customer);
    //   var rows = [];
    //   _.forEach(customer.orders, function(order) {
    //     _.forEach(order.orderitems, function(orderitem) {
    //       rows.push({
    //         customer: customer,
    //         order: order,
    //         orderitem: orderitem
    //       });
    //     });
    //   });
    //   return rows;
    // }

    $scope.isUploading = false;
    $scope.startUploading = function() {
      $scope.isUploading = true;
    };

    $scope.uploadComplete = function (content) {
      console.log(content);
      $scope.isUploading = false;
      $scope.response = content.response;
      $scope.inventoryData = content.inventoryData;
    };

    $scope.inventoryData = [];
    $scope.inventorySelections = [];
    $scope.gridOptions = {
      data: 'inventoryData',
      selectedItems: $scope.inventorySelections,
      showGroupPanel: true,
      jqueryUIDraggable: true,
      enableCellSelection: true,
      multiSelect: false,
      columnDefs: [
        {field:'Style', displayName:'Style'},
        {field:'Size', displayName:'Size'},
        {field:'Color', displayName:'Color'},
        {field:'Status', displayName:'Status'}
      ]
    };
  }

  InventoryController.$inject = ['$scope'];

  return InventoryController;
};
