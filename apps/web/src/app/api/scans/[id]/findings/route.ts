import { NextResponse } from "next/server";
import { getRealFindings } from "@/lib/shannon-engine";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const findings = getRealFindings(id);
  return NextResponse.json({ findings });
}
