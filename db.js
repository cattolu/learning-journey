require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'learning_journey',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  dateStrings: true,

  ssl: process.env.DB_HOST?.includes('aivencloud.com')
    ? { rejectUnauthorized: false }
    : undefined
});

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}
async function one(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}
async function exec(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}
async function test() { await query('SELECT 1 AS ok'); }
module.exports = { pool, query, one, exec, test };
