import { S3Client } from "@aws-sdk/client-s3";

export const region = process.env.WASABI_REGION || "eu-south-1";
export const endpoint =
  process.env.WASABI_ENDPOINT || `https://s3.${region}.wasabisys.com`;
export const bucket = process.env.WASABI_BUCKET;
export const rootPrefix = (process.env.ROOT_PREFIX || "Aagency_GestioneVideo/").replace(/^\/+|\/+$/g,"") + "/";

// sicurezza base: non esporre accidentalmente chiavi mancanti
function assertEnv() {
  const miss = [];
  if (!bucket) miss.push("WASABI_BUCKET");
  if (!process.env.WASABI_ACCESS_KEY) miss.push("WASABI_ACCESS_KEY");
  if (!process.env.WASABI_SECRET_KEY) miss.push("WASABI_SECRET_KEY");
  if (miss.length) {
    throw new Error("Missing env: " + miss.join(", "));
  }
}
assertEnv();

export const s3 = new S3Client({
  region,
  endpoint,
  forcePathStyle: true, // Wasabi richiede path-style
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY,
    secretAccessKey: process.env.WASABI_SECRET_KEY
  }
});

export function cors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-agency-token");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}

// normalizza un nome cliente "pulito"
export function normalizeClientName(raw) {
  return String(raw || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\\#?"<>|]/g, "-");
}
