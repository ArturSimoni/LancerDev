const path = require('path');
const fs = require('fs/promises');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const sqlFile = path.resolve(__dirname, '../db/init.sql');
  const sql = await fs.readFile(sqlFile, 'utf8');

  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    console.log('Conectando ao banco de dados...');
    await pool.query(sql);
    console.log('Esquema do banco criado com sucesso.');
  } catch (error) {
    console.error('Erro ao criar o banco de dados:', error.message);
  } finally {
    await pool.end();
  }
}

run();
