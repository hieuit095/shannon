import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getRealArtifacts } from "@/lib/shannon-engine";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const downloadType = url.searchParams.get("download");

  const artifacts = getRealArtifacts(id);

  if (downloadType) {
    const matched = artifacts.find(
      (a) => a.type.toLowerCase() === downloadType.toLowerCase() && a.available
    );

    if (!matched || !fs.existsSync(matched.path)) {
      return NextResponse.json(
        { error: `Artifact of type '${downloadType}' is not available for workspace '${id}'` },
        { status: 404 }
      );
    }

    try {
      const fileBuffer = fs.readFileSync(matched.path);
      const fileName = path.basename(matched.path);

      let contentType = "application/octet-stream";
      if (matched.type === "pdf") contentType = "application/pdf";
      else if (matched.type === "sarif" || matched.type === "json") contentType = "application/json";
      else if (matched.type === "md") contentType = "text/markdown; charset=utf-8";
      else if (matched.type === "log") contentType = "text/plain; charset=utf-8";

      return new Response(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Length": fileBuffer.length.toString(),
        },
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: `Failed to stream artifact: ${err.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ artifacts });
}
