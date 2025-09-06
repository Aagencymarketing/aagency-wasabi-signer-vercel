// api/create-client.js
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { withCORS } from "./_cors.js";
import { makeS3, BUCKET, ROOT_PREFIX, assertAuth } from "./_s3.js";

function sanitize(name) {
  return String(name || "")
    .trim()
    .replace(/[\/\\]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\w\s\-\.\,\&\(\)]/g, "");
}

function ensureSlash(p) {
  if (!p) return "";
  return p.endsWith("/") ? p : p + "/";
}

export default withCORS(async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  if (!assertAuth(req, res)) return;

  // body può arrivare come JSON o stringa
  let body = {};
  try { body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}); }
  catch { body = {}; }

  const clientRaw = body.client;
  const root = ensureSlash(body.root || ROOT_PREFIX);
  const client = sanitize(clientRaw);

  if (!client) {
    res.status(400).json({ ok: false, error: "INVALID_CLIENT" });
    return;
  }

  const base = `${root}${client}/`;
  const folders = ["VIDEO_DA_EDITARE/", "VIDEO_DA_PROGRAMMARE/", "ARCHIVIO/"];

  const s3 = makeS3();

  try {
    await Promise.all(
      folders.map((sub) =>
        s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: `${base}${sub}.keep`, // crea il "folder" con segnaposto
          Body: "",
          ContentType: "text/plain",
        }))
      )
    );

    res.status(200).json({
      ok: true,
      client,
      created: folders.map((f) => `${base}${f}`)
    });
  } catch (e) {
    console.error("create-client error:", e);
    res.status(500).json({
      ok: false,
      error: String(e?.message || e),
      name: e?.name || null,
      http: e?.$metadata?.httpStatusCode || null
    });
  }
});
