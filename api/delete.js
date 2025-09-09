import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3, bucket, cors } from "../s3.mjs";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method !== "POST" && req.method !== "DELETE") {
      res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
      return;
    }
    const key = (req.method === "POST" ? req.body?.key : req.query?.key) || "";
    if (!key) {
      res.status(400).json({ ok: false, error: "KEY_REQUIRED" });
      return;
    }
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    res.status(200).json({ ok: true, deleted: key });
  } catch (err) {
    console.error("delete error:", err);
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}
