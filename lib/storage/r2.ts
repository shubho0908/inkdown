import "server-only";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.",
    );
  }

  return { accountId, accessKeyId, secretAccessKey, bucket };
}

let r2Client: S3Client | null = null;

function getR2Client() {
  if (r2Client) return r2Client;

  const { accountId, accessKeyId, secretAccessKey } = getR2Config();

  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return r2Client;
}

export function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME,
  );
}

export function buildFileContentKey(userId: string, fileId: string) {
  return `users/${userId}/files/${fileId}.md`;
}

export async function getObjectText(key: string): Promise<string | null> {
  const { bucket } = getR2Config();
  const client = getR2Client();

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    if (!response.Body) {
      return null;
    }

    return await response.Body.transformToString("utf-8");
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") {
      return null;
    }

    throw error;
  }
}

export async function putObjectText(key: string, content: string) {
  const { bucket } = getR2Config();
  const client = getR2Client();
  const body = Buffer.from(content, "utf-8");

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "text/markdown; charset=utf-8",
      ContentLength: body.byteLength,
    }),
  );

  return body.byteLength;
}
