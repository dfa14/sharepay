
const PG = require("pg");
const sha256 = require('js-sha256');
const uuidv4 = require("uuid/v4");



function findUserByEmail(email) {
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

  const cryptPassword=sha256(password);
  const client = new PG.Client();
  client.connect();


  return client.query(
    "SELECT * FROM users WHERE email=$1::text and password=$2::text;",
    [email,cryptPassword]
    )
    .then(res => {

      return new Promise((resolve, reject) => {

        if (res.rowCount===0) {
          //email+password not found in database
          reject("User unknown");

        } else if (res.rowCount===1) {
          //email+password found in database
         const user=res.rows[0];
         resolve(user);
        }
        //for any other case, return error
        reject("Error with connection");
      })
    })
}

function insertUser(user) {
  const client = new PG.Client();
  client.connect();

  const uuid=uuidv4();

  return client.query(
    "INSERT INTO users (id, email, password, pseudo) VALUES ($1, $2, $3, $4);",
    [uuid, user.email, user.password, user.pseudo]
  )
  .then((dbResult) => {
    return user;
  })
  .catch(error => {
    console.warn(error);
  });
}

function selectUsers() {

  const client = new PG.Client();
  client.connect();

  return client.query("SELECT * FROM users;")
}

module.exports = {
  findUserByEmail:findUserByEmail,
  findUser:findUser,
  selectUsers:selectUsers,
  insertUser:insertUser
};
