import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import session from "express-session";

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const CALLBACK_URL =
  process.env.CALLBACK_URL || "http://localhost:3001/auth/discogs/callback";
const USER_AGENT = "SimpleDiscogsLoginApp/1.0";

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-only-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" }
  })
);

function oauthHeader(values) {
  return (
    "OAuth " +
    Object.entries(values)
      .map(([key, value]) => `${key}="${encodeURIComponent(value)}"`)
      .join(", ")
  );
}

app.get("/auth/discogs", async (req, res) => {
  try {
    const response = await fetch("https://api.discogs.com/oauth/request_token", {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
        Authorization: oauthHeader({
          oauth_consumer_key: process.env.DISCOGS_CONSUMER_KEY,
          oauth_nonce: crypto.randomUUID(),
          oauth_signature: `${process.env.DISCOGS_CONSUMER_SECRET}&`,
          oauth_signature_method: "PLAINTEXT",
          oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
          oauth_callback: CALLBACK_URL
        })
      }
    });

    const body = await response.text();
    if (!response.ok) throw new Error(`Request token failed: ${response.status} ${body}`);

    const data = new URLSearchParams(body);
    req.session.requestToken = data.get("oauth_token");
    req.session.requestTokenSecret = data.get("oauth_token_secret");

    res.redirect(
      `https://www.discogs.com/oauth/authorize?oauth_token=${encodeURIComponent(
        req.session.requestToken
      )}`
    );
  } catch (error) {
    console.error(error);
    res.redirect(`${CLIENT_URL}/?login=error`);
  }
});

app.get("/auth/discogs/callback", async (req, res) => {
  try {
    const { oauth_token, oauth_verifier } = req.query;

    if (!oauth_token || !oauth_verifier || oauth_token !== req.session.requestToken) {
      throw new Error("Missing or invalid OAuth callback parameters.");
    }

    const response = await fetch("https://api.discogs.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
        Authorization: oauthHeader({
          oauth_consumer_key: process.env.DISCOGS_CONSUMER_KEY,
          oauth_nonce: crypto.randomUUID(),
          oauth_token,
          oauth_signature:
            `${process.env.DISCOGS_CONSUMER_SECRET}&${req.session.requestTokenSecret}`,
          oauth_signature_method: "PLAINTEXT",
          oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
          oauth_verifier
        })
      }
    });

    const body = await response.text();
    if (!response.ok) throw new Error(`Access token failed: ${response.status} ${body}`);

    const data = new URLSearchParams(body);
    req.session.accessToken = data.get("oauth_token");
    req.session.accessTokenSecret = data.get("oauth_token_secret");

    delete req.session.requestToken;
    delete req.session.requestTokenSecret;

    res.redirect(`${CLIENT_URL}/?login=success`);
  } catch (error) {
    console.error(error);
    res.redirect(`${CLIENT_URL}/?login=error`);
  }
});

app.get("/api/me", async (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const response = await fetch("https://api.discogs.com/oauth/identity", {
      headers: {
        "User-Agent": USER_AGENT,
        Authorization: oauthHeader({
          oauth_consumer_key: process.env.DISCOGS_CONSUMER_KEY,
          oauth_nonce: crypto.randomUUID(),
          oauth_token: req.session.accessToken,
          oauth_signature:
            `${process.env.DISCOGS_CONSUMER_SECRET}&${req.session.accessTokenSecret}`,
          oauth_signature_method: "PLAINTEXT",
          oauth_timestamp: Math.floor(Date.now() / 1000).toString()
        })
      }
    });

    const text = await response.text();
    res.status(response.status).type("application/json").send(text);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
