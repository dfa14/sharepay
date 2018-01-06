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
      client.close();
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
      client.close();
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
    client.close();
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
    client.close();
}

function selectEventExpenses(eventId) {
  const client = new PG.Client();
  client.connect();

  return client.query(
    `SELECT e.event_id,
            e.id as expense_id,
            e.label,
            e.amount,
            p.id as payer_id,
            p.pseudo as payer_pseudo
    FROM  expenses e, users p
    WHERE e.event_id=$1
    AND   e.user_id = p.id`,
    [eventId]
  );
}

function selectExpenseBeneficiaries(expenseId) {
  const client = new PG.Client();
  client.connect();
  return client.query(
    `SELECT b.pseudo
    FROM  expense_beneficiaries e, users b
    WHERE e.expense_id=$1
    AND   b.id = e.user_id`,
    [expenseId]
  );
}



module.exports = {
  listBuddies:listBuddies,
  insertEvent:insertEvent,
  insertEventParticipants:insertEventParticipants,
  selectEvent:selectEvent,
  selectEventParticipants:selectEventParticipants,
  selectEventExpenses:selectEventExpenses,
  selectExpenseBeneficiaries:selectExpenseBeneficiaries
};
