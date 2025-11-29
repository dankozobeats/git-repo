import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        VAPID_PUBLIC_KEY: !!process.env.VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        CRON_SECRET: !!process.env.CRON_SECRET,
    });
}
