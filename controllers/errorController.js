const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
  const error = new AppError(`Invalid ${err.path} : ${err.value}`, 400);
  return error;
};

const handleDuplicateErrorDB = (err) => {
  const duplicateValues = Object.values(err.keyValue).join(",");

  const message = `Duplicate field value : ${duplicateValues} , Please use another value !`;

  const error = new AppError(message, 400);
  return error;
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid Input Data . ${errors.join(". ")}`;

  const error = new AppError(message, 400);
  return error;
};

const handleJWTError = () => {
  return new AppError("Invalid Token ! Please login again !", 401);
};

const handleJWTExpiredError = () => {
  return new AppError("Your Token has expired ! Please login again !", 401);
};

const sendErrDev = (err, req, res) => {
  console.log({ err });
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  res.status(err.statusCode).render("error", {
    title: "Something went wrong",
    msg: err.message,
  });
};

const sendErrProd = (err, req, res) => {
  console.log({ err });
  if (req.originalUrl.startsWith("/api")) {
    //Operational error, trusted
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    //Programming error or other unknown error , we don't wanna leak the error details
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong !",
    });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong",
      msg: err.message,
    });
  }
  return res.status(500).render("error", {
    title: "Something went wrong! ",
    msg: "Please try again later.",
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  err.message = err.message;
  if (process.env.NODE_ENV === "development") {
    sendErrDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err, message: err.message };
    if (err.name === "CastError") error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateErrorDB(err);
    if (err.name === "ValidationError") error = handleValidationErrorDB(err);
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrProd(error, req, res);
  }
};
