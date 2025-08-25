import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Update page title dynamically for better tab recognition
document.title = '[MK] MyKliq';

createRoot(document.getElementById("root")!).render(<App />);
