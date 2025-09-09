import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, bucket, rootPrefix, cors, normalizeClientName } from "../s3.mjs";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
      return;
    }
    const { client, folder = "VIDEO_DA_EDITARE/", filename } = req.body || {};
    const cname = normalizeClientName(client);
    if (!cname || !filename) {
      res.status(400).json({ ok: false, error: "PARAMS_REQUIRED" });
      return;
    }
    const key = `${rootPrefix}${cname}/${folder}${filename}`;
    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 10 });
    res.status(200).json({ ok: true, key, url });
  } catch (err) {
    console.error("presign-put error:", err);
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}
