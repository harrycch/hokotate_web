'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    queryInterface.addColumn(
      'Posts',
      'commentCount',
      {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    )
  },

  down: function (queryInterface, DataTypes) {
    queryInterface.removeColumn('Posts', 'commentCount')
  }
};
