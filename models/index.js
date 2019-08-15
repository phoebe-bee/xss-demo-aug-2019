var Sequelize = require('sequelize');

sequelize = new Sequelize('database', 'username', 'password', {
    dialect: 'sqlite',
    storage: './dev-database.sqlite'
});

//define the database
global.db = {
    Sequelize:  Sequelize,
    sequelize:  sequelize,
    user:  sequelize.import(__dirname + '/user'),
    post:  sequelize.import(__dirname + '/post')
};

//add relations/assocations by calling the `associate` method defined in the model
Object.keys(global.db).forEach(function(modelName) {
    if ('associate' in global.db[modelName]) {
        global.db[modelName].associate(global.db);
    }
});

module.exports = global.db;