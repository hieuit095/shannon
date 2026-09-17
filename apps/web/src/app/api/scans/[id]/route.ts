import { NextResponse } from "next/server";
import { getScanStatus, stopScan } from "@/lib/shannon-engine";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const status = getScanStatus(id);
  if (!status) {
    return NextResponse.json({ error: `Scan ${id} not found or has no active state` }, { status: 404 });
  }
  return NextResponse.json(status);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = stopScan(id);
  return NextResponse.json({
    success,
    workspace: id,
    message: success ? `Scan ${id} stopped` : `Failed to stop scan ${id}`,
  });
}
