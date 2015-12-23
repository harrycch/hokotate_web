'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    queryInterface.changeColumn(
      'Users',
      'facebookAccessToken',
      DataTypes.TEXT
    );
    queryInterface.changeColumn(
      'Users',
      'googleplusAccessToken',
      DataTypes.TEXT
    );
  },

  down: function (queryInterface, DataTypes) {
    queryInterface.changeColumn(
      'Users',
      'nameOfAnExistingAttribute',
      DataTypes.STRING
    );
    queryInterface.changeColumn(
      'Users',
      'googleplusAccessToken',
      DataTypes.STRING
    );
  }
};
