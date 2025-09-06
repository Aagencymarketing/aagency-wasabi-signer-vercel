// api/health.js  — versione NO-IMPORT per isolare il problema
export default function handler(req, res) {
  // CORS minimo
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-agency-token,x-aagency-token");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    ok: true,
    // leggere le ENV *non* può causare 500
    bucket: process.env.WASABI_BUCKET || null,
    region: process.env.WASABI_REGION || null,
    endpoint: process.env.WASABI_ENDPOINT || null,
    rootPrefix: process.env.ROOT_PREFIX || "Aagency_GestioneVideo/",
    hasToken: Boolean(process.env.SIGNER_TOKEN),
  });
}
