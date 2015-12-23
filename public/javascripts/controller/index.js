define([
    'controller.base',
    'moment'    // Should be dependency of base
], function (baseController,moment) {
    'use strict';

    var self;
    var IndexController = function() {
        self = this;

        /** Build reference **/
        self.root = $('#content');
        self.posts = $('.post');
        self.postBoxes = self.posts.find('.post-box');
        self.postBetweens = self.posts.find(".post-box-between");
        self.votablePosts = $('.post.votable');
        self.votablePostBoxes = self.votablePosts.find('.post-box');
        self.likeBtns = self.posts.find('.post-like');
        self.moreComments = self.posts.find('.comment-more');
        self.commentBoxes = self.posts.find('.comment-box');

        self.api = "/api";
        self.loginModal = $("#login-modal");
        self.loginBtn = self.loginModal.find(".loginmodal-submit");
        self.logoutBtn = $("#logout-btn");

        self.tabs = $("a[data-toggle=tab]");

        self.connectGoogleBtn = $("#btn-connect-google");
        self.connectFacebookBtn = $("#btn-connect-facebook");
    };

    IndexController.prototype = new baseController();
    IndexController.prototype.constructor = IndexController;

    IndexController.prototype.init = function() {
        baseController.prototype.init(self);

        self.initPost();
        self.initInfiniteScroll(self.reloadPost);

        self.votablePostBoxes.hover(self.onVoteBtnMouseIn,self.onVoteBtnMouseOut);
        self.votablePostBoxes.on("click",self.onVoteBtnClick);
        self.likeBtns.on("click", self.onLike);

        self.moreComments.on("click", self.onMoreComments);
        self.commentBoxes.keypress(function(e){
            var commentBox = $(this);
            if(e.keyCode == 13)
            {
                self.onCommentBoxEnter(commentBox);
            }
        });

        self.connectGoogleBtn.on("click",{network:"google"},self.connectSocialNetwork);
        self.connectFacebookBtn.on("click",{network:"facebook"},self.connectSocialNetwork);

        self.tabs.on("show.bs.tab",self.onTabShow);
        self.tabs.on("shown.bs.tab",self.reloadPost);

        self.showAll();
    };

    IndexController.prototype.onVoteBtnMouseIn = function () {
        var btn = $(this);
        if(!btn.hasClass("active")){
            var text = btn.find(".box-text"),
                overlay = btn.find(".box-overlay");

            if(!text.data("opacity")) text.data("opacity",text.css("opacity"));
            text.fadeTo("fast",1);
            btn.addClass("hover");
        }
    };

    IndexController.prototype.onVoteBtnMouseOut = function () {
        var btn = $(this);
        if(!btn.hasClass("active")){
            var text = btn.find(".box-text"),
                overlay = btn.find(".box-overlay");
            
            text.fadeTo("fast",text.data("opacity"));
            btn.removeClass("hover");
        }
    };

    IndexController.prototype.onVoteBtnClick = function () {
        var btn = $(this),
            post = btn.closest(".post"),
            postId = post.data("id"),
            vote = btn.data("vote"),
            data;

        if(btn.hasClass("active")){
            data = JSON.stringify({vote:"none"});
        }else{
            data = JSON.stringify({vote: vote});
        }

        $.ajax({
            url: self.api + "/posts/vote/" + postId,
            type: "POST",
            data: data,
            contentType: 'application/json'
        }).done(function(){
            var sib = btn.siblings(".post-box");
            btn.toggleClass("active").removeClass("inactive").removeClass("hover");
            sib.toggleClass("inactive").removeClass("active").removeClass("hover");
            var text = sib.find(".box-text"),
                overlay = sib.find(".box-overlay");
            
            text.fadeTo("fast",text.data("opacity"));
            sib.removeClass("hover");

        }).fail(function( jqXHR, textStatus ) {
            var errorObj = jqXHR.responseJSON.error;
            self.genericErrorHandler(errorObj);
        });
    };

    IndexController.prototype.onMoreComments = function () {
        var moreCommentBtn = $(this),
            post = moreCommentBtn.closest(".post"),
            postId = post.data('id'),
            page = moreCommentBtn.data('nextpage'),
            commentRow = moreCommentBtn.closest('.comment-row').siblings('.comment-real-row.template')[0],
            moreCommentRow = moreCommentBtn.closest(".comment-row"),
            commentList = moreCommentBtn.closest(".post-comment-list");

        moreCommentRow.addClass("loading");

        $.ajax({
            url: self.api + "/posts/comment/" + postId + "?page=" + page,
            type: "GET",
            contentType: 'application/json'
        }).done(function(data){
            moreCommentRow.removeClass("loading");
            $.each(data.comments, function (i,comment) {
                var newCommentRow = $(commentRow).clone().removeClass("template");
                newCommentRow.find(".comment-user").text(comment.User.preferredName || comment.User.username);
                newCommentRow.find(".comment-time").text(moment(comment.createdAt).fromNow());
                newCommentRow.find(".comment-content").text(comment.message);
                newCommentRow.appendTo(commentList);
            });
            if (data.hasNext) {
                moreCommentBtn.data("nextpage", page+1);
                moreCommentRow.appendTo(commentList);
            }else{
                moreCommentRow.remove();
            }

        }).fail(function( jqXHR, textStatus ) {
            var errorObj = jqXHR.responseJSON.error;
            self.genericErrorHandler(errorObj);
            moreCommentRow.removeClass("loading");
        });
    };

    IndexController.prototype.onLike = function () {
        var likeBtn = $(this),
            post = likeBtn.closest('.post'),
            postId = post.data("id");

        $.ajax({
            url: self.api + "/posts/like/" + postId,
            type: "POST",
            contentType: 'application/json'
        }).done(function(){
            likeBtn.toggleClass("active");

        }).fail(function( jqXHR, textStatus ) {
            var errorObj = jqXHR.responseJSON.error;
            self.genericErrorHandler(errorObj);
        });
    };

    IndexController.prototype.onCommentBoxEnter = function (commentBox) {
        var post = commentBox.closest(".post"),
            postId = post.data("id"),
            message = commentBox.val(),
            commentList = commentBox.closest(".post-comment-list"),
            commentRow = commentList.find(".comment-real-row.template")[0];

        $.ajax({
            url: self.api + "/posts/comment/" + postId,
            data: JSON.stringify({message:message}),
            type: "POST",
            contentType: 'application/json'
        }).done(function(res){
            var comment = res.comment;
            var newCommentRow = $(commentRow).clone().removeClass("template");
            newCommentRow.find(".comment-user").text(comment.User.preferredName || comment.User.username);
            newCommentRow.find(".comment-time").text(moment(comment.createdAt).fromNow());
            newCommentRow.find(".comment-content").text(comment.message);
            newCommentRow.insertAfter(commentRow);

            commentBox.val("");

            var postCount = post.find(".post-feedback .post-comment"),
                currentCount = postCount.data("count"),
                nextCount = parseInt(currentCount)+1,
                postCounta = postCount.find("a");

            postCount.data("count",nextCount);
            postCounta.text(nextCount + postCount.data(nextCount==1 ? "singular":"plural"));

        }).fail(function( jqXHR, textStatus ) {
            var errorObj = jqXHR.responseJSON.error;
            self.genericErrorHandler(errorObj);
        });
    };

    IndexController.prototype.onTabShow = function () {
        var tabBtn = $(this),
            tabId = tabBtn.attr("href"),
            tab = $(tabId),
            tabContent = tab.find(".infinite-scroll"),
            tabRow = tabContent.closest(".row"),
            newTabContent = $("<div class=\"infinite-scroll\"></div>").appendTo(tabRow),
            tabLink = tabBtn.data("link");

        if (tabBtn.hasClass("tab-reload")) {
            tabContent.remove();

            $.ajax({
                url: "/more/"+tabLink,
                type: "GET"
            }).done(function(res){
                $(res).appendTo(newTabContent);
                self.reloadPost();
                self.initInfiniteScroll(self.reloadPost);
            }).fail(function( jqXHR, textStatus ) {
                var errorObj = jqXHR.responseJSON.error;
                self.genericErrorHandler(errorObj);
            });
        };
    };

    IndexController.prototype.connectSocialNetwork = function (e) {
        var btn = $(this),
            network = e.data.network,
            type = btn.data("connect");         // "connect"  or "disconnect"

        if (type=="disconnect") {
            $.ajax({
                url: self.api + "/users/connect",
                data: JSON.stringify({
                    network:network,
                    type:type
                }),
                type: "POST",
                contentType: 'application/json'
            }).done(function(res){
                self.pageReloadWithQuery("");

            }).fail(function( jqXHR, textStatus ) {
                var errorObj = jqXHR.responseJSON.error;
                self.genericErrorHandler(errorObj);
            });
        }else{
            switch(network){
                case "facebook":
                self.facebookLogin();
                break;

                case "google":
                self.googleplusLogin();
                break;

                default:
                break;
            }
        }
        
    };

    IndexController.prototype.reloadPost = function () {
        self.posts = $('.post');
        self.postBoxes = self.posts.find('.post-box');
        self.postBetweens = self.posts.find(".post-box-between");
        self.votablePosts = $('.post.votable');
        self.votablePostBoxes = self.votablePosts.find('.post-box');
        self.likeBtns = self.posts.find('.post-like');

        self.initPost();

        self.votablePostBoxes.off();
        self.votablePostBoxes.hover(self.onVoteBtnMouseIn,self.onVoteBtnMouseOut);
        self.votablePostBoxes.on("click",self.onVoteBtnClick);
        self.likeBtns.off();
        self.likeBtns.on("click", self.onLike);
    };

    $(document).ready(function() {
        var app = new IndexController();
        app.init();
    });
});