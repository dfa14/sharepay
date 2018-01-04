const PG = require("pg");

function listBuddies() {
    const client = new PG.Client();
    client.connect();

    return client.query(
      `SELECT * FROM users`,
      []
    )
      .then(res => {
        //console.log("pseudo 1:", res.rows);
        return res.rows;
      })
      .catch(e => console.error(e.stack)
      )
  }

  function insertBuddies() {

  }


  module.exports = {
    listBuddies:listBuddies
  };
