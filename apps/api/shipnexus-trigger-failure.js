const http = require("http");
const crypto = require("crypto");
require("dotenv").config();

if (!process.env.GITHUB_WEBHOOK_SECRET) {
  console.error("Missing GITHUB_WEBHOOK_SECRET. Check your .env file.");
  process.exit(1);
}

const now = Date.now();

const body = JSON.stringify({
  serviceName: "api-gateway",
  imageTag: "manual-failure-" + now,
  environment: "staging",
  triggeredBy: "manual-failure-test",
  webhookEventId: "manual-failure-" + now,
  payload: {
    source: "manual-browser-failure-test",
  },
});

const sig =
  "sha256=" +
  crypto
    .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

const req = http.request(
  {
    hostname: "127.0.0.1",
    port: 3000,
    path: "/deployments",
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
      "x-hub-signature-256": sig,
    },
  },
  (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("status", res.statusCode);
      console.log(data);
    });
  }
);

req.on("error", (err) => {
  console.error(err);
  process.exit(1);
});

req.end(body);
