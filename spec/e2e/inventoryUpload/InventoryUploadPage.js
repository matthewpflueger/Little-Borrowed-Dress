'use strict';

function ProfilePage() {
  this.name = element(by.name('name'));
  this.email = element(by.name('email'));
  this.password = element(by.name('password'));
  this.saveButton = element(by.xpath('//form[1]/input[@type="submit"]'));
  this.error = element(by.model('profileError'));
}

ProfilePage.prototype = {
  get: function() {
    browser.get('index.html');
    // browser.get('index.html/#/profile');
    return this;
  },

  clearName: function() {
    this.name.clear();
    return this;
  },

  setName: function(text) {
    this.clearName();
    this.name.sendKeys(text);
    return this;
  },

  clearEmail: function() {
    this.email.clear();
    return this;
  },

  setEmail: function(text) {
    this.clearEmail();
    this.email.sendKeys(text);
    return this;
  },

  clearPassword: function() {
    this.password.clear();
    return this;
  },

  setPassword: function(text) {
    this.clearPassword();
    this.password.sendKeys(text);
    return this;
  },

  save: function() {
    this.saveButton.click();
    return this;
  },

  getErrorText: function() {
    return this.error.getText();
  }
};

module.exports = ProfilePage;

// class LoginPage
//   constructor: ->
//     @email = element `by`.name 'login-email'
//     @password = element `by`.name 'login-password'
//     @loginButton = element `by`.xpath '//form[1]/input[@type="submit"]'
//     @error = element `by`.model 'loginError'

//   get: ->
//     browser.get '/#/login'
//     browser.getCurrentUrl()

//   setEmail: (text) ->
//     @email.clear()
//     @email.sendKeys text
//     @

//   clearEmail: ->
//     @email.clear()
//     @

//   setPassword: (text) ->
//     @password.clear()
//     @password.sendKeys text
//     @

//   clearPassword: ->
//     @password.clear()
//     @

//   login: ->
//     @loginButton.click()
//     @

//   getErrorText: ->
//     @error.getText()