'use strict';

var ProfilePage = require('./ProfilePage');


describe('Profile Page', function() {

  var page = new ProfilePage();

  it('should warn on save if missing profile data', function() {
    page
      .get()
      .setName('test')
      .clearEmail()
      .setPassword('test')
      .save();
    expect(page.getErrorText()).toMatch('missing email');
  });

});