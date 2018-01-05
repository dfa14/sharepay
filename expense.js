
const PG = require("pg");
const uuidv4 = require("uuid/v4");


function insertExpense(expense, beneficiaries) {
  const client = new PG.Client();
  client.connect();

  const uuid=uuidv4();

  return client.query(
    "INSERT INTO expenses (id, label, user_id, event_id, amount) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
    [uuid, expense.label, expense.userId, expense.eventId, expense.amount]
  )
  .then(dbResult => {
    const expenseId=dbResult.rows[0].id;

    const promises = beneficiaries.map(userId => {
      return client.query(
        "INSERT INTO expense_beneficiaries (expense_id, user_id) VALUES ($1, $2) RETURNING *;",
        [expenseId,userId]
      )
    });

    return Promise.all(promises)
     .then(() => {
       client.end();
       return expenseId;
     });
  });
}

module.exports = {
  insertExpense:insertExpense
};
