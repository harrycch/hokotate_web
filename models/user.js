"use strict";

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    preferredName: {
      type: DataTypes.STRING
    },
    username: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING
    },
    isActivated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    token: {
      type: DataTypes.STRING
    },
    facebookId: {
      type: DataTypes.STRING
    },
    facebookAccessToken: {
      type: DataTypes.TEXT
    },
    googleplusId: {
      type: DataTypes.STRING
    },
    googleplusAccessToken: {
      type: DataTypes.TEXT
    }
  }, {
    classMethods: {
      associate: function(models) {
        User.hasMany(models.Post, {as: 'Post'});
        User.hasMany(models.Comment, {as: 'Comment'});
        User.belongsToMany(models.Post, {as: 'Liked', through: models.LikerLiked, foreignKey: 'userId'});
        User.belongsToMany(models.Post, {as: 'Voted', through: models.VoterVoted, foreignKey: 'userId'});
      }
    },
    instanceMethods: {
      setUserIdAccessToken: function (network,userId, accessToken, callback) {
        switch(network){
          case "facebook":
          this.facebookId = userId;
          this.facebookAccessToken = accessToken;
          break;

          case "google":
          this.googleplusId = userId;
          this.googleplusAccessToken = accessToken;
          break;

          default:
          break;
        }

        this.save().then(function (user) {
          callback(user); 
        });
      },
      setAccessToken: function (network, accessToken, callback) {
        switch(network){
          case "facebook":
          this.facebookAccessToken = accessToken;
          break;

          case "google":
          this.googleplusAccessToken = accessToken;
          break;

          default:
          break;
        }

        this.save().then(function (user) {
          callback(user); 
        });
      }
    }
    // defaultScope: {
    //   attributes: ['id','username','preferredName','isActivated','token']
    // }
  });

  return User;
};