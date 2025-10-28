import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log('🚀 Main.tsx - Starting app initialization');
console.log('🌐 Environment variables:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE
});
console.log('🎯 Root element:', document.getElementById("root"));

createRoot(document.getElementById("root")!).render(<App />);
