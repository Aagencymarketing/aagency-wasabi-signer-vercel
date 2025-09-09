import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, bucket, rootPrefix, cors, normalizeClientName } from "../s3.mjs";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method !== "POST" && req.method !== "GET") {
      res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
      return;
    }
    const nameParam = req.method === "POST" ? (req.body?.name || req.body?.client) : (req.query?.name || req.query?.client);
    const client = normalizeClientName(nameParam);
    if (!client) {
      res.status(400).json({ ok: false, error: "NAME_REQUIRED" });
      return;
    }

    const base = `${rootPrefix}${client}/`;
    const folders = ["VIDEO_DA_EDITARE/", "DA_PROGRAMMARE/", "ARCHIVIO/"];

    await Promise.all(
      folders.map(f =>
        s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: `${base}${f}keep`,
          Body: ""
        }))
      )
    );

    res.status(200).json({ ok: true, client, created: folders.map(f => `${base}${f}`) });
  } catch (err) {
    console.error("create-client error:", err);
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}
