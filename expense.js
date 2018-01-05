
const PG = require("pg");
const uuidv4 = require("uuid/v4");


function insertExpense(expense) {
  const client = new PG.Client();
  client.connect();

  const uuid=uuidv4();

  return client.query(
    "INSERT INTO expenses (id, label, user_id, event_id, amount) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
    [uuid, expense.label, expense.userId, expense.eventId, expense.amount]
  )
}

function insertBeneficiaries(expenseId, userId) {
  const client = new PG.Client();
  client.connect();
  return client.query(
    "INSERT INTO expense_beneficiaries (expense_id, user_id) VALUES ($1, $2) RETURNING *;",
    [expenseId,userId]
  )
}

module.exports = {
  insertExpense:insertExpense,
  insertBeneficiaries:insertBeneficiaries
};
