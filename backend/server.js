const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 4000;

// CORS configuration - allow specific frontend origins (adjust for production)
const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Fetch polyfill for Node.js >= 18 is built-in, otherwise:
// const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fetch = global.fetch || require("node-fetch");

// Helper: filter by severity in vulnerability severity array
function matchesSeverity(vulnSeverities, severityFilter) {
  if (!severityFilter) return true;
  if (!Array.isArray(vulnSeverities)) return false;
  return vulnSeverities.some(s =>
    (s.type && s.type.toUpperCase() === severityFilter.toUpperCase())
    || (typeof s === "string" && s.toUpperCase() === severityFilter.toUpperCase())
  );
}

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
      return res.status(response.status).json({ error: "Failed to fetch OSV data." });
    }

    const data = await response.json();
    let vulns = data.vulns || [];

    // Filter by company keyword in references URLs
    if (company) {
      const companyLower = company.toLowerCase();
      vulns = vulns.filter(v =>
        v.references && v.references.some(ref => ref.url.toLowerCase().includes(companyLower))
      );
    }

    // Filter by severity
    if (severityFilter) {
      vulns = vulns.filter(v => matchesSeverity(v.severity, severityFilter));
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
