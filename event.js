const PG = require("pg");
const uuidv4 = require("uuid/v4");


function listBuddies() {
  const client = new PG.Client();
  client.connect();

  return client.query(
    `SELECT * FROM users`,
    []
  )
    .then(dbResult => {
      const buddies = dbResult.rows;
      client.end();
      return buddies;
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
        .then (dbResult => {
          buddies.push(idUser);
          return dbResult;
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
    .then(dbResult => {
      buddies.forEach(function(element) {
        return insertEventParticipants(uuid,element);
      })
      .then( () => {
        client.end();
      })
    })
    .catch(e => {
      console.warn(e.stack);
      return e.stack;
    })
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
      client.end();
      return res;
    })
    .catch(e => {
      console.warn(e.stack);
      return e.stack;
    })
}


function selectEvent(eventId) {
  const client = new PG.Client();
  client.connect();

  return client.query(
    "SELECT * FROM events WHERE id=$1",
    [eventId]
  )
  .then(dbResult => {
    const res = dbResult;
    client.end();
    return res;
  })
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
    .then(dbResult => {
      const res = dbResult;
      client.end();
      return res;
    });
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
  )
  .then(dbResult => {
    const res = dbResult;
    client.end();
    return res;
  });

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
  )
  .then(dbResult => {
    const res = dbResult;
    client.end();
    return res;
  });

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
