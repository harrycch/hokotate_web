"use strict";

module.exports = function(sequelize, DataTypes) {
  var LikerLiked = sequelize.define('LikerLiked', {
    // no_use: {
    //   type: DataTypes.STRING,
    //   allowNull: true
    // }
  });

  return LikerLiked;
};