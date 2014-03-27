'use strict';

module.exports = function() {

  function Global() {
    var _this = this;
    _this._data = {
      user: window.user,
      authenticated: !! window.user
    };

    return _this._data;
  }

  return Global;
};
