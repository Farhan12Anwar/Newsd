const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 4000;

const NVD_API_KEY = "8dee2c37-4e5a-405e-89ab-95414d33cb71";

console.log("Starting backend proxy server...");

app.use(cors()); // Enable CORS for all origins (adjust in production)

const NVD_API_URL =
  "https://services.nvd.nist.gov/rest/json/cves/1.0?resultsPerPage=10&startIndex=0&pubStartDate=2025-01-01T00:00:00Z";

app.get("/api/vulnerabilities", async (req, res) => {
  try {
    const response = await fetch(NVD_API_URL, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "apiKey": NVD_API_KEY,
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
    "Cache-Control": "no-cache"
  }
});

    if (!response.ok) {
      console.error("NVD response status:", response.status, response.statusText);
      console.error("Response headers:", response.headers.raw());
      const errorBody = await response.text();
      console.error("Response body:", errorBody);
      return res.status(response.status).json({ error: `Failed to fetch NVD data: ${response.statusText}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching NVD data:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend proxy server running on http://localhost:${PORT}`);
});
