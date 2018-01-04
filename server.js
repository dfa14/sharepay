const express = require("express");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const nunjucks = require("nunjucks");
const event = require("./event.js");
const PG = require("pg");
const uuidv4 = require("uuid/v4");
const sha256 = require('js-sha256');

const port = process.env.PORT || 3000;
const users = require("./users");
const tempevents = [{ title: "event 1", status : "active"}, { title: "event 2", status : "active"}];
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
  console.log("serializeUser:");
  console.log(user);
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

app.post(
  '/',
  function(request, result, callback) {
    passport.authenticate(
      'local',
      function(error, user, info) {
        if (error) {
          result.render(
            "home",
            {error:error}
          );
        }
        else {
          request.logIn(user, function(error) {
            if (error) {
              return callback(error);
            }
            console.log(user);
            return result.redirect("/dashboard");
          });
        }
      }
    )(request, result, callback);
  }
);

app.get(
  "/new_account",
  function(request, result) {
    result.render("new_account");
  }
);

app.post(
  '/new_account',

  function(request, result) {

    const user = {
      email:request.body.username,
      password:sha256(request.body.password),
      pseudo:request.body.pseudo
    };

    if (user.email==="") {
      return result.render("new_account",{error:"Missing email",user:user});
    }
    if (user.password==="") {
      return result.render("new_account",{error:"Missing password",user:user});
    }
    if (user.pseudo==="") {
      return result.render("new_account",{error:"Missing pseudo",user:user});
    }

    const client = new PG.Client();
    client.connect();

    const uuid=uuidv4();

    return client.query(
      "INSERT INTO users (id, email, password, pseudo) VALUES ($1, $2, $3, $4);",
      [uuid, user.email, user.password, user.pseudo]
    )
    .then((dbResult) => {
      console.log(user);

      const dbUser={
        email:user.email,
        password:user.password
      };

      request.logIn(dbUser, function(error) {
        if (error) {
          console.log(error);
          result.render("new_account",{error:error, user:user});
        }
        result.render("new_account",{message:`Welcome on Sharepay ${user.pseudo} !`, user:user});
      });
    })

    .catch(error => {
      console.warn(error);
    });
  }
);

app.get("/dashboard", function(request, result){
  result.render("dashboard", {tempevents:tempevents})
});


app.get("/logout", function(request, result) {
  request.logout();
  result.redirect("/");
});

app.post(
  "/newevent",
  function(request, result) {
    const id_buddies = request.body.buddies;
    const active_buddies = [];

    id_buddies.filter(id => {
      if (request.body[id] === 'on') {
          active_buddies.push(id);
          return true;
      } else {return false; }});

    console.log(active_buddies);
  }
);

app.get("/newevent", function(request, result) {
        event.listBuddies()
        .then (buddies=>{
          return result.render("newevent", {
            buddies : buddies
          });
        })
        .catch(error => {
          callback(error);
        });

  });



app.listen(port, function () {
  console.log("Server listening on port:" + port);
});
