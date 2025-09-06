// api/_s3.js
import { S3Client } from "@aws-sdk/client-s3";

export function makeS3() {
  return new S3Client({
    region: process.env.WASABI_REGION,
    endpoint: process.env.WASABI_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
      secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY,
    },
  });
}

export const BUCKET = process.env.WASABI_BUCKET;
export const ROOT_PREFIX = process.env.ROOT_PREFIX || "Aagency_GestioneVideo/";

export function assertAuth(req, res) {
  const h = req.headers || {};
  const token =
    h["x-agency-token"] ||
    h["x-aagency-token"] ||
    h["X-Agency-Token"] ||
    h["X-Aagency-Token"];

  if (!token || token !== process.env.SIGNER_TOKEN) {
    res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
    return false;
  }
  return true;
}
