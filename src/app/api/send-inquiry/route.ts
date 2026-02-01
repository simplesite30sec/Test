import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const { siteId, name, contact, message, senderEmail } = await request.json();

        // Validate required fields
        if (!siteId || !name || !contact || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Initialize Supabase client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch site and addon config
        const { data: addon } = await supabase
            .from('site_addons')
            .select('config, sites(name)')
            .eq('site_id', siteId)
            .eq('addon_type', 'inquiry')
            .eq('is_active', true)
            .single();

        if (!addon || !addon.config?.notificationEmail) {
            // No notification email configured, skip email sending
            return NextResponse.json({
                success: true,
                message: 'No notification email configured'
            });
        }

        const siteName = (addon.sites as any)?.name || 'Unknown Site';
        const notificationEmail = addon.config.notificationEmail;

        // Send email via Resend
        const { data, error } = await resend.emails.send({
            from: 'SimpleSite <onboarding@resend.dev>',
            to: notificationEmail,
            subject: `[${siteName}] 새로운 문의가 도착했습니다`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
                        새로운 문의
                    </h2>
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 10px 0;"><strong>이름:</strong> ${name}</p>
                        <p style="margin: 10px 0;"><strong>연락처:</strong> ${contact}</p>
                        ${senderEmail ? `<p style="margin: 10px 0;"><strong>이메일:</strong> ${senderEmail}</p>` : ''}
                    </div>
                    <div style="margin: 20px 0;">
                        <h3 style="color: #374151;">문의 내용</h3>
                        <p style="background-color: #ffffff; padding: 15px; border-left: 4px solid #3b82f6; white-space: pre-wrap;">
                            ${message}
                        </p>
                    </div>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                    <p style="color: #6b7280; font-size: 12px; text-align: center;">
                        이 메일은 SimpleSite를 통해 자동으로 발송되었습니다.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json(
                { error: 'Failed to send email', details: error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            emailId: data?.id
        });

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
