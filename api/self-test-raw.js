// api/self-test-raw.js — diagnostica senza dipendere da _cors.js o _s3.js
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

export default async function handler(req, res) {
  // CORS minimo
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-agency-token,x-aagency-token");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  try {
    const s3 = new S3Client({
      region: process.env.WASABI_REGION,
      endpoint: process.env.WASABI_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
        secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY,
      },
    });

    const out = await s3.send(new HeadBucketCommand({ Bucket: process.env.WASABI_BUCKET }));
    res.status(200).json({ ok: true, meta: out?.$metadata || null });
  } catch (e) {
    res.status(200).json({
      ok: false,
      error: String(e?.message || e),
      name: e?.name || null,
      http: e?.$metadata?.httpStatusCode || null,
      region: process.env.WASABI_REGION,
      endpoint: process.env.WASABI_ENDPOINT,
      bucket: process.env.WASABI_BUCKET,
      hasAK: !!process.env.WASABI_ACCESS_KEY_ID,
      hasSK: !!process.env.WASABI_SECRET_ACCESS_KEY
    });
  }
}
