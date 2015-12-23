'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    queryInterface.addColumn(
      'Users',
      'facebookId',
      {
        type: DataTypes.STRING
      }
    );

    queryInterface.addColumn(
      'Users',
      'facebookAccessToken',
      {
        type: DataTypes.STRING
      }
    );
    queryInterface.addColumn(
      'Users',
      'googleplusId',
      {
        type: DataTypes.STRING
      }
    );
    queryInterface.addColumn(
      'Users',
      'googleplusAccessToken',
      {
        type: DataTypes.STRING
      }
    );
  },

  down: function (queryInterface, DataTypes) {
    queryInterface.removeColumn('Users', 'isActivated');
    queryInterface.removeColumn('Users', 'token');
  }
};
