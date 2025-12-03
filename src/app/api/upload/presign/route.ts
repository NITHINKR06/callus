import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/env";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Missing filename or contentType" },
        { status: 400 },
      );
    }

    // Validate content type
    if (!contentType.startsWith("video/")) {
      return NextResponse.json(
        { error: "Invalid content type. Must be video/*" },
        { status: 400 },
      );
    }

    // Fallback: if no AWS env set, return local instructions
    if (!env.S3_BUCKET || !env.AWS_ACCESS_KEY_ID) {
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filenameWithTimestamp = `${Date.now()}-${sanitizedFilename}`;
      const key = `uploads/${filenameWithTimestamp}`;
      return NextResponse.json({
        presignedUrl: null,
        finalUrl: `/uploads/${filenameWithTimestamp}`,
        local: true,
        key,
      });
    }

    // S3 presigned URL
    if (!env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS_SECRET_ACCESS_KEY is required for S3 uploads");
    }

    const s3 = new S3Client({
      region: env.AWS_REGION ?? "us-east-1",
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `videos/${Date.now()}-${sanitizedFilename}`;

    const cmd = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
      ACL: "public-read",
    });

    const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
    const finalUrl = `https://${env.S3_BUCKET}.s3.${env.AWS_REGION ?? "us-east-1"}.amazonaws.com/${key}`;

    return NextResponse.json({
      presignedUrl: url,
      finalUrl,
      local: false,
      key,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 },
    );
  }
}

