define([
    'controller.base',
    'moment'    // Should be dependency of base
], function (baseController,moment) {
    'use strict';

    var self;
    var ResetPasswordController = function() {
        self = this;

        /** Build reference **/
        self.root = $('#content');

    };

    ResetPasswordController.prototype = new baseController();
    ResetPasswordController.prototype.constructor = ResetPasswordController;

    ResetPasswordController.prototype.init = function() {
        baseController.prototype.init(self);

        self.showAll();
    };

    $(document).ready(function() {
        var app = new ResetPasswordController();
        app.init();
    });
});