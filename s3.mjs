import { S3Client } from "@aws-sdk/client-s3";

export const {
  WASABI_ACCESS_KEY,
  WASABI_SECRET_KEY,
  WASABI_BUCKET,
  WASABI_ENDPOINT,
  SIGNER_TOKEN
} = process.env;

export const s3 = new S3Client({
  region: "eu-south-1",
  endpoint: WASABI_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: WASABI_ACCESS_KEY,
    secretAccessKey: WASABI_SECRET_KEY
  }
});
