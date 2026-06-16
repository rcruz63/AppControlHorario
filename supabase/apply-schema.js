import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supaPass = env.SUPA_PASS;
// Project ID from SUPA_URL or .env
const projectRef = 'xcajtoibfhwwbcqlftnw';

if (!supaPass) {
  console.error('Error: SUPA_PASS not found in .env');
  process.exit(1);
}

const regions = [
  'eu-west-3', // Paris (most likely for Spanish developers)
  'eu-central-1', // Frankfurt
  'eu-west-1', // Ireland
  'eu-west-2', // London
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'sa-east-1',
  'ap-southeast-1',
  'ap-southeast-2'
];

async function tryConnect(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  console.log(`Trying region ${region} (${host})...`);
  const client = new pg.Client({
    host: host,
    port: 6543,
    user: `postgres.${projectRef}`,
    password: supaPass,
    database: `postgres`,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000 // 5 seconds timeout
  });

  try {
    await client.connect();
    console.log(`Successfully connected to region: ${region}`);
    return client;
  } catch (err) {
    console.log(`Failed for region ${region}: ${err.message}`);
    await client.end().catch(() => {});
    return null;
  }
}

async function run() {
  let client = null;
  for (const region of regions) {
    client = await tryConnect(region);
    if (client) break;
  }

  if (!client) {
    console.error('Could not connect to any regional pooler.');
    process.exit(1);
  }

  try {
    console.log('Reading schema.sql...');
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf-8');
    
    console.log('Executing schema.sql...');
    await client.query(sql);
    console.log('Schema applied successfully!');
  } catch (err) {
    console.error('Error executing schema:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
