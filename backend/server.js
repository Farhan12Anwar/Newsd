const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Using node-fetch for compatibility if needed
const fetch = global.fetch || require("node-fetch");

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration - allow frontend origins
const allowedOrigins = [
  'https://spidernews.netlify.app',,
  "http://localhost:4000",
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow non-browser tools
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `CORS policy does not allow access from ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);

app.use(express.json());

// NewsAPI proxy endpoint
app.get("/api/news", async (req, res) => {
  try {
    const newsApiKey = process.env.NEWS_API_KEY;
    if (!newsApiKey) {
      return res.status(500).json({ error: "News API key is not configured" });
    }

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=cybersecurity OR "cyber security" OR hacking OR "data breach" OR "information security"&language=en&sortBy=publishedAt&apiKey=${newsApiKey}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NewsAPI error:", errorText);
      return res.status(response.status).json({ error: "Failed to fetch news data" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error querying NewsAPI:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Helper to filter severity
function matchesSeverity(vulnSeverities, severityFilter) {
  if (!severityFilter) return true;
  if (!Array.isArray(vulnSeverities)) return false;
  return vulnSeverities.some(
    (s) =>
      (s.type && s.type.toUpperCase() === severityFilter.toUpperCase()) ||
      (typeof s === "string" && s.toUpperCase() === severityFilter.toUpperCase())
  );
}

// Vulnerabilities API endpoint
app.post("/api/vulnerabilities", async (req, res) => {
  try {
    const { packageName, version, ecosystem, company, severityFilter } = req.body || {};

    if (!packageName || !version || !ecosystem) {
      return res.status(400).json({ error: "packageName, version and ecosystem are required" });
    }

    const osvRequestBody = {
      version,
      package: {
        name: packageName,
        ecosystem,
      },
    };

    const response = await fetch("https://api.osv.dev/v1/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(osvRequestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OSV API error:", errorText);
      return res.status(response.status).json({ error: "Failed to fetch OSV data" });
    }

    const data = await response.json();
    let vulns = data.vulns || [];

    // Filter by company keyword in references URLs
    if (company) {
      const companyLower = company.toLowerCase();
      vulns = vulns.filter(
        (v) => v.references && v.references.some((ref) => ref.url.toLowerCase().includes(companyLower))
      );
    }

    // Filter by severity
    if (severityFilter) {
      vulns = vulns.filter((v) => matchesSeverity(v.severity, severityFilter));
    }

    res.json({ vulns });
  } catch (error) {
    console.error("Error querying OSV API:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend proxy server running on http://localhost:${PORT}`);
});
