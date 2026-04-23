import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import prisma from "@/lib/prisma";
import { getActorUserId } from "@/lib/session-user";

/**
 * Download an uploaded job document (any signed-in yard identity may fetch).
 */
export async function GET(_, props) {
  try {
    const actorId = await getActorUserId();
    if (!actorId) {
      return NextResponse.json({ error: "Select yard identity to download files." }, { status: 401 });
    }

    const params = await props.params;
    const jobId = parseInt(params.jobId, 10);
    const documentId = parseInt(params.documentId, 10);
    if (!Number.isFinite(jobId) || !Number.isFinite(documentId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const doc = await prisma.jobDocument.findFirst({
      where: { id: documentId, jobId },
    });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const buf = Buffer.from(doc.dataBase64, "base64");
    const filename = encodeURIComponent(doc.fileName).replace(/['()*]/g, (c) =>
      "%" + c.charCodeAt(0).toString(16).toUpperCase(),
    );

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Length": String(buf.length),
        "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
