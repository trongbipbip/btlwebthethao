const mysql = require('mysql2'); // 

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'trong091204',
  database: 'nodejs'
});

module.exports = connection; 