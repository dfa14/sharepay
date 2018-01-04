
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

        if (res.rowCount===0) {
          //email+password not found in database
          reject("User unknown" + res.rowCount);

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

module.exports = {
  findUserByEmail:findUserByEmail,
  findUser:findUser
};
