// src/lib/db.js
import postgres from 'postgres';

const sql = postgres({
  host: process.env.DB_HOST,            // Matches DB_HOST in .env
  port: Number(process.env.DB_PORT),    // Matches DB_PORT (usually 6543 or 5432)
  database: process.env.DB_DATABASE,    // Matches DB_DATABASE
  username: process.env.DB_USERNAME,    // Matches DB_USERNAME
  password: process.env.DB_PASSWORD,    // Matches DB_PASSWORD
  
  ssl: 'require',                       // Required for Supabase Cloud connections
  
  // Connection Pooling settings (optional but good for Next.js)
  max: 10,                              // Max number of connections
  idle_timeout: 20,                     // Close idle connections after 20s
});

export default sql;