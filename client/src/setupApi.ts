const API_BASE = "https://c7dd138c-576d-4490-a426-c0be6e6124ca-00-1u3lut3kqrgq6.kirk.replit.dev";

// Save the original fetch
const originalFetch = window.fetch;

// Override global fetch
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = typeof input === "string" ? input : input.toString();

  // If it starts with "/api/", prepend the backend base URL
  if (url.startsWith("/api/")) {
    url = `${API_BASE}${url}`;
  }

  // Optional: Log requests for debugging
  console.log("📡 Fetching:", url);

  // Pass to original fetch
  return originalFetch(url, init);
};

console.log("✅ Global API base set to:", API_BASE);
