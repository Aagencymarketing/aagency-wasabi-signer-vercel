// api/health.js
import { withCORS } from "./_cors";
import { BUCKET, ROOT_PREFIX } from "./_s3";

export default withCORS(async function handler(req, res) {
  res.status(200).json({
    ok: true,
    bucket: BUCKET || null,
    region: process.env.WASABI_REGION || null,
    endpoint: process.env.WASABI_ENDPOINT || null,
    rootPrefix: ROOT_PREFIX,
    hasToken: Boolean(process.env.SIGNER_TOKEN),
  });
});
