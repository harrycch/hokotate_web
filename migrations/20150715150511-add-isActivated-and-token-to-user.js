'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    queryInterface.addColumn(
      'Users',
      'isActivated',
      {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    );

    queryInterface.addColumn(
      'Users',
      'token',
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
