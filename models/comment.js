'use strict';
var config = require("../core/config");

module.exports = function(sequelize, DataTypes) {
  var Comment = sequelize.define('Comment', {
    message: {
      type: DataTypes.TEXT
    }
  }, {
    classMethods: {
      associate: function(models) {
        Comment.belongsTo(models.Post, {as: 'Post'});
        Comment.belongsTo(models.User, {as: 'User'});
      },
      hasNext: function (id,offset,callback) {
        Comment.count({
          where: {PostId:id}
        }).then(function (c) {
          var check = (offset)+config.commentPerPage; 
          callback(c>check);
        });
      }
    },
    scopes: {
      byPost: function (req,models,id,offset) {
        var attributes = ["id","message","createdAt","PostId"],
            include = [{model:models.User, as:'User',attributes:['id','username','preferredName']}],
            where = {},
            orderBy = [],
            limit = config.commentPerPage;

        where.PostId = id;
        orderBy.push(["createdAt","DESC"]);
        
        return {
          include: include,
          attributes: attributes,
          where: where,
          offset: offset,
          order: orderBy,
          limit: limit
        };
      }
    }
  });
  return Comment;
};