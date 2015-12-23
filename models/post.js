"use strict";
var config = require("../core/config"),
    moment = require("moment-timezone"),
    Sequelize = require("sequelize");

module.exports = function(sequelize, DataTypes) {
  var Post = sequelize.define('Post', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    hoko: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tate: {
      type: DataTypes.STRING,
      allowNull: false
    },
    hokoImg: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
    tateImg: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    commentCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    hokoCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    tateCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    expireAt: {
      type: DataTypes.DATE
    },
    tags: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
      get: function()  {
        var tags = this.getDataValue('tags');
        return tags.split(",").filter(function(v){return v!==''});
      },
    },
    answer: {
      type: DataTypes.TEXT
    }
  }, {
    classMethods: {
      associate: function(models) {
        Post.hasMany(models.Comment, {as: 'Comment'});
        Post.belongsTo(models.User, {as: 'User'});
        Post.belongsTo(models.Category);
        Post.belongsToMany(models.User, {as: 'Liker', through: models.LikerLiked, foreignKey: 'postId'});
        Post.belongsToMany(models.User, {as: 'Voter', through: models.VoterVoted, foreignKey: 'postId'});
      },
      getInclude: function (req,models) {
        var include = [ 
          {model:models.Category, attributes:['id','name_en-US','name_zh-HK']},
          {model:models.User, as:'User',attributes:['id','username','preferredName']},
        ];

        if (req.session.user) {
          include.push({
            model:models.User, 
            as:'Voter', 
            attributes: ['id','preferredName','username']
          })
          include.push({
            model:models.User, 
            as:'Liker', 
            attributes: ['id','preferredName','username']
          });
        };
        return include;
      },
      // use only for plain objects.   e.g. post.get({plain:true})    arr = post.Voter
      getOnlyMine: function (arr,req) {
        if (arr) {
          var isGot = false;
          for (var i = 0; i < arr.length; i++) {
            if(arr[i].id == req.session.user.id){
              arr = arr[i];
              isGot = true;
              break;
            }
          };
          if (!isGot) {
            arr = null;
          };
        };
        return arr;
      }
    },
    instanceMethods: {
      convert: function (req) {
        var post = this.get({
          plain:true
        });
        post.Voter = Post.getOnlyMine(post.Voter,req);
        post.Liker = Post.getOnlyMine(post.Liker,req);
        return post;
      }
    },
    scopes: {
      list: function(req,models,orderType,categoryId,votable,offset){
        var include = Post.getInclude(req,models),
            where = {},
            attributes = ['id','title','hoko','tate','hokoImg','tateImg','tags','expireAt','CategoryId','UserId','createdAt','hokoCount','tateCount','commentCount','answer'],
            categoryId = categoryId || {$not:null},
            orderBy = [];

        switch(votable){
          case "votable":
          where.expireAt= {
            $gte: moment().tz(config.moment.zeroTimeZone).format(config.moment.dateTimeFormat)
          };
          where.CategoryId= categoryId;
          break;
          
          case "results":
          where.expireAt= {
            $lt: moment().tz(config.moment.zeroTimeZone).format(config.moment.dateTimeFormat)
          };
          where.CategoryId= categoryId;
          // attributes.push("hokoCount","tateCount");
          break;

          case "mixed":
          default:
          where.CategoryId= categoryId;
          // attributes.push("hokoCount","tateCount");
          break;
        }

        switch(orderType){
          case "newest":
          orderBy = [['createdAt','DESC']];
          break;

          case "almost":
          orderBy = ['expireAt'];
          break;

          case "popular":
          default:
          orderBy = [[{ raw: 'hokoCount + tateCount DESC' }]];
          break;
        }

        return {
          include: include,
          attributes: attributes,
          where: where,
          limit: config.itemPerPage,
          order: orderBy,
          offset: offset
        };
      },
      details: function (req,models,id) {
        var include = Post.getInclude(req,models),
            where = {id:id};

        return {
          include: include,
          where: where
        };
      }
    }
  });

  return Post;
};