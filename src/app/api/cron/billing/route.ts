import { NextRequest, NextResponse } from "next/server";
import { runBilling } from "@/lib/billing";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runBilling();
  return NextResponse.json(result);
}
