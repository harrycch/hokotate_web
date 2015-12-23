"use strict";

module.exports = function(sequelize, DataTypes) {
  var VoterVoted = sequelize.define('VoterVoted', {
    vote: {
      type: DataTypes.ENUM,
      values: ['hoko','tate'],
      allowNull: false
    }
  });

  return VoterVoted;
};