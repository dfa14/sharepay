const express = require("express");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const nunjucks = require("nunjucks");
const port = process.env.PORT || 3000;
const event = require("./event.js");

const PG = require("pg");

function findUserByEmail (email) {
    const client = new PG.Client();
    client.connect();
    console.log(email);

    return client.query(
      "SELECT * FROM users WHERE email=$1::text;",
      [email]
      )
      .then(res => {
        console.log(res.rows[0]);
        return res.rows[0];
      })
      .catch(e => console.error(e.stack)
      )
  }

function findUser(email,password) {
  const client = new PG.Client();
  client.connect();
  console.log(email);

  return client.query(
    "SELECT * FROM users WHERE email=$1::text and password=$2::text;",
    [email,password]
    )
    .then(res => {
      console.log(res.rows[0]);

      return new Promise((resolve, reject) => {
        const user=res.rows[0];
        if (user.password === password) {
         resolve(user);
        }
        reject("wrong password");
      })
    })
}





const app = express();

nunjucks.configure("views", {
  autoescape: true,
  express: app
});

app.set("views", __dirname + "/views");
app.set("view engine", "njk");
app.use(express.static("images"));
app.use(express.static("css"));
app.use(require("body-parser").urlencoded({ extended: true }));

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
  return callback(null, user.email); // A checker si changement nécessaire user.email
});

passport.deserializeUser(function(email, callback) {
  return findUserByEmail(email).then(user => {
    callback(null, user)
  });
});

passport.use(
  new LocalStrategy(function(email, password, callback) {
    findUser(email, password)
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

app.get("/", function(request, result){
  result.render(
    "home",
    {title:"Home"}
  );
});

app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/" }),
  function(request, result) {
    console.log("redirect to /profile");
    result.redirect("/newevent");      // à modifier vers le Dashboard de Dom
  }
);

app.get(
  "/profile",
  require("connect-ensure-login").ensureLoggedIn("/"),
  function(request, result) {
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
