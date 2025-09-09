import { bucket, region, endpoint, rootPrefix, cors } from "../s3.mjs";
export default function handler(req, res) {
  if (cors(req, res)) return;
  res.status(200).json({
    ok: true,
    bucket,
    region,
    endpoint,
    rootPrefix,
    hasToken: Boolean(process.env.SIGNER_TOKEN)
  });
}
