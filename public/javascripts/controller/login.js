define([
    'controller.base',
    'moment'    // Should be dependency of base
], function (baseController,moment) {
    'use strict';

    var self;
    var LoginController = function() {
        self = this;

        /** Build reference **/
        self.root = $('#content');

    };

    LoginController.prototype = new baseController();
    LoginController.prototype.constructor = LoginController;

    LoginController.prototype.init = function() {
        baseController.prototype.init(self);

        self.showAll();
    };

    $(document).ready(function() {
        var app = new LoginController();
        app.init();
    });
});