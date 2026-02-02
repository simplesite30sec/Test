import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
        return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Basic validation
    if (!/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domain)) {
        return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }

    try {
        // Use Cloudflare DNS-over-HTTPS to check existence
        const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
            headers: { 'accept': 'application/dns-json' }
        });

        const data = await res.json();

        // Status 0 (NOERROR) means domain exists (usually). 
        // Status 3 (NXDOMAIN) means domain does not exist -> AVAILABLE.
        // However, we should also check NS just in case.

        let available = false;

        if (data.Status === 3) { // NXDOMAIN
            available = true;
        }

        return NextResponse.json({
            domain,
            available,
            status: data.Status
        });

    } catch (error) {
        console.error('DNS check failed:', error);
        return NextResponse.json({ error: 'Check failed' }, { status: 500 });
    }
}
