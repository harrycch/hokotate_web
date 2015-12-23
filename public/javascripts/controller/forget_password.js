define([
    'controller.base',
    'moment'    // Should be dependency of base
], function (baseController,moment) {
    'use strict';

    var self;
    var ForgetPasswordController = function() {
        self = this;

        /** Build reference **/
        self.root = $('#content');

    };

    ForgetPasswordController.prototype = new baseController();
    ForgetPasswordController.prototype.constructor = ForgetPasswordController;

    ForgetPasswordController.prototype.init = function() {
        baseController.prototype.init(self);

        self.showAll();
    };

    $(document).ready(function() {
        var app = new ForgetPasswordController();
        app.init();
    });
});