// api/create-client.js
import { withCORS } from "./_cors";
import { makeS3, BUCKET, ROOT_PREFIX, assertAuth } from "./_s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export default withCORS(async function handler(req, res){
  try{
    if(req.method!=="POST") return res.status(405).json({ok:false});
    if(!assertAuth(req,res)) return;

    const { client, root } = req.body || {};
    const base = (root || ROOT_PREFIX) + (client || "").trim() + "/";
    if(!client) return res.status(400).json({ ok:false, error:"MISSING_CLIENT" });

    const s3 = makeS3();
    const folders = ["VIDEO_DA_EDITARE/", "VIDEO_DA_PROGRAMMARE/", "ARCHIVIO/"];
    for (const f of folders) {
      const keepKey = base + f + ".keep";
      await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: keepKey, Body: Buffer.from("keep"), ContentType: "text/plain" }));
    }
    res.status(200).json({ ok:true, created:true });
  }catch(e){
    console.error("create-client error", e);
    res.status(500).json({ ok:false, error:"CREATE_CLIENT_FAILED" });
  }
});
