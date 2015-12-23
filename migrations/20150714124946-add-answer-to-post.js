'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    queryInterface.addColumn(
      'Posts',
      'answer',
      {
        type: DataTypes.TEXT
      }
    )
  },

  down: function (queryInterface, DataTypes) {
    queryInterface.removeColumn('Posts', 'answer')
  }
};
