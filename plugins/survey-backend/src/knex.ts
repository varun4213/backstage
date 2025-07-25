import Knex from 'knex';
import path from 'path';

// Create a simple SQLite configuration for local development
const config = {
  client: 'sqlite3',
  connection: {
    filename: path.resolve(__dirname, '../../../survey.db')
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(__dirname, '../migrations')
  }
};

// Create and export the knex instance
const knex = Knex(config);

export default knex;
