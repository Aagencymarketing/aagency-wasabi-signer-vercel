import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, bucket, rootPrefix } from "../s3.mjs";

// CORS inline (niente più import esterni)
function applyCORS(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-agency-token");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}

function getNameFromReq(req) {
  try {
    if (req.method === "POST" && req.body && typeof req.body === "object") {
      if (req.body.name) return String(req.body.name).trim();
      if (req.body.client) return String(req.body.client).trim();
    }
  } catch (_) {}
  const { name, client } = req.query || {};
  return String(name || client || "").trim();
}

export default async function handler(req, res) {
  if (applyCORS(req, res)) return;

  try {
    if (req.method !== "POST" && req.method !== "GET") {
      res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
      return;
    }

    const raw = getNameFromReq(req);
    if (!raw) {
      res.status(400).json({ ok: false, error: "NAME_REQUIRED" });
      return;
    }

    // normalizzazione semplice: trims e collapse spazi
    const name = raw.replace(/\s+/g, " ").trim();
    const base = `${rootPrefix}${name}/`;
    const folders = ["VIDEO_DA_EDITARE/", "DA_PROGRAMMARE/", "ARCHIVIO/"];

    // In S3/Wasabi "cartelle" = oggetti con chiave che termina con "/".
    // Metto anche un marker "keep" per tenerle sempre visibili.
    const ops = folders.map((f) =>
      s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: `${base}${f}keep`,
          Body: "",
        })
      )
    );

    await Promise.all(ops);

    res.status(200).json({
      ok: true,
      client: name,
      created: folders.map((f) => `${base}${f}`),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}
