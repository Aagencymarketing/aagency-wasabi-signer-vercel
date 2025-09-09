import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { withCORS } from "./_cors.js";
import { makeS3, BUCKET, ROOT_PREFIX, assertAuth } from "./_s3.js";

function ensureSlash(p) { return p && !p.endsWith("/") ? p + "/" : (p || ""); }

export default withCORS(async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ ok:false, error:"METHOD_NOT_ALLOWED" }); return; }
  if (!assertAuth(req, res)) return;

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const client = String(body.client || "").trim();
  const folder = String(body.folder || "VIDEO_DA_EDITARE/").trim();
  const root = ensureSlash(body.root || ROOT_PREFIX);
  if (!client) { res.status(400).json({ ok:false, error:"INVALID_CLIENT" }); return; }

  const Prefix = `${root}${client}/${ensureSlash(folder)}`;
  const s3 = makeS3();

  const out = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix, Delimiter: "/" }));
  const files = (out.Contents || [])
    .filter(o => !o.Key.endsWith("/.keep"))
    .map(o => ({
      key: o.Key,
      name: o.Key.substring(Prefix.length),
      size: o.Size,
      lastModified: o.LastModified
    }));
  res.status(200).json({ ok:true, prefix: Prefix, files });
});
