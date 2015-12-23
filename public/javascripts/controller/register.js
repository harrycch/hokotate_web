define([
    'controller.base',
    'moment'    // Should be dependency of base
], function (baseController,moment) {
    'use strict';

    var self;
    var RegisterController = function() {
        self = this;

        /** Build reference **/
        self.root = $('#content');

    };

    RegisterController.prototype = new baseController();
    RegisterController.prototype.constructor = RegisterController;

    RegisterController.prototype.init = function() {
        baseController.prototype.init(self);

        self.showAll();
    };

    $(document).ready(function() {
        var app = new RegisterController();
        app.init();
    });
});