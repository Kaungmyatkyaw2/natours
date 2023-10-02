class APIFeatures {
    constructor(query, queryString) {
      this.query = query;
      this.queryString = queryString;
    }
  
    filter() {
      const queryObj = { ...this.queryString };
      const exclueFields = ['page', 'sort', 'limit', 'fields'];
  
      exclueFields.forEach((el) => delete queryObj[el]);
  
      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(
        /\b(lte|lt|gte|gt)\b/g,
        (matched) => '$' + matched
      );
  
      this.query.find(JSON.parse(queryStr));
  
      return this;
    }
  
    sort() {
      if (this.queryString.sort) {
        const sortBy = this.queryString.sort.replace(/,/g, ' ');
        this.query.sort(sortBy);
      } else {
        this.query.sort('_id');
      }
  
      return this;
    }
  
    limitFields() {
      if (this.queryString.fields) {
        const fields = this.queryString.fields.replace(/,/g, ' ');
        this.query.select(fields);
      } else {
        this.query.select('-__v');
      }
  
      return this;
    }
  
    paginate() {
      const page = +this.queryString.page || 1;
      const limit = +this.queryString.limit || 100;
      const skip = (page - 1) * limit;
  
      this.query.skip(skip).limit(limit);
  
      return this;
  
      // if (this.queryString.page) {
      //   const tourNum = Tour.countDocuments();
      //   if (skip >= tourNum) {
      //     throw new Error("This page doesn't exist");
      //   }
      // }
    }
  }

  module.exports = APIFeatures;