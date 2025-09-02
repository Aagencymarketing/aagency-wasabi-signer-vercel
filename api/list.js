import { ListObjectsV2Command } from "@aws-sdk/client-s3";
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
  if (!ensureAuth(req, res)) return;
  try {
    const url = new URL(req.url, "http://localhost");
    const prefix = url.searchParams.get("prefix") || "";
    const out = await s3.send(new ListObjectsV2Command({
      Bucket: WASABI_BUCKET,
      Prefix: prefix,
      Delimiter: "/"
    }));
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(out));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String(e) }));
  }
}
