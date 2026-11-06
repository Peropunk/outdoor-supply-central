import { NextResponse, type NextRequest } from "next/server";
import { runOrderSweep } from "@/lib/fulfillment";

// The daily order job, run by Vercel Cron (vercel.json). Vercel sends
// "Authorization: Bearer <CRON_SECRET>"; anything else is turned away.
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Not allowed", { status: 401 });
  }
  const report = await runOrderSweep();
  console.info(`[order sweep] ${JSON.stringify(report)}`);
  return NextResponse.json(report);
}
