import dotenv from 'dotenv';
import app from './app.js';
import sequelize from './config/database.js';
import { info, error } from './utils/logger.js';
import './models/index.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

const start = async () => {
  try {
    await sequelize.authenticate();
    info('Database connection established');
    await sequelize.sync();
    info('Database synced');

    app.listen(PORT, () => {
      info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    error('Unable to start the server', err);
    process.exit(1);
  }
};

start();
