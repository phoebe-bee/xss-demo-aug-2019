module.exports = function (sequelize, DataTypes) {
    var post = sequelize.define('post', {
        title: {
            type: DataTypes.STRING,
            allowNull:false
        },
        post_body: {
            type: DataTypes.STRING,
            allowNull:false
        },
        author: {
            type: DataTypes.STRING,
            allowNull:false
        }
    });
    return post;
};