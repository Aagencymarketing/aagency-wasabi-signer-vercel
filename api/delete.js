// api/delete.js
import { withCORS } from "./_cors";
import { makeS3, BUCKET, assertAuth } from "./_s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export default withCORS(async function handler(req,res){
  try{
    if(req.method!=="DELETE") return res.status(405).json({ok:false});
    if(!assertAuth(req,res)) return;

    const key = req.query.key;
    if(!key) return res.status(400).json({ ok:false, error:"MISSING_KEY" });

    const s3 = makeS3();
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    res.status(200).json({ ok:true, deleted:true });
  }catch(e){
    console.error("delete error", e);
    res.status(500).json({ ok:false, error:"DELETE_FAILED" });
  }
});
