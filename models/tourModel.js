const mongoose = require("mongoose");
const { default: slugify } = require("slugify");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "A tour name must have less or equal then 40 characters"],
      minlength: [10, "A tour name must have more or equal then 10 characters"],
      // validate : [validator.isAlpha,"Tour must have only characters"]
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },

    slug: {
      type: String,
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },

    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either : easy,medium,difficult",
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must have minium value 1"],
      max: [5, "Rating must have maximum value 5"],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: "{VALUE} must be lower than the price",
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, "A tour must have a description"],
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });

tourSchema.virtual("durationWeeks").get(function () {
  return +(this.duration / 7);
});

tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

//Document Middleware
tourSchema.pre("save", function () {
  this.slug = slugify(this.name, { lower: true });
});

// tourSchema.pre('save', async function () {
//   const guidesPromise = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
// });

//Query Middleware
tourSchema.pre(/^find/, function () {
  this.find({ secretTour: { $ne: true } });
  this.startTime = Date.now();
});

tourSchema.pre(/^find/, function () {
  this.populate({
    path: "guides",
    select: "-__v",
  });
});

//Aggregation Middleware
// tourSchema.pre('aggregate', function () {
//   this.pipeline().unshift({
//     $match: {
//       secretTour: { $ne: true },
//     },
//   });
// });
//
// tourSchema.pre('findOne', function () {
//   this.find({ secretTour: { $ne: true } });
// });

// tourSchema.post('save', function () {
//   console.log('I am post');
// });

// tourSchema.pre('save', function () {
//   this.name = this.name + ' ' + this.duration;
//   console.log('I am 1');
// });

//Compound Index

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;

// I started learning node js on july 21
