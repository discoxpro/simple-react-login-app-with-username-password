# Simple React Discogs Login App

This is a deliberately small example of logging in to Discogs with **OAuth 1.0a**.

> Important: the React app does **not** ask for the user's Discogs password.
> The user signs in on Discogs itself. Discogs then authorizes this app and gives
> the backend OAuth credentials.

## What happens

1. You click **Login with Discogs**.
2. The Node server requests a temporary OAuth token from Discogs.
3. Your browser is sent to Discogs.
4. You sign in to Discogs and approve the app.
5. Discogs redirects back to the local Node server.
6. The server exchanges the verifier for an OAuth access token + secret.
7. The server keeps those credentials in your local session.
8. You can now make authenticated Discogs API requests.

## Requirements on macOS

Open **Terminal**.

Check whether Node.js and Git are installed:

```bash
node --version
npm --version
git --version
```

If `node` is missing, install the current Node.js LTS release first.
Node 18+ is required because this example uses Node's built-in `fetch`.

## 1. Get the project

If your GitHub repository is accessible:

```bash
git clone https://github.com/discoxpro/simple-react-login-app-with-username-password.git
cd simple-react-login-app-with-username-password
```

If you received this project as a ZIP instead, unzip it and then:

```bash
cd ~/Downloads/simple-react-login-app-with-username-password
```

Adjust the path if your browser saved it somewhere else.

## 2. Create a Discogs application

Sign in to Discogs in your browser and open **Developer Settings**.

Create an application and obtain:

- Consumer Key
- Consumer Secret

For local development, configure the callback URL as:

```text
http://localhost:3001/auth/discogs/callback
```

Never put the Consumer Secret in React/browser code and never commit it to Git.

## 3. Create your local environment file

From the project directory:

```bash
cp server/.env.example server/.env
```

Open it in the Terminal editor:

```bash
nano server/.env
```

Replace these values:

```text
DISCOGS_CONSUMER_KEY=replace_me
DISCOGS_CONSUMER_SECRET=replace_me
SESSION_SECRET=replace_with_any_long_random_string
```

For example, you can generate a session secret in another Terminal command:

```bash
openssl rand -hex 32
```

Keep these unchanged for local development:

```text
CALLBACK_URL=http://localhost:3001/auth/discogs/callback
CLIENT_URL=http://localhost:5173
PORT=3001
```

In `nano`, save with **Control+O**, press **Enter**, then exit with **Control+X**.

## 4. Install dependencies

Run:

```bash
npm install
npm run install:all
```

## 5. Start the app

Run:

```bash
npm run dev
```

You should see the backend on:

```text
http://localhost:3001
```

and Vite will normally show the React app on:

```text
http://localhost:5173
```

Open `http://localhost:5173` in your browser.

## 6. Log in

Click:

**Login with Discogs**

Your browser goes to Discogs. Sign in there using your normal Discogs username
and password and authorize the application.

Discogs redirects you back to the local application.

If successful, the page displays:

```text
Logged in with Discogs successfully.
```

## 7. Test the authenticated identity endpoint

After logging in, open this URL in the same browser:

```text
http://localhost:3001/api/me
```

You should receive the Discogs identity associated with the authenticated account.

## 8. Stop the app

Return to Terminal and press:

```text
Control+C
```

## Project structure

```text
simple-react-login-app-with-username-password/
├── README.md
├── package.json
├── .gitignore
├── client/
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       └── style.css
└── server/
    ├── .env.example
    ├── package.json
    └── index.js
```

## Security notes

- Do not collect the user's Discogs password in this app.
- Do not put `DISCOGS_CONSUMER_SECRET` in React code.
- Do not commit `server/.env`.
- This example uses the default in-memory Express session store because it is
  intended only as a simple local-development example.
- For a production app, use HTTPS, a persistent secure session store, secure
  cookies, proper error handling, and appropriate secret management.

## OAuth endpoints used

The app uses the Discogs OAuth 1.0a flow:

```text
GET  https://api.discogs.com/oauth/request_token
     ↓
https://www.discogs.com/oauth/authorize?oauth_token=...
     ↓
POST https://api.discogs.com/oauth/access_token
     ↓
GET  https://api.discogs.com/oauth/identity
```
