const mongoose = require("mongoose");

const connectionURL = process.env.MONGODB_URL;
const options = {
  useNewUrlParser: true,
};

mongoose.connect(connectionURL, options);
