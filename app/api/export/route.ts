import type { NextRequest } from "next/server";
import type { Slide } from "@/app/types/types";

type ExportPayload = {
  version: number;
  slideSize: { width: number; height: number };
  slides: Slide[];
  exportedAt: string;
};

export async function POST(request: NextRequest) {
  let payload: ExportPayload;
  try {
    payload = (await request.json()) as ExportPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload || !Array.isArray(payload.slides)) {
    return Response.json({ error: "Missing slides[]" }, { status: 400 });
  }

  console.log("[export] received schema", {
    version: payload.version,
    slides: payload.slides.length,
    shapes: payload.slides.reduce((n, s) => n + s.shapes.length, 0),
    exportedAt: payload.exportedAt,
  });

  return Response.json({
    ok: true,
    receivedSlides: payload.slides.length,
  });
}
