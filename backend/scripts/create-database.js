#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbName = process.env.DB_NAME || 'portfolio_analytics';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT) || 5432;

async function createDatabase() {
  // Connect to PostgreSQL's default 'postgres' database to create our database
  const adminClient = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await adminClient.connect();
    console.log('Connected to PostgreSQL');

    // Check if database already exists
    const checkResult = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkResult.rows.length > 0) {
      console.log(`Database "${dbName}" already exists.`);
      await adminClient.end();
      return;
    }

    // Create the database
    console.log(`Creating database "${dbName}"...`);
    await adminClient.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database "${dbName}" created successfully!`);

    await adminClient.end();

    // Test connection to the new database
    console.log(`\nTesting connection to "${dbName}"...`);
    const testClient = new Client({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
    });

    await testClient.connect();
    const result = await testClient.query('SELECT NOW()');
    console.log('Connection test successful:', result.rows[0].now);
    await testClient.end();

    console.log('\nDatabase setup complete! You can now run your application.');
  } catch (error) {
    console.error('Error creating database:', error.message);
    
    if (error.code === '3D000') {
      console.error('Make sure PostgreSQL is running and accessible.');
    } else if (error.code === '28P01') {
      console.error('Authentication failed. Check your DB_USER and DB_PASSWORD in .env file.');
    } else {
      console.error('Error details:', error);
    }
    
    process.exit(1);
  }
}

createDatabase();


