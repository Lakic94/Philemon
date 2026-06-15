import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env.js";

const s3 = new S3Client({
  endpoint: env.s3.endpoint,
  region: env.s3.region,
  credentials: { accessKeyId: env.s3.accessKey, secretAccessKey: env.s3.secretKey },
  forcePathStyle: true, // required for MinIO
});

/** Presigned PUT URL the browser uploads the file to directly. */
export async function presignUpload(key: string, contentType: string): Promise<string> {
  const cmd = new PutObjectCommand({ Bucket: env.s3.bucket, Key: key, ContentType: contentType });
  return getSignedUrl(s3, cmd, { expiresIn: 300 });
}

/** Public URL for an object (bucket allows anonymous download in dev). */
export function publicUrl(key: string): string {
  return `${env.s3.endpoint}/${env.s3.bucket}/${key}`;
}
