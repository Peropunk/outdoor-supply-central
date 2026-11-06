import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { applyTracking, type TrackingStatus } from "@/lib/fulfillment";

// Shippo calls this with USPS tracking updates for labels bought through it.
// Shippo doesn't sign its webhooks, so the URL carries a secret token
// (?token=SHIPPO_WEBHOOK_SECRET) that's set when the webhook is added in Shippo.

const STATUSES = new Set<TrackingStatus>(["UNKNOWN", "PRE_TRANSIT", "TRANSIT", "DELIVERED", "RETURNED", "FAILURE"]);

function tokenMatches(given: string | null) {
  const secret = process.env.SHIPPO_WEBHOOK_SECRET;
  if (!secret || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!tokenMatches(request.nextUrl.searchParams.get("token"))) {
    return new NextResponse("Not allowed", { status: 401 });
  }

  let body: {
    event?: string;
    data?: { tracking_number?: string; tracking_status?: { status?: string; status_date?: string } };
  };
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  const number = body.data?.tracking_number;
  const status = body.data?.tracking_status?.status as TrackingStatus | undefined;
  if (body.event !== "track_updated" || !number || !status || !STATUSES.has(status)) {
    return NextResponse.json({ received: true });
  }
  const when = body.data?.tracking_status?.status_date;
  const at = when && !Number.isNaN(Date.parse(when)) ? new Date(when) : new Date();
  const known = await applyTracking(number, status, at);
  return NextResponse.json({ received: true, matched: known });
}
