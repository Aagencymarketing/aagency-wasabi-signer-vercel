import { ListObjectsV2Command, CopyObjectCommand } from "@aws-sdk/client-s3";
import { s3, bucket, rootPrefix, cors, normalizeClientName } from "../s3.mjs";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
      return;
    }
    const { client } = req.body || {};
    const cname = normalizeClientName(client);
    if (!cname) {
      res.status(400).json({ ok: false, error: "CLIENT_REQUIRED" });
      return;
    }

    const from = `${rootPrefix}${cname}/DA_PROGRAMMARE/`;
    const to = `${rootPrefix}${cname}/ARCHIVIO/`;

    const list = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: from,
      MaxKeys: 1000
    }));

    const contents = (list.Contents || []).filter(o => o.Key && !o.Key.endsWith("/") && !/\/keep$/.test(o.Key));
    await Promise.all(
      contents.map(obj => {
        const destKey = to + obj.Key.substring(from.length);
        return s3.send(new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `/${bucket}/${obj.Key}`,
          Key: destKey
        }));
      })
    );

    res.status(200).json({ ok: true, copied: contents.length });
  } catch (err) {
    console.error("clone-to-archive error:", err);
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}
