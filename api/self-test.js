// api/self-test.js
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { withCORS } from "./_cors.js";
import { makeS3, BUCKET } from "./_s3.js";

export default withCORS(async function handler(req, res) {
  try {
    const s3 = makeS3();
    const out = await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
    res.status(200).json({
      ok: true,
      bucket: BUCKET,
      result: out?.$metadata || null,
    });
  } catch (e) {
    res.status(200).json({
      ok: false,
      bucket: BUCKET,
      error: String(e?.message || e),
      name: e?.name || null,
      code: e?.$metadata?.httpStatusCode || null,
    });
  }
});
