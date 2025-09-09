import { PutObjectCommand, S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { HttpRequest } from "@smithy/protocol-http";
import { parseUrl } from "@smithy/url-parser";
import { withCORS } from "./_cors.js";
import { makeS3, BUCKET, ROOT_PREFIX, assertAuth } from "./_s3.js";

function ensureSlash(p){ return p && !p.endsWith("/") ? p + "/" : (p || ""); }

export default withCORS(async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ ok:false, error:"METHOD_NOT_ALLOWED" }); return; }
  if (!assertAuth(req, res)) return;

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const { client, folder = "VIDEO_DA_EDITARE/", filename } = body;
  const root = ensureSlash(body.root || ROOT_PREFIX);
  if (!client || !filename) { res.status(400).json({ ok:false, error:"INVALID_PARAMS" }); return; }

  const Key = `${root}${client}/${ensureSlash(folder)}${filename}`;
  const s3 = makeS3();

  const command = new PutObjectCommand({ Bucket: BUCKET, Key, ContentType: body.contentType || "application/octet-stream" });
  const signer = new S3RequestPresigner({ ...s3.config });
  const url = await signer.presign(
    new HttpRequest({ ...parseUrl(s3.config.endpoint), method: "PUT", path: `/${BUCKET}/${Key}`, headers: {} }),
    { expiresIn: 900 }
  );

  res.status(200).json({ ok:true, url: String(url), key: Key });
});
