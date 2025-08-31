import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, WASABI_BUCKET, SIGNER_TOKEN } from "../s3.mjs";

function ensureAuth(req, res) {
  const token = req.headers["x-agency-token"] || req.headers["x-agency-token".toLowerCase()];
  if (!token || token !== SIGNER_TOKEN) {
    res.statusCode = 401;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "unauthorized" }));
    return false;
  }
  return true;
}


export default async function handler(req, res) {
  if (!ensureAuth(req, res)) return;
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    const key = body.key;
    if (!key) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "key required" }));
      return;
    }
    const contentType = body.contentType || "application/octet-stream";
    const url = await getSignedUrl(s3, new PutObjectCommand({
      Bucket: WASABI_BUCKET, Key: key, ContentType: contentType
    }), { expiresIn: 900 });
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ url }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String(e) }));
  }
}
