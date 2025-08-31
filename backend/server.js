const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json()); // To parse JSON body from frontend

console.log("Starting backend proxy server with OSV.dev...");

// POST API endpoint to query OSV.dev for vulnerabilities by package version
app.post("/api/vulnerabilities", async (req, res) => {
  try {
    const { packageName, version, ecosystem } = req.body;

    // Validate inputs
    if (!packageName || !version || !ecosystem) {
      return res.status(400).json({ error: "packageName, version and ecosystem are required in JSON body." });
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(osvRequestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OSV API error:", errorText);
      return res.status(response.status).json({ error: "Failed to fetch OSV data." });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error querying OSV API:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend proxy server running on http://localhost:${PORT}`);
});
