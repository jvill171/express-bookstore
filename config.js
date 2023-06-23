/** Common config for bookstore. */

const PG_PWD = require("./.env")
require("dotenv").config();
process.env.PGPASSWORD = PG_PWD;


let DB_URI = `postgresql://`;

if (process.env.NODE_ENV === "test") {
  DB_URI = `${DB_URI}/books-test`;
} else {
  DB_URI = process.env.DATABASE_URL || `${DB_URI}/books`;
}


module.exports = { DB_URI };