
const API_BASE = "https://c7dd138c-576d-4490-a426-c0be6e6124ca-00-1u3lut3kqrgq6.kirk.replit.dev";

const originalFetch = window.fetch;

window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  let url = typeof input === "string" ? input : input.toString();

  if (url.startsWith("/api/")) {
    url = `${API_BASE}${url}`;
  }

  // 👇 Ensure cookies + credentials are sent
  init.credentials = "include";

  console.log("📡 Fetching:", url);
  return originalFetch(url, init);
};

console.log("✅ Global API base set to:", API_BASE);
