import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";

const NEWS_API_KEY = "9ec3cd1c0603415fa22623a3313343bf";
const NEWS_API_URL =
  `https://newsapi.org/v2/everything?` +
  `q=cybersecurity OR "cyber security" OR hacking OR "data breach" OR "information security"&` +
  `language=en&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;

const BACKEND_PROXY_URL = "https://newsd.onrender.com/api/vulnerabilities";


const colors = {
  background: "#121212",
  surface: "#1E1E1E",
  primary: "#90caf9",
  primaryDark: "#64b5f6",
  textPrimary: "#FFFFFF",
  textSecondary: "#B0BEC5",
  error: "#cf6679",
  border: "#333",
};

const cardStyle = {
  borderRadius: 12,
  boxShadow: "0 4px 10px rgba(0,0,0,0.7)",
  backgroundColor: colors.surface,
  padding: 20,
  marginBottom: 30,
  color: colors.textPrimary,
  textDecoration: "none",
  boxSizing: "border-box",
  minWidth: 760,
  maxWidth: 800,
};

// News filtering for true cybersecurity content
function isCybersecurityArticle(article) {
  const fields = [article.title, article.description, article.content].join(" ").toLowerCase();
  return (
    fields.includes("cyber") ||
    fields.includes("security") ||
    fields.includes("hacking") ||
    fields.includes("breach") ||
    fields.includes("vulnera") ||
    fields.includes("infosec")
  );
}

function News() {
  const [newsList, setNewsList] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const getRandomCybersecurityImage = () =>
    `https://source.unsplash.com/random/600x460/?cybersecurity,technology,computer,security,hacking,dark`;

  React.useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(NEWS_API_URL);
        if (!response.ok) throw new Error("Failed to fetch news");
        const data = await response.json();
        setNewsList(data.articles || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  return (
    <div style={{ padding: 20, backgroundColor: colors.background, minHeight: "80vh" }}>
      <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 30, color: colors.primary }}>
        Latest Cybersecurity News
      </h2>

      {loading && <p style={{ fontSize: 18, color: colors.textSecondary }}>Loading news...</p>}
      {error && <p style={{ color: colors.error, fontSize: 18 }}>{error}</p>}
      {!loading && newsList.filter(isCybersecurityArticle).length === 0 && (
        <p style={{ fontSize: 18, color: colors.textSecondary }}>No cybersecurity news found.</p>
      )}

      {newsList.filter(isCybersecurityArticle).map((news, i) => (
        <div
          key={i}
          style={{
            marginBottom: 20,
            borderBottom: `1px solid ${colors.border}`,
            paddingBottom: 15,
            display: "flex",
            gap: 15,
            flexWrap: "wrap",
          }}
        >
          <img
            src={news.urlToImage || "/cyber-placeholder.jpg"}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/cyber-placeholder.jpg";
            }}
            alt="news"
            style={{ width: "100%", maxWidth: 300, height: 160, objectFit: "cover", borderRadius: 6, filter: "brightness(0.9)" }}
            loading="lazy"
          />
          <div style={{ flex: "1 1 300px", color: colors.textPrimary }}>
            <h3 style={{ fontSize: 24, marginBottom: 12, lineHeight: 1.2 }}>{news.title}</h3>
            <p style={{ fontSize: 16, marginBottom: 12, color: colors.textSecondary }}>
              {news.description || news.content}
            </p>
            <p style={{ fontSize: 14, color: colors.textSecondary, fontStyle: "italic" }}>
              {news.source?.name} | {new Date(news.publishedAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Vulnerabilities() {
  const [packageName, setPackageName] = React.useState("jinja2");
  const [version, setVersion] = React.useState("2.4.1");
  const [ecosystem, setEcosystem] = React.useState("PyPI");
  const [company, setCompany] = React.useState("");
  const [severityFilter, setSeverityFilter] = React.useState("");

  const [vulnerabilities, setVulnerabilities] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    async function fetchVulnerabilities() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(BACKEND_PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageName, version, ecosystem, company, severityFilter }),
        });
        if (!response.ok) throw new Error("Failed to fetch vulnerabilities");
        const data = await response.json();
        setVulnerabilities(data.vulns || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchVulnerabilities();
  }, [packageName, version, ecosystem, company, severityFilter]);

  // Truncate utility for text overflow
  const truncateText = (text, maxLength = 100) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
  };

  // Parse CVSS v3 vector string into beginner-friendly descriptions
  function parseCvssSeverity(severityArr) {
    if (!Array.isArray(severityArr)) return "Severity data not available";
    const cvssV3 = severityArr.find((s) => s.type === "CVSS_V3" || s.type === "CVSS_V3.1");
    if (!cvssV3) return "Severity data not available";

    const parts = cvssV3.score.split("/");
    const baseScorePart = parts.find((p) => p.startsWith("CVSS:")) || "";
    const metrics = parts
      .slice(1)
      .map((p) => {
        const [k, v] = p.split(":");
        switch (k) {
          case "AV":
            return `Attack Vector: ${vectorMap(v)}`;
          case "AC":
            return `Attack Complexity: ${complexityMap(v)}`;
          case "PR":
            return `Privileges Required: ${privilegesMap(v)}`;
          case "UI":
            return `User Interaction: ${userInteractionMap(v)}`;
          case "S":
            return `Scope: ${scopeMap(v)}`;
          case "C":
            return `Confidentiality Impact: ${impactMap(v)}`;
          case "I":
            return `Integrity Impact: ${impactMap(v)}`;
          case "A":
            return `Availability Impact: ${impactMap(v)}`;
          default:
            return p;
        }
      })
      .join("\n");
    return [baseScorePart, metrics].join("\n");
  }

  const vectorMap = (v) => ({
    N: "Network",
    A: "Adjacent Network",
    L: "Local",
    P: "Physical",
  }[v] || v);
  const complexityMap = (v) => ({
    L: "Low",
    H: "High",
  }[v] || v);
  const privilegesMap = (v) => ({
    N: "None",
    L: "Low",
    H: "High",
  }[v] || v);
  const userInteractionMap = (v) => ({
    N: "None",
    R: "Required",
  }[v] || v);
  const scopeMap = (v) => ({
    U: "Unchanged",
    C: "Changed",
  }[v] || v);
  const impactMap = (v) => ({
    N: "None",
    L: "Low",
    H: "High",
  }[v] || v);

  const notesStyle = {
    flex: "0 0 300px",
    maxWidth: "300px",
    minWidth: "240px",
    marginTop: "200px",
    top: 24,
    marginLeft: "auto",
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 20,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 1.5,
    height: "fit-content",
    boxSizing: "border-box",
  };

  const inputStyle = {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
  };

  const selectStyle = { ...inputStyle, appearance: "none", cursor: "pointer" };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 40,
        padding: "20px 10px",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        backgroundColor: colors.background,
        minHeight: "80vh",
      }}
    >
      <main
        style={{
          flex: "1 1 500px",
          maxWidth: "700px",
          minWidth: "320px",
        }}
      >
        <div
  className="center"
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",    // or a fixed height like "200px" or "300px" depending on context
    minHeight: 200,    // ensures it has some height to center within
    width: "200%",
  }}
