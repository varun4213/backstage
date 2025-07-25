const path = require('path');

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, '../../survey.db')
    },
    migrations: {
      directory: path.resolve(__dirname, 'migrations')
    },
    useNullAsDefault: true
  }
};
