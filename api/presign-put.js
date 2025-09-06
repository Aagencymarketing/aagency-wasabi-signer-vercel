// api/presign-put.js
import { withCORS } from "./_cors";
import { makeS3, BUCKET, assertAuth } from "./_s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default withCORS(async function handler(req, res){
  try{
    if(req.method!=="POST") return res.status(405).json({ok:false});
    if(!assertAuth(req,res)) return;

    const { key, contentType } = req.body || {};
    if(!key) return res.status(400).json({ ok:false, error:"MISSING_KEY" });

    const s3 = makeS3();
    const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType || "application/octet-stream" });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 900 }); // 15 min
    res.status(200).json({ ok:true, url });
  }catch(e){
    console.error("presign-put error", e);
    res.status(500).json({ ok:false, error:"PRESIGN_PUT_FAILED" });
  }
});
