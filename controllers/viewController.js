const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const Tour = require("../models/tourModel");
const AppError = require("../utils/appError");
const Booking = require("../models/bookingModel");

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();

  res.status(200).render("overview", {
    title: "All Tours",
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({
    slug: req.params.slug,
  }).populate({
    path: "reviews",
    select: "review rating user",
  });

  if (!tour) {
    return next(new AppError("There is no with that name.", 404));
  }

  res.status(200).render("tour", {
    title: tour.name + " Tour",
    tour,
  });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render("login", {
    title: "Login",
  });
});

exports.getAccount = (req, res, next) => {
  res.status(200).render("account", {
    title: "Your account",
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    { new: true, runValidators: true }
  );

  res.status(200).render("account", {
    title: "Your Account",
    user: updatedUser,
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  // Find All Bookings

  const bookings = await Booking.find({
    user: req.user._id,
  });

  // Find Tours By Bookings
  const tourIds = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render("overview", {
    title: "My Tours",
    tours,
  });
});
