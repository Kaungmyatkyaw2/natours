const crypto = require("crypto");
const mongoose = require("mongoose");
const { default: validator } = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    trim: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: "Please provie a valid email",
    },
  },

  photo: {
    type: String,
    default: "default.jpg",
  },
  role: {
    type: String,
    enum: {
      values: ["user", "admin", "guide", "lead-guide"],
      message: "Role is either : user,admin,guide,lead-guide",
    },
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    trim: true,
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your passwor"],
    trim: true,
    validate: {
      //this only works on save or create method
      validator: function (val) {
        return this.password == val;
      },
      message: "Confirm password need to match with password",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew) {
    return next();
  }

  this.passwordChangedAt = Date.now() - 1000;
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare("" + candidatePassword, userPassword);
};

userSchema.methods.changesPasswordAfter = function (JWTtimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = this.passwordChangedAt.getTime();
    const JWTtimestampInMilisecond = JWTtimestamp * 1000;

    return changedTimeStamp > JWTtimestampInMilisecond;
  }

  // False mean not change

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
