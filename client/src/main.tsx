import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force set favicon with data URI - bypasses all caching issues
const setFavicon = () => {
  // Remove existing favicons
  const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
  existingFavicons.forEach(favicon => favicon.remove());
  
  // MyKliq logo as data URI - black background with green person + plus
  const faviconDataUri = "data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='32' height='32' fill='%23000000'/%3E%3Cg stroke='%2300ff00' stroke-width='2' fill='none'%3E%3Ccircle cx='16' cy='10' r='3'/%3E%3Cpath d='M10 22 L10 18 Q10 15 13 15 L19 15 Q22 15 22 18 L22 22'/%3E%3Cpath d='M24 8 L24 16 M20 12 L28 12'/%3E%3C/g%3E%3C/svg%3E";
  
  // Add favicon
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/svg+xml';
  favicon.href = faviconDataUri;
  document.head.appendChild(favicon);
  
  // Add shortcut icon
  const shortcutIcon = document.createElement('link');
  shortcutIcon.rel = 'shortcut icon';
  shortcutIcon.type = 'image/svg+xml';
  shortcutIcon.href = faviconDataUri;
  document.head.appendChild(shortcutIcon);
};

// Set favicon on load
setFavicon();

createRoot(document.getElementById("root")!).render(<App />);
