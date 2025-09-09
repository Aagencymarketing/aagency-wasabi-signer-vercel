import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3, bucket, rootPrefix } from "../s3.mjs";

// CORS inline
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

export default async function handler(req, res) {
  if (applyCORS(req, res)) return;

  try {
    if (req.method !== "GET") {
      res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
      return;
    }

    const client = String(req.query.client || "").trim();
    const folder = String(req.query.folder || "VIDEO_DA_EDITARE/").trim();

    if (!client) {
      res.status(400).json({ ok: false, error: "CLIENT_REQUIRED" });
      return;
    }

    const prefix = `${rootPrefix}${client}/${folder}`;
    const resp = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        Delimiter: "/",
        MaxKeys: 1000,
      })
    );

    const files =
      (resp.Contents || [])
        .filter((o) => o.Key && !o.Key.endsWith("/")) // esclude “cartelle”
        .filter((o) => !/\/keep$/.test(o.Key)) // esclude il marker
        .map((o) => ({
          key: o.Key,
          name: o.Key.replace(prefix, ""),
          size: o.Size || 0,
          lastModified: o.LastModified || null,
        })) || [];

    res.status(200).json({
      ok: true,
      client,
      folder,
      count: files.length,
      files,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}
