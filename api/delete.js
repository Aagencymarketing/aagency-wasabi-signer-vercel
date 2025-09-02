import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3, WASABI_BUCKET, SIGNER_TOKEN } from "../s3.mjs";

function setCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-agency-token");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
}
function ensureAuth(req, res) {
  const token = req.headers["x-agency-token"];
  if (!token || token !== SIGNER_TOKEN) {
    res.statusCode = 401;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "unauthorized" }));
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }
  if (req.method !== "DELETE") { res.statusCode = 405; return res.end(JSON.stringify({ error: "method not allowed" })); }
  if (!ensureAuth(req, res)) return;
  try {
    const urlObj = new URL(req.url, "http://localhost");
    const key = urlObj.searchParams.get("key");
    if (!key) { res.statusCode = 400; return res.end(JSON.stringify({ error: "key required" })); }
    await s3.send(new DeleteObjectCommand({ Bucket: WASABI_BUCKET, Key: key }));
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String(e) }));
  }
}
