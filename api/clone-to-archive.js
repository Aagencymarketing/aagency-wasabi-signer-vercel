// api/clone-to-archive.js
import { withCORS } from "./_cors";
import { makeS3, BUCKET, ROOT_PREFIX, assertAuth } from "./_s3";
import { CopyObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

export default withCORS(async function handler(req,res){
  try{
    if(req.method!=="POST") return res.status(405).json({ok:false});
    if(!assertAuth(req,res)) return;

    const { key } = req.body || {};
    if(!key) return res.status(400).json({ ok:false, error:"MISSING_KEY" });

    const marker = "/VIDEO_DA_PROGRAMMARE/";
    if (!key.includes(marker)) {
      return res.status(200).json({ ok:true, skipped:true, reason:"NOT_PROGRAMMARE_PATH" });
    }
    const destKey = key.replace(marker, "/ARCHIVIO/");

    if (!key.startsWith(ROOT_PREFIX) || !destKey.startsWith(ROOT_PREFIX)) {
      return res.status(400).json({ ok:false, error:"INVALID_PREFIX" });
    }

    const s3 = makeS3();
    try { await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key })); }
    catch { return res.status(200).json({ ok:true, skipped:true, reason:"SOURCE_NOT_FOUND_YET" }); }

    await s3.send(new CopyObjectCommand({
      Bucket: BUCKET,
      Key: destKey,
      CopySource: `/${BUCKET}/${encodeURI(key)}`,
      MetadataDirective: "COPY",
    }));

    res.status(200).json({ ok:true, destKey });
  }catch(e){
    console.error("clone-to-archive error", e);
    res.status(500).json({ ok:false, error:"CLONE_FAILED" });
  }
});
