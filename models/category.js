"use strict";

module.exports = function(sequelize, DataTypes) {
  var Category = sequelize.define("Category", {
    "name_en-US": {
      type: DataTypes.STRING
    },
    "name_zh-HK": {
      type: DataTypes.STRING
    }
  }, {
    classMethods: {
      associate: function(models) {
        Category.hasMany(models.Post)
      },
      createMeta: function(i){
        var categories = [[1,"搞笑","Funny"],[2,"認真","Serious"],[3,"無聊","Boring"],[4,"好奇","Curious"]];
        if (i>=categories.length) {
          return;
        };
        Category.findOrCreate({where:{id: categories[i][0]}}).spread(function (cat,created) {
          cat["name_zh-HK"] = categories[i][1];
          cat["name_en-US"] = categories[i][2];
          cat.save().then(function(){
            Category.createMeta(i+1);
          });
        });
      }
    }
  });

  return Category;
};