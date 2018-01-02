const express = require("express");
const nunjucks = require("nunjucks");
const port = process.env.PORT || 3000;

const app = express();

nunjucks.configure("views", {
  autoescape: true,
  express: app
});

app.set("views", "./views");
app.set("view engine", "njk");
app.use(express.static("images"));
app.use(express.static("css"));

app.use(require("body-parser").urlencoded({ extended: true }));

app.get("/", function(request, result){
  result.send(`
    <form method="POST" action="/treatform">
      <input type="text" name="pseudo" id="pseudoATraiter" maxlength="10"/>
      <input type="password" />
      <button type="submit">
      login
      </button>
    </form>`
  );
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
