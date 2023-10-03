const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const User = require("./../models/userModel");
const AppError = require("../utils/appError");
const Email = require("../utils/email");

const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieConfig = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV == "production") {
    cookieConfig.secure = true;
  }

  res.cookie("jwt", token, cookieConfig);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const userData = req.body;
  const newUser = await User.create({
    name: userData.name,
    email: userData.email,
    password: userData.password,
    passwordConfirm: userData.passwordConfirm,
    passwordChangedAt: userData.passwordChangedAt,
  });

  const url = `${req.protocol}://${req.get("host")}/me`;

  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const user = await User.findOne({
    email,
  }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect password or email !", 401));
  }

  createSendToken(user, 200, res);
});

exports.logout = (req, res, next) => {
  res.cookie("jwt", "loggedout", {
    expiresIn: Date.now() + 10000,
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in ! Please login to get access", 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError("The user belonging to the token does no longer exist.", 401)
    );
  }

  if (currentUser.changesPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password . Please login again!", 401)
    );
  }

  //Grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// only for rendered website frontend
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }

      if (currentUser.changesPasswordAfter(decoded.iat)) {
        return next();
      }

      //There is logged in user
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  }
  next();
});

exports.restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
    next();
  });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with that email address", 404));
  }

  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.json({ status: "success", message: "Token Sent to email!" });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("Error while sending email. Try again later !", 500)
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");
  const { currentPassword, password, passwordConfirm } = req.body;

  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;

  await user.save();
  //user.findByIdAndUpdate will not work on validator and pre save hook

  createSendToken(user, 200, res);
});
