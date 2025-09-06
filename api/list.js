// api/list.js
import { withCORS } from "./_cors";
import { makeS3, BUCKET } from "./_s3";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

export default withCORS(async function handler(req, res){
  try{
    const prefix = req.query.prefix || "";
    const s3 = makeS3();
    const out = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      Delimiter: "/"
    }));
    res.status(200).json(out || {});
  }catch(e){
    console.error("list error", e);
    res.status(500).json({ ok:false, error:"LIST_FAILED" });
  }
});
