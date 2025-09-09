import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { withCORS } from "./_cors.js";
import { makeS3, BUCKET, ROOT_PREFIX, assertAuth } from "./_s3.js";

function ensureSlash(p){ return p && !p.endsWith("/") ? p + "/" : (p || ""); }

export default withCORS(async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ ok:false, error:"METHOD_NOT_ALLOWED" }); return; }
  if (!assertAuth(req, res)) return;

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const client = String(body.client || "").trim();
  const root = ensureSlash(body.root || ROOT_PREFIX);
  if (!client) { res.status(400).json({ ok:false, error:"INVALID_CLIENT" }); return; }

  const Prefix = `${root}${client}/`;
  const s3 = makeS3();

  // lista e cancellazione batch
  const listed = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix }));
  const objs = (listed.Contents || []).map(o => ({ Key: o.Key }));
  if (objs.length) {
    await s3.send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: objs } }));
  }
  res.status(200).json({ ok:true, removedPrefix: Prefix, count: objs.length });
});
