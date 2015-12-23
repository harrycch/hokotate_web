define([
    'controller.base',
    'moment'    // Should be dependency of base
], function (baseController,moment) {
    'use strict';

    var self;
    var SubmitController = function() {
        self = this;

        /** Build reference **/
        self.root = $('#content');

        self.api = "/api";
        self.loginModal = $("#login-modal");
        self.loginBtn = self.loginModal.find(".btn-submit");
        self.logoutBtn = $("#logout-btn");

    };

    SubmitController.prototype = new baseController();
    SubmitController.prototype.constructor = SubmitController;

    SubmitController.prototype.init = function() {
        baseController.prototype.init(self);

        self.showAll();
    };

    $(document).ready(function() {
        var app = new SubmitController();
        app.init();
    });
});