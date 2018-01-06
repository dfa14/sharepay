const express = require("express");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const nunjucks = require("nunjucks");
const PG = require("pg");
const sha256 = require('js-sha256');

const port = process.env.PORT || 3000;
const users = require("./users");
const event = require("./event.js");
const expense = require("./expense.js");

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

// Initialize Passport and restore authentication state, if any, from the session.
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


/////////////////////////////////////////
// roots for authent & account creation
/////////////////////////////////////////

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

    return users.insertUser(user)
    .then(user=>{

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
  }
);

app.get("/logout", function(request, result) {
  request.logout();
  result.redirect("/");
});



/////////////////////////////////////////
// roots for dashboard of events
/////////////////////////////////////////


app.get(
  '/dashboard',

  function(request, result) {
    const client = new PG.Client();
    client.connect();
    console.log('toto dans le post dashboard1');
    return client.query(
      "SELECT label, statut, date FROM events;"
    )
    .then((dbResult) => {
      console.log(dbResult);
      console.log('toto dans le post dashboard2');
      console.log(dbResult.rows);
    result.render("dashboard", {events:dbResult.rows})
    });
  }
);


/////////////////////////////////////////
// roots for event
/////////////////////////////////////////

app.post(
  "/newevent",
  function(request, result) {
    const idBuddies = request.body.buddies;
    const label = request.body.label
    const activeBuddies = [];
    const newBuddies = [];

    idBuddies.filter(id => {
      console.log("id : ", request.body);
      if (id.lastIndexOf("NEW_") !== -1){
        const id1 = id.slice(4, id.length);
        newBuddies.push(id1);
        return true;
      }

      if (request.body[id] === 'on') {
          activeBuddies.push(id);
          return true;
      }
      else {return false; }});

    return event.insertEvent(label, activeBuddies, newBuddies)
    .then (res => {result.redirect("/dashboard");})
    .catch(error => {
      callback(error);
    });

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

  app.get("/eventdetail", function(request, result){
    result.render("eventdetail")
  });



/////////////////////////////////////////
// roots for expense
/////////////////////////////////////////

app.get("/:eventId/new_expense", function(request, result){

  const eventId = request.params.eventId;
  const user = request.user;

  Promise.all(
      [
        event.selectEvent(eventId),
        users.selectUsers(),
        event.selectEventParticipants(eventId)
      ]
    )
  .then(function(promiseAllResult) {
      console.log(promiseAllResult[2]);

      result.render("new_expense", {
        event : promiseAllResult[0].rows[0],
        users : promiseAllResult[1].rows,
        participants : promiseAllResult[2].rows,
        user:user
      });
    })
  .catch(dbError => {
    result.render("new_expense",{
      user:user,
      error:dbError.stack
    });
  });
});


app.post("/:eventId/new_expense", function (request,result) {
  const eventId = request.params.eventId;
  const label = request.body.label;
  const payer = request.body.payer;
  const amount = (parseInt(request.body.euros,10)*100) + parseInt(request.body.cents,10);
  const user = request.user;

  const expenseToInsert={
    label:label,
    userId:payer,
    eventId:eventId,
    amount:amount
  };

  const participants = request.body.beneficiaries;
  const beneficiaries = participants.filter(id => {
    return (request.body[id] === 'on');
  });

  Promise.all(
      [
        event.selectEvent(eventId),
        expense.insertExpense(expenseToInsert, beneficiaries)
      ]
    )
  .then(function(promiseAllResult) {
      result.redirect(`/:${eventId}`);
    })
  .catch((dbError) => {
    result.render("new_expense",{
      user:user,
      error:dbError.stack
    });
  });
});


app.listen(port, function () {
  console.log("Server listening on port:" + port);
});
