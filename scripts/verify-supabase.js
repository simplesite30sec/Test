
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load .env.local manually since we are running this script directly with node
const envLocalPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing Supabase connection...');
    console.log(`URL: ${supabaseUrl}`);

    // Try to access a non-existent table just to check connectivity/auth
    // If the key is invalid, it should return 401 or similar.
    // If the key is valid but table doesn't exist, it might returns 404 or 400 or empty data depending on RLS.
    // But a simple health check verifies the client initialization.

    try {
        // Just checking if we can auth (even if anon)
        const { data, error } = await supabase.from('random_table_check').select('*').limit(1);

        // If we get an error like "relation does not exist", that means we successfully connected to the DB
        // If we get "invalid header" or "apikey" error, then auth failed.

        if (error) {
            if (error.code === 'PGRST204' || error.message.includes('relation') || error.message.includes('permission')) {
                console.log('Success: Connected to Supabase (Table check returned expected not found/permission error)');
                console.log('Connection verified!');
            } else {
                console.log('Warning: Connection issue or unexpected error:', error.message);
                // For new project, simple select might verify URL at least.
            }
        } else {
            console.log('Success: Connected to Supabase');
        }

    } catch (e) {
        console.error('Exception:', e);
    }
}

testConnection();
