// api/presign-get.js
import { withCORS } from "./_cors";
import { makeS3, BUCKET } from "./_s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default withCORS(async function handler(req, res){
  try{
    const key = req.query.key;
    if(!key) return res.status(400).json({ ok:false, error:"MISSING_KEY" });

    const s3 = makeS3();
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 900 });
    res.status(200).json({ ok:true, url });
  }catch(e){
    console.error("presign-get error", e);
    res.status(500).json({ ok:false, error:"PRESIGN_GET_FAILED" });
  }
});
