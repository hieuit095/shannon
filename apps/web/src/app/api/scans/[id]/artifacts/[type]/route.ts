import { NextResponse } from "next/server";
import fs from "node:fs";
import { getRealArtifacts } from "@/lib/shannon-engine";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const { id, type } = await params;
  const artifacts = getRealArtifacts(id);
  const target = artifacts.find((a) => a.type === type);

  if (!target || !target.available || !fs.existsSync(target.path)) {
    return new NextResponse(`Artifact ${type} not found or not yet generated for scan ${id}`, {
      status: 404,
    });
  }

  const fileBuffer = fs.readFileSync(target.path);

  let contentType = "application/octet-stream";
  if (type === "pdf") contentType = "application/pdf";
  else if (type === "json" || type === "sarif") contentType = "application/json";
  else if (type === "md") contentType = "text/markdown; charset=utf-8";
  else if (type === "log") contentType = "text/plain; charset=utf-8";

  return new Response(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${target.fileName}"`,
      "Content-Length": fileBuffer.length.toString(),
    },
  });
}
