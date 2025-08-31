import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";

const NEWS_API_KEY = "9ec3cd1c0603415fa22623a3313343bf";
const NEWS_API_URL =
  `https://newsapi.org/v2/everything?` +
  `q=cybersecurity OR "cyber security" OR hacking OR "data breach" OR "information security"&` +
  `language=en&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;

const BACKEND_PROXY_URL = "http://localhost:4000/api/vulnerabilities"; // Your backend proxy for vulnerabilities

function extractCvssInfo(metrics) {
  if (!metrics) return {};
  const cvssV3 = metrics["cvssV3"];
  const cvssV2 = metrics["cvssV2"];
  if (cvssV3) {
    return {
      score: cvssV3.baseScore,
      severity: cvssV3.baseSeverity,
      attackVector: cvssV3.attackVector,
    };
  } else if (cvssV2) {
    return {
      score: cvssV2.baseScore,
      severity: cvssV2.severity,
      attackVector: cvssV2.accessVector,
    };
  }
  return {};
}

const cardStyle = {
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  backgroundColor: "#fff",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  cursor: "pointer",
  padding: "20px",
  marginBottom: "30px",
  color: "#222",
  textDecoration: "none",
};

const cardHoverStyle = {
  transform: "translateY(-5px)",
  boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
};

function News() {
  const [newsList, setNewsList] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Function to get random cybersecurity-related image from Unsplash
  const getRandomCybersecurityImage = () => {
    return `https://source.unsplash.com/random/600x460/?cybersecurity,technology,computer,security,hacking`;
  };

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
    <div style={{ padding: "30px 40px", backgroundColor: "#f9f9f9" }}>
      <h2 style={{ fontSize: "36px", fontWeight: "700", marginBottom: "40px", color: "#0056b3" }}>
        Latest Cybersecurity News
      </h2>
      {loading && <p style={{ fontSize: "20px" }}>Loading news...</p>}
      {error && <p style={{ color: "red", fontSize: "20px" }}>{error}</p>}
      {!loading && newsList.length === 0 && <p style={{ fontSize: "20px" }}>No news articles found.</p>}

      {newsList.map((news, i) => (
        <div
          key={i}
          style={{
            marginBottom: "20px",
            borderBottom: "1px solid #ddd",
            paddingBottom: "15px",
            display: "flex",
            gap: "15px",
          }}
        >
          <img
            src={news.urlToImage || getRandomCybersecurityImage()}
            alt="news"
            style={{ width: 150, height: 100, objectFit: "cover", borderRadius: "6px" }}
            loading="lazy"
          />
          <div style={{ flexGrow: 1 }}>
            <h3 style={{ fontSize: "28px", marginBottom: "15px", color: "#004080", lineHeight: 1.2 }}>
              {news.title}
            </h3>
            <p style={{ fontSize: "18px", color: "#222", marginBottom: "15px" }}>
              {news.description || news.content}
            </p>
            <p style={{ fontSize: "16px", color: "#666", fontStyle: "italic" }}>
              {news.source?.name} | {new Date(news.publishedAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Vulnerabilities() {
  const [vulnerabilities, setVulnerabilities] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [hoverIndex, setHoverIndex] = React.useState(null);

  const placeholderVulnImage = "https://via.placeholder.com/400x200?text=No+Image";

  React.useEffect(() => {
    async function fetchVulnerabilities() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(BACKEND_PROXY_URL);
        if (!response.ok) throw new Error("Failed to fetch vulnerabilities");
        const data = await response.json();
        setVulnerabilities(data.result?.CVE_Items || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchVulnerabilities();
  }, []);

  return (
    <div style={{ padding: "30px 40px", backgroundColor: "#f9f9f9" }}>
      <h2 style={{ fontSize: "36px", fontWeight: "700", marginBottom: "40px", color: "#0056b3" }}>
        Recent Vulnerabilities
      </h2>
      {loading && <p style={{ fontSize: "20px" }}>Loading vulnerabilities...</p>}
      {error && <p style={{ color: "red", fontSize: "20px" }}>{error}</p>}
      {!loading && vulnerabilities.length === 0 && <p style={{ fontSize: "20px" }}>No vulnerabilities found.</p>}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "30px",
          justifyContent: "center",
        }}
      >
        {vulnerabilities.map((item, i) => {
          const isHovered = i === hoverIndex;
          const cve = item.cve;
          const cveId = cve.CVE_data_meta.ID;
          let description = cve.description.description_data[0]?.value || "No description available";
          if (description.length > 180) {
            description = description.slice(0, 177) + "...";
          }
          const { score, severity, attackVector } = extractCvssInfo(item.impact?.baseMetricV3 || item.impact?.baseMetricV2);

          return (
            <div
              key={cveId}
              style={{
                ...cardStyle,
                ...(isHovered ? cardHoverStyle : {}),
                width: "400px",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#fff",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <img
                src={placeholderVulnImage}
                alt="vulnerability"
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  marginBottom: "15px",
                  boxShadow: "0 3px 12px rgba(0,0,0,0.15)",
                }}
                loading="lazy"
                draggable={false}
              />
              <h3 style={{ fontSize: "24px", marginBottom: "12px", color: "#004080" }}>
                <a
                  href={`https://nvd.nist.gov/vuln/detail/${cveId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", color: "#007acc" }}
                >
                  {cveId}
                </a>
              </h3>
              <p style={{ fontSize: "18px", color: "#333", flexGrow: 1, marginBottom: "20px", lineHeight: "1.4" }}>
                {description}
              </p>

              <div style={{ fontSize: "16px", color: "#555" }}>
                <p>
                  <strong>CVSS Score:</strong> {score ?? "N/A"}
                </p>
                <p>
                  <strong>Severity:</strong> {severity ?? "N/A"}
                </p>
                <p>
                  <strong>Attack Vector:</strong> {attackVector ?? "N/A"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Navigation() {
  const location = useLocation();
  const linkStyle = { marginRight: 30, textDecoration: "none", fontWeight: "700", fontSize: "18px" };
  const activeStyle = {
    color: "#007acc",
    borderBottom: "3px solid #007acc",
    paddingBottom: "4px",
    transition: "all 0.3s ease",
  };

  return (
    <nav
      style={{
        padding: "20px 40px",
        borderBottom: "2px solid #ccc",
        marginBottom: "40px",
        backgroundColor: "#f0f8ff",
        fontWeight: "600",
        fontSize: "20px",
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
          maxWidth: 1024,
          margin: "0 auto",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          color: "#222",
          paddingBottom: "40px",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            paddingTop: "30px",
            paddingBottom: "20px",
            color: "#0056b3",
            fontWeight: "900",
            fontSize: "44px",
            letterSpacing: "1.1px",
          }}
        >
          Cybersecurity Dashboard
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
