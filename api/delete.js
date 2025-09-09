import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { withCORS } from "./_cors.js";
import { makeS3, BUCKET, assertAuth } from "./_s3.js";

export default withCORS(async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ ok:false, error:"METHOD_NOT_ALLOWED" }); return; }
  if (!assertAuth(req, res)) return;

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const { key } = body;
  if (!key) { res.status(400).json({ ok:false, error:"MISSING_KEY" }); return; }

  const s3 = makeS3();
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  res.status(200).json({ ok:true, deleted: key });
});
