// api/create-client.js
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { withCORS } from "./_cors.js";
import { makeS3, BUCKET, ROOT_PREFIX, assertAuth } from "./_s3.js";

function sanitize(name) {
  return String(name || "")
    .trim()
    .replace(/[\/\\]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\w\s\-\.\,\&\(\)]/g, "");
}

export default withCORS(async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok:false, error:"METHOD_NOT_ALLOWED" });
    return;
  }
  if (!assertAuth(req, res)) return;

  let body = {};
  try { body = req.body || JSON.parse(req.body || "{}"); } catch {}

  const clientRaw = body.client;
  const root = body.root || ROOT_PREFIX;
  const client = sanitize(clientRaw);

  if (!client) {
    res.status(400).json({ ok:false, error:"INVALID_CLIENT" });
    return;
  }

  const base = `${root}${client}/`;
  const folders = ["VIDEO_DA_EDITARE/", "VIDEO_DA_PROGRAMMARE/", "ARCHIVIO/"];
  const s3 = makeS3();

  try {
    await Promise.all(
      folders.map(sub =>
        s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: `${base}${sub}.keep`,
          Body: "",
          ContentType: "text/plain",
        }))
      )
    );
    res.status(200).json({ ok:true, created: folders.map(f => `${base}${f}`) });
  } catch (e) {
    console.error("create-client error:", e);
    res.status(500).json({ ok:false, error:String(e?.message || e) });
  }
});
