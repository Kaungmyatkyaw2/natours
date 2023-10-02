const mongoose = require('mongoose');
const fs = require('node:fs');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: `${__dirname}/../../config.env` });

const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);
mongoose
  .connect(DB)
  .then((con) => {
    console.log('SUCCESSFULLY CONNECT');
    if (process.argv[2] === '--import') {
      importData();
    } else if (process.argv[2] === '--delete') {
      deleteData();
    }
  })
  .catch((err) => console.log(err));

const tours = fs.readFileSync(`${__dirname}/tours.json`, 'utf-8');
const users = fs.readFileSync(`${__dirname}/users.json`, 'utf-8');
const reviews = fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8');

const importData = async () => {
  try {
    await Tour.create(JSON.parse(tours), { validateBeforeSave: false });
    await User.create(JSON.parse(users), { validateBeforeSave: false });
    await Review.create(JSON.parse(reviews), { validateBeforeSave: false });
    console.log('Data Successfully Loaded!');
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit();
  }
};

const deleteData = async () => {
  try {
    await Tour.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});
    console.log('Data Successfully Deleted!');
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit();
  }
};
