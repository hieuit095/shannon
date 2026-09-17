import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/shannon-engine";

export async function GET() {
  try {
    const health = getSystemHealth();
    return NextResponse.json(health);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to inspect system health" },
      { status: 500 }
    );
  }
}
