import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "success") {
      setMessage("Logged in with Discogs successfully.");
      window.history.replaceState({}, "", "/");
    }
    if (params.get("login") === "error") {
      setMessage("Discogs login failed. Check the server terminal for details.");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  return (
    <main className="card">
      <h1>Discogs Login</h1>
      <p>Sign in on Discogs and authorize this app.</p>
      <button onClick={() => { window.location.href = "http://localhost:3001/auth/discogs"; }}>
        Login with Discogs
      </button>
      {message && <p className="message">{message}</p>}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
