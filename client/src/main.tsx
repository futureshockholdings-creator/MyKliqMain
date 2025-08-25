import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force set favicon - browsers cache these heavily
const setFavicon = () => {
  // Remove existing favicons
  const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
  existingFavicons.forEach(favicon => favicon.remove());
  
  // Add new favicon
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/svg+xml';
  favicon.href = '/favicon.svg?' + Date.now();
  document.head.appendChild(favicon);
  
  // Fallback ICO
  const faviconIco = document.createElement('link');
  faviconIco.rel = 'shortcut icon';
  faviconIco.type = 'image/x-icon';
  faviconIco.href = '/favicon.ico?' + Date.now();
  document.head.appendChild(faviconIco);
};

// Set favicon on load
setFavicon();

createRoot(document.getElementById("root")!).render(<App />);
