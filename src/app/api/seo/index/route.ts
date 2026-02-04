import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { url, type = 'URL_UPDATED' } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Check for environment variables
        const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!clientEmail || !privateKey) {
            console.error('Missing Google Indexing API credentials');
            return NextResponse.json({ error: 'Indexing API credentials not configured' }, { status: 500 });
        }

        const jwtClient = new google.auth.JWT({
            email: clientEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/indexing']
        });

        await jwtClient.authorize();

        const endpoint = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtClient.credentials.access_token}`
            },
            body: JSON.stringify({
                url: url,
                type: type
            })
        });

        const data = await response.json();

        return NextResponse.json({ success: true, data });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Indexing error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