>
  <h2 style={{ fontSize: 28, marginBottom: 20, color: colors.primary }}>
    Vulnerabilities for {packageName} version {version} ({ecosystem})
  </h2>

  <div style={{ display: "flex", justifyContent: "center", marginBottom: 30, width: "100%" }}>
    <form
      onSubmit={(e) => e.preventDefault()}
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        maxWidth: 900,
        width: "100%",
        justifyContent: "center",
      }}
    >
      {/* inputs - fix max widths */}
      <input
        type="text"
        value={packageName}
        onChange={(e) => setPackageName(e.target.value)}
        placeholder="Package Name"
        required
        style={{ flexBasis: 180, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
      />
      <input
        type="text"
        value={version}
        onChange={(e) => setVersion(e.target.value)}
        placeholder="Version"
        required
        style={{ flexBasis: 120, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
      />
      <input
        type="text"
        value={ecosystem}
        onChange={(e) => setEcosystem(e.target.value)}
        placeholder="Ecosystem"
        required
        style={{ flexBasis: 140, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
      />

      <button
        type="submit"
        style={{
          flexBasis: 120,
          backgroundColor: colors.primary,
          color: colors.textPrimary,
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: 16,
          transition: "background-color 0.2s ease",
          userSelect: "none",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.primaryDark)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.primary)}
      >
        Search
      </button>
    </form>
  </div>
</div>


        {loading && <p style={{ color: colors.textSecondary }}>Loading vulnerabilities...</p>}
        {error && <p style={{ color: colors.error }}>{error}</p>}
        {!loading && vulnerabilities.length === 0 && <p style={{ color: colors.textSecondary }}>No vulnerabilities found.</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {vulnerabilities.map((vuln) => {
            const cvssSummary = parseCvssSeverity(vuln.severity);

            return (
              <article
                key={vuln.id}
                style={{
                  ...cardStyle,
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                }}
              >
                <h3 style={{ margin: 0, marginBottom: 10, color: colors.primary }}>
                  <a
                    href={`https://osv.dev/vulnerability/${vuln.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none", color: colors.primary }}
                  >
                    {vuln.id}
                  </a>
                </h3>
                <p style={{ fontSize: 16, marginBottom: 8 }}>
                  <strong>Description:</strong> {truncateText(vuln.summary || "No summary available.")}
                </p>
                <p
                  style={{
                    whiteSpace: "pre-line",
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 8,
                    fontStyle: "italic",
                  }}
                >
                  <strong>Impact Details:</strong>
                  {"\n" + (cvssSummary || "Not available")}
                </p>
                {vuln.published && (
                  <p style={{ fontSize: 16, marginBottom: 8 }}>
                    <strong>Published Date:</strong> {new Date(vuln.published).toLocaleDateString()}
                  </p>
                )}
                {vuln.references && vuln.references.length > 0 && (
                  <div style={{ fontSize: 16 }}>
                    <strong>References:</strong>
                    <ul style={{ margin: "8px 0 0 20px", wordBreak: "break-word" }}>
                      {vuln.references.map((ref, i) => {
                        const displayedUrl = ref.url.length > 60 ? ref.url.slice(0, 157) + "…" : ref.url;
                        return (
                          <li key={i}>
                            <a href={ref.url} target="_blank" rel="noopener noreferrer" title={ref.url} style={{ color: colors.primary }}>
                              {displayedUrl}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </main>

      <aside style={notesStyle}>
        <h3 style={{ color: colors.primary, marginTop: 0, marginBottom: 12 }}>How to Read Vulnerabilities</h3>
        <p><strong>Vulnerability ID:</strong> Unique ID for this vulnerability (e.g., GHSA-462w-v97r-4m45).</p>
        <p><strong>Description:</strong> A summary explaining what this vulnerability is and how it affects software.</p>
        <p><strong>Impact Details:</strong> Detailed info about attack vector, complexity, privileges, user interaction, scope, and impact on confidentiality, integrity, and availability.</p>
        <p><strong>Published Date:</strong> When this vulnerability was officially disclosed.</p>
        <p><strong>References:</strong> External, trusted links providing more information or patches.</p>
        <p>This dashboard helps you assess software risk and decide on updates or patches.</p>
      </aside>
    </div>
  );
}

function Navigation() {
  const location = useLocation();
  const linkStyle = { marginRight: 30, textDecoration: "none", fontWeight: "700", fontSize: 18, color: colors.textPrimary };
  const activeStyle = {
    color: colors.primary,
    borderBottom: `3px solid ${colors.primary}`,
    paddingBottom: 4,
    transition: "all 0.3s ease",
  };

  return (
    <nav
      style={{
        padding: "20px 40px",
        borderBottom: `2px solid ${colors.border}`,
        marginBottom: 40,
        backgroundColor: colors.surface,
        fontWeight: 600,
        fontSize: 20,
      }}
    >
      <Link to="/news" style={{ ...linkStyle, ...(location.pathname === "/news" ? activeStyle : {}) }}>
        News
      </Link>
      <Link to="/vulnerabilities" style={{ ...linkStyle, ...(location.pathname === "/vulnerabilities" ? activeStyle : {}) }}>
        Vulnerabilities
      </Link>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div
  style={{
    maxWidth: 1440,       // Increased maxWidth
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: colors.textPrimary,
    backgroundColor: colors.background,
    minHeight: "100vh",
    paddingBottom: "40px",
    paddingLeft: 24,      // Increased padding left/right for breathing room
    paddingRight: 24,
  }}
>
        <h1
          style={{
            textAlign: "center",
            paddingTop: 30,
            paddingBottom: 20,
            color: colors.primary,
            fontWeight: 900,
            fontSize: 44,
            letterSpacing: 1.1,
          }}
        >
          Spider Dashboard
        </h1>
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate replace to="/news" />} />
          <Route path="/news" element={<News />} />
          <Route path="/vulnerabilities" element={<Vulnerabilities />} />
        </Routes>
      </div>
    </Router>
  );
}
