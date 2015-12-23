define([
    'jquery',
    'moment',
    'bootstrap',
    'textfill',
    'imagescale',
    'gapi',
    'sweet-alert',
    'jscroll'
], function($,moment,bootstrap,textfill,imagescale)
{
    'use strict';

    var me = function() {
        me.api = "/api";
        me.loginModal = $("#login-modal");
        me.loginBtn = me.loginModal.find(".btn-submit");
        me.logoutBtn = $("#logout-btn");
        me.registerModal = $("#register-modal");
        me.registerBtn = me.registerModal.find(".btn-submit");
        me.header = $('#header');
        me.resendEmailBtn = $("#btn-resend-confirmation-email");
        me.facebookLoginBtn = $("#fb-login");
        me.googleLoginBtn = $("#g-login");
    };

    me.prototype.init = function(context, config, callback) {
        initFacebook();
        initGooglePlus();
        initMoment();
        initGeneralUI();
        initCountdown();

        me.loginBtn.on("click",me.prototype.loginUser);
        me.registerBtn.on("click",me.prototype.registerUser);
        me.logoutBtn.on("click", me.prototype.logoutUser);
        me.resendEmailBtn.on("click",me.prototype.resendConfirmationEmail);
        me.loginModal.on("show.bs.modal",function(){me.registerModal.modal('hide');});
        me.registerModal.on("show.bs.modal",function(){me.loginModal.modal('hide');});

        if (callback) callback.call(this);
    };

    me.prototype.showAll = function () {
        $('body').css('visibility', 'visible');
    };

    me.prototype.getCurrentUrl = function(){
        var loc = window.location;
        return loc.href.split("?")[0].split("#")[0];
    };

    // me.prototype.getBackUrl = function(){
        // var loc = this.getCurrentUrl(),
            // backLoc = loc.split("/details")[0];
        // return backLoc;
    // };

    me.prototype.pageReloadWithQuery = function(q){
        window.location.href = this.getCurrentUrl() + q;
    };

    // me.prototype.pageBackWithQuery = function(q){
    //     window.location.href = this.getBackUrl() + q;
    // };

    me.prototype.initPost = function () {
        me.prototype.initPostBox();
        me.prototype.initImageScale();
        me.prototype.initTextFill();
    };

    me.prototype.initPostBox = function () {
        $('.post .post-box').each(function () {
            $(this).height($(this).width());
        });
        $('.post .post-box-between').each(function () {
            var w = $(this).width(),
                margin = 15,
                ratio = 0.45;
            $(this).height((w+margin*2)*ratio);
        });
    };

    me.prototype.initImageScale = function () {
        $("img.scale").each(function(){
            var self = $(this);
            self.imageScale({
                destHeight: self.parent().innerHeight(),
                destWidth: self.parent().innerWidth()
            });
        });
    };

    me.prototype.initTextFill = function () {
        $(".textfill").textfill({});
    };

    me.prototype.registerUser = function () {
        var userInput = me.registerModal.find('input[name=username]'),
            passInput = me.registerModal.find('input[name=password]'),
            passCfmInput = me.registerModal.find('input[name=password_confirm]'),
            nameInput = me.registerModal.find('input[name=preferred_name]');
                
        var username = userInput.val(),
            password = passInput.val() || "",
            passwordCfm = passCfmInput.val() || "",
            preferredName = nameInput.val();

        me.registerBtn.button("loading");

        var data = JSON.stringify({
                username:username,
                password:password,
                passwordConfirm: passwordCfm,
                preferredName: preferredName
            });

        $.ajax({
            url: me.api + "/users/register",
            type: "POST",
            data: data,
            contentType: 'application/json'
        }).done(function(){
            // self.pageReloadWithQuery("?page="+self.pageNumActive.text());
            me.prototype.pageReloadWithQuery("");
        }).fail(function( jqXHR, textStatus ) {
            var errorObj = jqXHR.responseJSON.error;
            me.registerBtn.button("reset");
            me.registerModal.find('.message').text(errorObj.message).show();
        });
    };

    me.prototype.loginUser = function () {
        var userInput = me.loginModal.find('input[name=username]'),
            passInput = me.loginModal.find('input[name=password]');
        var username = userInput.val(),
            password = passInput.val();

        me.loginBtn.button("loading");

        var data = JSON.stringify({
                username:username,
                password:password
            });

        $.ajax({
            url: me.api + "/users/login",
            type: "POST",
            data: data,
            contentType: 'application/json'
        }).done(function(){
            // self.pageReloadWithQuery("?page="+self.pageNumActive.text());
            me.prototype.pageReloadWithQuery("");
        }).fail(function( jqXHR, textStatus ) {
            var errorObj = jqXHR.responseJSON.error;
            me.loginBtn.button("reset");
            me.loginModal.find('.message').text(errorObj.message).show();
        });
    };

    me.prototype.logoutUser = function () {
        $.ajax({
            url: me.api + "/users/logout",
            type: "POST",
            contentType: 'application/json'
        }).done(function(){
            me.prototype.pageReloadWithQuery("");
        }).fail(function( jqXHR, textStatus ) {
            var errorObj = jqXHR.responseJSON.error;
        });
    };

    me.prototype.resendConfirmationEmail = function () {
        $.ajax({
            url: me.api + "/users/email/resend",
            type: "POST",
            contentType: 'application/json'
        }).done(function(){
            me.prototype.pageReloadWithQuery("");
        }).fail(function( jqXHR, textStatus ) {
            var errorObj = jqXHR.responseJSON.error;
        });
    };

    me.prototype.genericErrorHandler = function (errorObj) {
        switch(errorObj.code){
            case "USR004":  // need login
            me.loginModal.modal('show');
            break;
            case "POS006":  // post expired


            case "POS003":  // post not found
            case "POS004":  // vote invalid

            default:
            me.prototype.alert(errorObj.message);
            break;
        }
    }

    me.prototype.initInfiniteScroll = function (callback) {
        console.log("haha",$('.infinite-scroll'));
        $('.infinite-scroll').jscroll({
            loadingHtml: '<img src="/images/loading.gif" alt="Loading" />',
            debug:true,
            padding: 10,
            nextSelector: 'a.scroll-next:last',
            callback: callback
        });
    }

    function initGeneralUI () {
        $('[data-toggle="tooltip"]').tooltip();
    };

    function initMoment(){
        var locale = me.header.data('locale');
        moment.locale(locale);
    };

    function initCountdown () {
        setInterval(function () {
            $('.countdown').each(function () {
                var countdown = $(this),
                    expire = countdown.data("expire"),
                    expired = countdown.data("expired");

                countdown.text(moment(expire).isAfter()? moment(expire).fromNow():expired);
            });
        }, 1000);
    };


    function initFacebook() {
        window.fbAsyncInit = function() {
            FB.init({
                appId      : '977486078949704',  //test
                // appId      : '977468252284820',
                xfbml      : true,
                version    : 'v2.3'
            });
        };

        //copy from facebook.com
        (function(d, s, id){
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) {return;}
            js = d.createElement(s); js.id = id;
            js.src = "//connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));

        me.facebookLoginBtn.on("click",me.prototype.facebookLogin);
    }

    me.prototype.facebookLogin = function() {
        FB.getLoginStatus(function(response) {
            if (response.status=="connected") {
                afterFacebookLogin(response.authResponse);
            }else{
                FB.login(function(response) {
                    if (response.status === 'connected') {
                        if (authResponse.grantedScopes.split(",").indexOf("email")==-1) {
                            facebookLogin();
                            return;
                        }else{
                            afterFacebookLogin(response.authResponse);
                        }
                    } else if (response.status === 'not_authorized') {
                        // The person is logged into Facebook, but not your app.
                    } else {
                        // The person is not logged into Facebook, so we're not sure if
                        // they are logged into this app or not.
                    }
                }, {
                    scope: 'public_profile,email',
                    auth_type: 'rerequest',
                    return_scopes: true
                });
            }
        });
    }

    function afterFacebookLogin(authResponse) {
        FB.api('/me', {fields: 'email,name'}, function (response) {
            afterSocialLogin({
                network: "facebook", 
                userId: authResponse.userID,
                accessToken: authResponse.accessToken,
                email: response.email,
                preferredName: response.name
            });
        });
    }

    function initGooglePlus () {
        // var btn = document.getElementById('g-login');

        gapi.load('auth2', function(){
            // Retrieve the singleton for the GoogleAuth library and set up the client.
            var auth2 = gapi.auth2.init({
                client_id: '554013741840-p064o1d2rgsrrt4qrjq9gug73v86beci.apps.googleusercontent.com',
                cookiepolicy: 'single_host_origin',
                // Request scopes in addition to 'profile' and 'email'
                scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/plus.me'
            });

            // if (btn) {
                // auth2.attachClickHandler(btn, {}, function(googleUser) {
                //     console.log("~~~~~~");
                //     afterSocialLogin({
                //         network: "google", 
                //         userId: googleUser.getBasicProfile().getId(),
                //         accessToken: googleUser.getAuthResponse().id_token,
                //         email: googleUser.getBasicProfile().getEmail(),
                //         preferredName: googleUser.getBasicProfile().getName()
                //     });
                // }, function(error) {
                //     alert(JSON.stringify(error, undefined, 2));
                // });
            // };
            
            me.googleLoginBtn.on("click",me.prototype.googleplusLogin);  
        });
    }

    me.prototype.googleplusLogin = function () {
        var auth = gapi.auth2.getAuthInstance();

        auth.signIn();
        var googleUser = auth.currentUser.get();

        afterSocialLogin({
            network: "google", 
            userId: googleUser.getBasicProfile().getId(),
            accessToken: googleUser.getAuthResponse().id_token,
            email: googleUser.getBasicProfile().getEmail(),
            preferredName: googleUser.getBasicProfile().getName()
        });
    };

    function afterSocialLogin(data) {
        $.ajax({
            url: me.api + "/users/connect",
            type: "POST",
            data: JSON.stringify(data),
            contentType: 'application/json'
        }).success(function(){
            // self.pageReloadWithQuery("?page="+self.pageNumActive.text());
            me.prototype.pageReloadWithQuery("");
        }).fail(function( jqXHR, textStatus ) {
            var errorObj = jqXHR.responseJSON.error;
            me.prototype.alert(errorObj.message);
        });
    }

    me.prototype.alert = function (message) {
        swal("Oops...",message,"error");
    };

    return me;
});