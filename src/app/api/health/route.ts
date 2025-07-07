import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Basic health check
    const healthCheck = {
      uptime: process.uptime(),
      message: "OK",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "unknown",
    };

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    const healthCheck = {
      message: "Service Unavailable",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };

    return NextResponse.json(healthCheck, { status: 503 });
  }
}
