// api/delete-client.js
import { withCORS } from "./_cors";
import { makeS3, BUCKET, ROOT_PREFIX, assertAuth } from "./_s3";
import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

export default withCORS(async function handler(req,res){
  try{
    if(req.method!=="POST") return res.status(405).json({ok:false});
    if(!assertAuth(req,res)) return;

    const { client, root } = req.body || {};
    if(!client) return res.status(400).json({ ok:false, error:"MISSING_CLIENT" });

    const prefix = (root || ROOT_PREFIX) + client.trim() + "/";
    const s3 = makeS3();
    let deleted = 0, ContinuationToken;

    do{
      const page = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken }));
      const objs = (page.Contents || []).map(o=>({ Key:o.Key }));
      if(objs.length){
        await s3.send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: objs } }));
        deleted += objs.length;
      }
      ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (ContinuationToken);

    res.status(200).json({ ok:true, deleted });
  }catch(e){
    console.error("delete-client error", e);
    res.status(500).json({ ok:false, error:"DELETE_CLIENT_FAILED" });
  }
});
