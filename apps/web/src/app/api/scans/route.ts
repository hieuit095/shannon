import { NextResponse } from "next/server";
import { listScans, launchScan, buildConfigYaml, getScanStatus } from "@/lib/shannon-engine";

export async function GET() {
  try {
    const scans = listScans();
    // Check if any scan is running
    const running = scans.find((s) => s.state === "running");
    let activeStatus = null;
    if (running) {
      activeStatus = getScanStatus(running.workspace);
    } else if (scans.length > 0) {
      activeStatus = getScanStatus(scans[0].workspace);
    }

    return NextResponse.json({
      scans,
      active: activeStatus,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to query scans" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      url, 
      repoPath, 
      workspace, 
      loginType, 
      loginUrl, 
      username, 
      password, 
      totpSecret, 
      successConditionType, 
      successConditionValue, 
      rulesAvoid, 
      rulesFocus, 
      agenticSast, 
      exploitMode, 
      modelSpec, 
      customBaseUrl 
    } = body;

    if (!url) {
      return NextResponse.json({ error: "Missing required parameter: url" }, { status: 400 });
    }

    // Default repoPath to current repository if not specified
    const targetRepo = repoPath && repoPath.trim().length > 0 ? repoPath.trim() : process.cwd();

    const configYaml = buildConfigYaml({
      loginType,
      loginUrl,
      username,
      password,
      totpSecret,
      successConditionType,
      successConditionValue,
      rulesAvoid,
      rulesFocus,
      agenticSast,
      exploitMode,
    });

    const result = launchScan({
      url,
      repoPath: targetRepo,
      workspaceName: workspace,
      configYaml,
      modelSpec,
      customBaseUrl,
      agenticSast,
      exploitMode,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to start scan" }, { status: 500 });
  }
}
