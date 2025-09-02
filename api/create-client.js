// /api/create-client.js
import { PutObjectCommand } from "@aws-sdk/client-s3";
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

// cartelle standard di default
const DEFAULT_FOLDERS = ["VIDEO_DA_EDITARE/", "VIDEO_DA_PROGRAMMARE/", "ARCHIVIO/"];

// crea un oggetto "segnaposto" per forzare l'esistenza della cartella
async function ensureFolder(bucket, keyPrefix) {
  // S3/Wasabi non "crea cartelle": mettiamo un file zero-byte tipo .keep
  const keepKey = keyPrefix.replace(/\/+$/, "") + "/.keep";
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: keepKey,
    Body: "",
    ContentType: "application/octet-stream",
  }));
}

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }
  if (req.method !== "POST") { res.statusCode = 405; return res.end(JSON.stringify({ error: "method not allowed" })); }
  if (!ensureAuth(req, res)) return;

  try {
    // leggi body
    const chunks = [];
    for await (const ch of req) chunks.push(ch);
    const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");

    const root = (body.root || "Aagency_GestioneVideo/").trim();
    const clientRaw = (body.client || "").trim();
    const folders = Array.isArray(body.folders) && body.folders.length ? body.folders : DEFAULT_FOLDERS;

    if (!clientRaw) { res.statusCode = 400; return res.end(JSON.stringify({ error: "client required" })); }

    // manteniamo gli spazi come richiesto
    const client = clientRaw;

    // crea cartelle
    const created = [];
    for (const f of folders) {
      const prefix = root + client + "/" + f;
      await ensureFolder(WASABI_BUCKET, prefix);
      created.push(prefix);
    }

    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true, client, created }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String(e) }));
  }
}
