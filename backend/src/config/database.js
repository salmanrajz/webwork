import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const {
  DATABASE_URL,
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'webwork',
  DB_USER = 'postgres',
  DB_PASSWORD = 'postgres',
  NODE_ENV = 'development'
} = process.env;

const connectionUri = DATABASE_URL || `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

const sequelize = new Sequelize(connectionUri, {
  logging: NODE_ENV === 'development' ? console.log : false,
  dialect: 'postgres',
  define: {
    underscored: true,
    freezeTableName: true
  }
});

export default sequelize;
