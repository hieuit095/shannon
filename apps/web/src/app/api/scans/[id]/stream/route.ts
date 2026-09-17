import fs from "node:fs";
import path from "node:path";
import { getScanStatus } from "@/lib/shannon-engine";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
const WORKSPACES_DIR = path.join(REPO_ROOT, "workspaces");

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const logPath = path.join(WORKSPACES_DIR, id, ".shannon", "workflow.log");

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 1. Send live status if available
      const status = getScanStatus(id);
      if (status) {
        controller.enqueue(encoder.encode(`event: status\ndata: ${JSON.stringify(status)}\n\n`));
      }

      // 2. Stream existing log lines from real workflow.log
      if (fs.existsSync(logPath)) {
        try {
          const content = fs.readFileSync(logPath, "utf8");
          const lines = content.split("\n").filter((l) => l.trim().length > 0);
          for (const line of lines.slice(-50)) {
            const payload = JSON.stringify({
              timestamp: new Date().toISOString(),
              line,
            });
            controller.enqueue(encoder.encode(`event: log\ndata: ${payload}\n\n`));
          }
        } catch (err) {
          console.error("Error reading log file:", err);
        }
      } else {
        const payload = JSON.stringify({
          timestamp: new Date().toISOString(),
          line: `[STREAM] Initializing connection to workspace ${id}. Waiting for worker logs...`,
        });
        controller.enqueue(encoder.encode(`event: log\ndata: ${payload}\n\n`));
      }

      // 3. Heartbeat keeping the connection alive
      const interval = setInterval(() => {
        try {
          const currentStatus = getScanStatus(id);
          if (currentStatus) {
            controller.enqueue(encoder.encode(`event: status\ndata: ${JSON.stringify(currentStatus)}\n\n`));
          }
        } catch {}
      }, 3000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
