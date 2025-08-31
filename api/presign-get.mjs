import { GetObjectCommand } from "@aws-sdk/client-s3";
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
    const urlObj = new URL(req.url, "http://localhost");
    const key = urlObj.searchParams.get("key");
    if (!key) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "key required" }));
      return;
    }
    const url = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: WASABI_BUCKET, Key: key
    }), { expiresIn: 900 });
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ url }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String(e) }));
  }
}
