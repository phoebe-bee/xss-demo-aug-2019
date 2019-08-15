module.exports = function (sequelize, DataTypes) {
    var user = sequelize.define('user', {
        email: {
            type: DataTypes.STRING,
            allowNull:false
        },
        username: {
            type: DataTypes.STRING,
            allowNull:false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        session: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });
    return user;
};