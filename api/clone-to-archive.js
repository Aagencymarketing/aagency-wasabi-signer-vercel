// /api/clone-to-archive.js
import { S3Client, CopyObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });

    // sicurezza: lo stesso header che usi nel signer
    const token = req.headers["x-agency-token"];
    if (!token || token !== process.env.SIGNER_TOKEN) {
      return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
    }

    const { key } = req.body || {};
    if (!key || typeof key !== "string") {
      return res.status(400).json({ ok: false, error: "MISSING_KEY" });
    }

    // clona SOLO se è in VIDEO_DA_PROGRAMMARE
    const marker = "/VIDEO_DA_PROGRAMMARE/";
    if (!key.includes(marker)) {
      return res.status(200).json({ ok: true, skipped: true, reason: "NOT_PROGRAMMARE_PATH" });
    }

    // destinazione: sostituisci la parte di path con ARCHIVIO
    const destKey = key.replace(marker, "/ARCHIVIO/");

    // opzionale: valida prefisso per sicurezza (evita copie fuori dal tuo spazio)
    const allowedPrefix = (process.env.ROOT_PREFIX || "Aagency_GestioneVideo/");
    if (!key.startsWith(allowedPrefix) || !destKey.startsWith(allowedPrefix)) {
      return res.status(400).json({ ok: false, error: "INVALID_PREFIX" });
    }

    const s3 = new S3Client({
      region: process.env.WASABI_REGION || "eu-central-2", // Milan
      endpoint: process.env.WASABI_ENDPOINT || "https://s3.eu-central-2.wasabisys.com",
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
        secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY,
      },
    });

    const Bucket = process.env.WASABI_BUCKET;
    if (!Bucket) return res.status(500).json({ ok: false, error: "MISSING_BUCKET_ENV" });

    // se il sorgente non esiste (upload non ancora consistente), esci "soft"
    try {
      await s3.send(new HeadObjectCommand({ Bucket, Key: key }));
    } catch (e) {
      return res.status(200).json({ ok: true, skipped: true, reason: "SOURCE_NOT_FOUND_YET" });
    }

    // copia server-side (intra-bucket) — veloce, niente doppio upload
    await s3.send(new CopyObjectCommand({
      Bucket,
      Key: destKey,
      CopySource: `/${Bucket}/${encodeURI(key)}`,
      MetadataDirective: "COPY",
    }));

    return res.status(200).json({ ok: true, destKey });
  } catch (err) {
    console.error("clone-to-archive error:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}
