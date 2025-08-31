import { DeleteObjectCommand } from "@aws-sdk/client-s3";
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
  if (req.method !== "DELETE") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "method not allowed" }));
    return;
  }
  try {
    const urlObj = new URL(req.url, "http://localhost");
    const key = urlObj.searchParams.get("key");
    if (!key) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "key required" }));
      return;
    }
    await s3.send(new DeleteObjectCommand({ Bucket: WASABI_BUCKET, Key: key }));
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String(e) }));
  }
}
