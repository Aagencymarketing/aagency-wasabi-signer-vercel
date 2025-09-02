// /api/delete-client.js
import {
  ListObjectsV2Command,
  DeleteObjectsCommand
} from "@aws-sdk/client-s3";
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
  if (req.method !== "POST") { res.statusCode = 405; return res.end(JSON.stringify({ error: "method not allowed" })); }
  if (!ensureAuth(req, res)) return;

  try {
    const chunks = [];
    for await (const ch of req) chunks.push(ch);
    const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");

    const root = (body.root || "Aagency_GestioneVideo/").trim();
    const client = (body.client || "").trim();
    if (!client) { res.statusCode = 400; return res.end(JSON.stringify({ error: "client required" })); }

    const prefix = `${root}${client}/`;

    let deleted = 0;
    let token;
    do {
      const list = await s3.send(new ListObjectsV2Command({
        Bucket: WASABI_BUCKET,
        Prefix: prefix,
        ContinuationToken: token
      }));
      const objs = (list.Contents || []).map(o => ({ Key: o.Key }));
      if (objs.length) {
        const out = await s3.send(new DeleteObjectsCommand({
          Bucket: WASABI_BUCKET,
          Delete: { Objects: objs, Quiet: true }
        }));
        deleted += (out.Deleted || []).length;
      }
      token = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (token);

    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true, client, deleted }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String(e) }));
  }
}
