import { NextResponse } from 'next/server';
import * as jose from 'jose';

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

        // 1. Get Access Token using jose (Edge compatible)
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + 3600;

        const jwt = await new jose.SignJWT({
            iss: clientEmail,
            scope: 'https://www.googleapis.com/auth/indexing',
            aud: 'https://oauth2.googleapis.com/token',
            exp,
            iat,
        })
            .setProtectedHeader({ alg: 'RS256' })
            .sign(await jose.importPKCS8(privateKey, 'RS256'));

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            console.error('Token acquisition failed:', tokenData);
            return NextResponse.json({ error: 'Failed to acquire access token', details: tokenData }, { status: 500 });
        }

        const accessToken = tokenData.access_token;

        // 2. Call Indexing API
        const endpoint = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
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
