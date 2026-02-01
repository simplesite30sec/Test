
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local because dotenv might not be installed in the root or devDependencies
const envLocalPath = path.resolve(__dirname, '../.env.local');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
            supabaseUrl = line.split('=')[1].trim();
        }
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
            supabaseKey = line.split('=')[1].trim();
        }
    }
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase environment variables in .env.local');
    console.error('Found URL:', supabaseUrl);
    console.error('Found Key:', supabaseKey ? 'Yes (Hidden)' : 'No');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing Supabase connection...');
    console.log(`URL: ${supabaseUrl}`);

    try {
        const { data, error } = await supabase.from('random_table_check').select('*').limit(1);

        if (error) {
            // If we get an error about table not found, it implies we connected successfully
            // code 42P01 is undefined_table in Postgres, often Supabase returns 404 or specific error message JSON
            // We can also assume that if it's NOT a connection/url error, it's good.
            if (error.code === 'PGRST204' || error.message.includes('relation') || error.message.includes('permission')) {
                console.log('Success: Connected to Supabase (Table check returned expected not found/permission error)');
            } else {
                console.log('Warning: Connection response received but errored:', error.message);
                // It's still a "success" in terms of reaching the server
                if (error.code) console.log('Error Code:', error.code);
            }
        } else {
            console.log('Success: Connected to Supabase');
        }

    } catch (e) {
        console.error('Exception:', e);
    }
}

testConnection();
