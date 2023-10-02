const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({
  path: './config.env',
});

process.on('uncaughtException', (error) => {
  console.log(error.message, error.name);
  console.log('Uncaught Exception Alert!');
  process.exit(1);
});

const app = require('./app');
const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);
mongoose
  .connect(DB)
  .then((con) => {
    console.log('SUCCESSFULLY CONNECT');
  })
  .catch((err) => console.log(err));

const server = app.listen(process.env.PORT);

process.on('unhandledRejection', (error) => {
  console.log(err.message, err.name);
  console.log('Uncaught Handled Rejection ALERT.');
  server.close(() => {
    console.error('Server is shutted down.... ! Node process will exit !');
    process.exit(1);
  });
});
