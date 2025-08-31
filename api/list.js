import { ListObjectsV2Command } from "@aws-sdk/client-s3";
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
