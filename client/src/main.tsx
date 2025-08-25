import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Generate MyKliq favicon with canvas - most reliable method
const setFavicon = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('Could not get canvas context');
    return;
  }
  
  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 32, 32);
  
  // Green person outline
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;
  
  // Head (circle)
  ctx.beginPath();
  ctx.arc(16, 10, 3, 0, 2 * Math.PI);
  ctx.stroke();
  
  // Body (rectangle)
  ctx.beginPath();
  ctx.rect(10, 15, 12, 7);
  ctx.stroke();
  
  // Plus sign
  ctx.beginPath();
  ctx.moveTo(24, 8);
  ctx.lineTo(24, 16);
  ctx.moveTo(20, 12);
  ctx.lineTo(28, 12);
  ctx.stroke();
  
  // Convert to data URL and set as favicon
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.href = canvas.toDataURL('image/png');
  document.head.appendChild(favicon);
  
  console.log('MyKliq favicon set with canvas');
};

setFavicon();

createRoot(document.getElementById("root")!).render(<App />);
