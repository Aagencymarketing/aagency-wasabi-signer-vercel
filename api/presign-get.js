import { GetObjectCommand, S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { HttpRequest } from "@smithy/protocol-http";
import { parseUrl } from "@smithy/url-parser";
import { withCORS } from "./_cors.js";
import { makeS3, BUCKET, assertAuth } from "./_s3.js";

export default withCORS(async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ ok:false, error:"METHOD_NOT_ALLOWED" }); return; }
  if (!assertAuth(req, res)) return;

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const { key } = body;
  if (!key) { res.status(400).json({ ok:false, error:"MISSING_KEY" }); return; }

  const s3 = makeS3();
  const signer = new S3RequestPresigner({ ...s3.config });
  const url = await signer.presign(
    new HttpRequest({ ...parseUrl(s3.config.endpoint), method: "GET", path: `/${BUCKET}/${key}`, headers: {} }),
    { expiresIn: 900 }
  );

  res.status(200).json({ ok:true, url: String(url) });
});
