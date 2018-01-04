const express = require("express");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const nunjucks = require("nunjucks");
const PG = require("pg");
const port = process.env.PORT || 3000;

const users = require("./users");


//to setup web server with express
const app = express();

//for nunjucks to work
nunjucks.configure("views", {
  autoescape: true,
  express: app
});
app.set("views", __dirname + "/views");
app.set("view engine", "njk");

//to set default root for images and css
app.use(express.static("images"));
app.use(express.static("css"));

//for forms to work
app.use(require("body-parser").urlencoded({ extended: true }));

//for passport to work
app.use(require("cookie-parser")());
app.use(
  require("express-session")({
    secret: "sidjsidkop&é++",
    resave: false,
    saveUninitialized: false
  })
);

// Initialize Passport and restore authentication state,
// if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, callback) {
  return callback(null, user.email);
});

passport.deserializeUser(function(email, callback) {
  return users.findUserByEmail(email).then(user => {
    callback(null, user)
  });
});

passport.use(
  new LocalStrategy(function(email, password, callback) {
    users.findUser(email, password)
      .then(user => {
        console.log("user found :", user);
        callback(null, user);
      })
      .catch(error => {
        console.log("user not found :", error);
        callback(error);
      });
  })
);



//beginning of root definition

app.get("/", function(request, result){
  result.render(
    "home"
  );
});




// app.post(
//   "/",
//   passport.authenticate("local", { failureRedirect: "/" }),
//   function(request, result) {
//     console.log("redirect to /profile");
//     result.redirect("/profile");
//   }
// );

app.post("/", passport.authenticate("local",
  { successRedirect: "/profile",
    failureRedirect: "/",
    failureFlash: true }
  ));


// app.post(
//   '/',
//   function(request, result, callback) {
//     passport.authenticate(
//       'local',
//       function(error, user, info) {
//         if (error) { return callback(error); }
//         if (!user) { return result.redirect('/'); }
//
//         request.logIn(user, function(error) {
//           if (error) {
//             return callback(error);
//           }
//           return result.redirect('/users/' + user.displayName);
//         });
//       }
//     )(request, result, callback);
//   }
// );






app.get(
  "/profile",
  require("connect-ensure-login").ensureLoggedIn("/"),
  function(request, result) {
    console.log("toto", request.user)
    result.render("profile", {
      id: request.user.id,
      name: request.user.displayName,
      email: request.user.email
    });
  }
);

app.get("/logout", function(request, result) {
  request.logout();
  result.redirect("/");
});



app.post(
  "/save-expense",
  function(request, result) {
    // request.body contains an object with our named fields
  }
);

app.listen(port, function () {
  console.log("Server listening on port:" + port);
});
