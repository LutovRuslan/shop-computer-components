//creates paths for the users operating system
const path = require("path");

//server routing framework
const express = require("express");
//parses our req data
const bodyParser = require("body-parser");
//makes mongodb easier to work with
const mongoose = require("mongoose");
//create sessions we can store on the req
const session = require("express-session");
//data base
const MongoDBStore = require("connect-mongodb-session")(session);
//prevents csrf attacks
const csrf = require("csurf");
//creates validation messages that we store on the session
const flash = require("connect-flash");
//parses our multi part image data
const multer = require("multer");
//.env
require("dotenv").config();

//controll errors
const errorController = require("./controllers/error");
//mongo db user model
const User = require("./models/user");

//connection URI
const MONGODB_URI = process.env.MONGODB_URI;

//create our instance
const app = express();
//creates a session collection for the user
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

//use csrf protection
const csrfProtection = csrf();

//stores image data in images folder
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  //gives image a name
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

//filter out any files that arent images
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

//set our view engine to ejs
app.set("view engine", "ejs");
//look for views in views folder
app.set("views", "views");

//route handlers
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

//uses bodyparser to parse req body
app.use(bodyParser.urlencoded({ extended: false }));
//uses multer to parse image data
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
//provide public folder to the browser with any request
app.use(express.static(path.join(__dirname, "public")));
//provide images folder to the browser for any request
app.use("/images", express.static(path.join(__dirname, "images")));
//create user session
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
//use csrf protestion with each req
app.use(csrfProtection);
//use flash for validation messages
app.use(flash());

//stores isLoggedIn result in the res.locals.isAuthenticates
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  //stores csrfToken() in the res.locals.csrfToken
  res.locals.csrfToken = req.csrfToken();
  next();
});

//checks for user session
app.use((req, res, next) => {
  // throw new Error('Sync Dummy');
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

//routes
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

//error routes
app.get("/500", errorController.get500);
app.use(errorController.get404);

//error handler
app.use((error, req, res, next) => {
  // res.status(error.httpStatusCode).render(...);
  // res.redirect('/500');
  console.log(error);
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
});

//connects to mongoose
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    app.listen(4000);
  })
  .catch((err) => {
    console.log(err);
  });
