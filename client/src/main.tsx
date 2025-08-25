import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force favicon update
function updateFavicon() {
  const links = document.querySelectorAll("link[rel*='icon']");
  links.forEach(link => link.remove());
  
  const newFavicon = document.createElement('link');
  newFavicon.rel = 'icon';
  newFavicon.type = 'image/svg+xml';
  newFavicon.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' fill='%23000'/><g fill='%2300FF00'><circle cx='8' cy='6' r='2'/><rect x='7' y='8' width='2' height='3'/><rect x='5' y='9' width='6' height='1'/><rect x='7' y='3' width='2' height='1'/><rect x='5' y='4' width='6' height='1'/></g></svg>";
  document.head.appendChild(newFavicon);
}



// Update favicon when app loads
updateFavicon();

createRoot(document.getElementById("root")!).render(<App />);
