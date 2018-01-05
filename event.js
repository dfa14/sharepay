const PG = require("pg");
const uuidv4 = require("uuid/v4");

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

  function insertEvent(label, buddies, newbuddies) {
    const uuid=uuidv4();
    const client = new PG.Client();
    client.connect();

    newbuddies.forEach(function(element) {
        const idUser = uuidv4();

        return client.query(
          "INSERT INTO users (id, email, pseudo, password) VALUES ($1, $2, $3, $4);",
          [idUser, '', element,''])
          .then (result => {
            buddies.push(idUser);
            return result;
          })
          .catch(e => {
          console.warn(e.stack);
          return e.stack;
          })
      }
    )


    return client.query(
      "INSERT INTO events (id, label, statut) VALUES ($1, $2, $3);",
      [uuid, label, 'OPEN']
    )
      .then(res => {
        //console.log("pseudo 1:", res.rows);
        return res;
      })
      .then(result => {
        buddies.forEach(function(element) {
          insertEventParticipants(uuid,element)});
      })
      .catch(e => {
        console.warn(e.stack);
        return e.stack;
      }
      )

  }

function insertEventParticipants(uuid,idbuddie) {
  const client = new PG.Client();
  client.connect();

  return client.query(
    "INSERT INTO event_participants (event_id, user_id) VALUES ($1, $2);",
    [uuid, idbuddie]
  )
    .then(res => {
      //console.log("pseudo 1:", res.rows);
      return res;
    })
    .catch(e => {
      console.warn(e.stack);
      return e.stack;
    }
    )
}


function selectEvent(eventId) {
  const client = new PG.Client();
  client.connect();

  return client.query(
    "SELECT * FROM events WHERE id=$1",
    [eventId]
  )
}

function selectEventParticipants(eventId) {
  const client = new PG.Client();
  client.connect();

  return client.query(
    `SELECT u.*
    FROM event_participants p, users u
    WHERE event_id=$1
    AND p.user_id = u.id `,
    [eventId]
  )
}


function selectEventExpenses(eventId) {
  const client = new PG.Client();
  client.connect();

  return client.query(
    `SELECT u.*
    FROM expenses e, expense_beneficiaries b
    WHERE e.event_id=$1
    AND   b.expense_id = e.id `,
    [eventId]
  )
}


  module.exports = {
    listBuddies:listBuddies,
    insertEvent:insertEvent,
    insertEventParticipants:insertEventParticipants,
    selectEvent:selectEvent,
    selectEventParticipants:selectEventParticipants,
    selectEventExpenses:selectEventExpenses
  };
