import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3, bucket, rootPrefix, cors, normalizeClientName } from "../s3.mjs";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method !== "GET") {
      res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
      return;
    }
    const client = normalizeClientName(req.query?.client);
    const folder = String(req.query?.folder || "VIDEO_DA_EDITARE/").trim();

    if (!client) {
      res.status(400).json({ ok: false, error: "CLIENT_REQUIRED" });
      return;
    }

    const prefix = `${rootPrefix}${client}/${folder}`;
    const resp = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: "/",
      MaxKeys: 1000
    }));

    const files = (resp.Contents || [])
      .filter(o => o.Key && !o.Key.endsWith("/") && !/\/keep$/.test(o.Key))
      .map(o => ({
        key: o.Key,
        name: o.Key.replace(prefix, ""),
        size: o.Size || 0,
        lastModified: o.LastModified || null
      }));

    res.status(200).json({ ok: true, client, folder, count: files.length, files });
  } catch (err) {
    console.error("list error:", err);
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}
