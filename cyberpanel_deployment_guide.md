# Cyberpanel (OpenLiteSpeed) Production Deployment Guide

This guide provides step-by-step instructions for deploying the **NKYLUXURY** full-stack MERN application on your Cyberpanel VPS hosting environment.

---

## Architecture Overview

```mermaid
graph TD
    Client[Client Browser] -->|Static Requests / Pages| OLS[OpenLiteSpeed Server]
    Client -->|API Requests /api/*| OLS
    OLS -->|Serves Static Files| Static[React Build Assets /public_html]
    OLS -->|Reverse Proxy /api/*| PM2[Node.js Express Backend :5000]
    PM2 -->|Stores Data| DB[(MongoDB Atlas Cloud)]
    PM2 -->|Fetches Payments| Paystack[Paystack Payment API]
    PM2 -->|Uploads Images| Cloudinary[Cloudinary CDN]
    PM2 -->|Sends Emails| SMTP[Gmail SMTP Gateway]
```

---

## Phase 1: Compile & Deploy React Frontend

The React frontend compiles into static HTML, CSS, and JS files. OpenLiteSpeed serves these static files natively, which provides maximum speed and performance.

### 1. Configure Frontend Production Environment
Create a production `.env` file inside the `NK-frontend` project directory, or update the existing one:
```env
VITE_API_URL=https://nkylux.com/api
```
*(Replace `nkylux.com` with the actual domain name of the owner)*

### 2. Build the Static Bundle
Run the following build command in your local terminal:
```bash
npm run build
```
This generates a compiled production bundle inside the `dist/` directory.

### 3. Upload Assets to Cyberpanel
1. Open your Cyberpanel dashboard, navigate to **Websites** -> **List Websites** -> **Manage** (`nkylux.com`).
2. Open the **File Manager** and enter the `public_html/` folder.
3. Upload all the contents of your local `dist/` folder directly into `public_html/`.

### 4. Configure React Router Rewrite Rules
React uses client-side routing. If a user refreshes a page (e.g. `/shop`), OpenLiteSpeed will return a 404 unless we rewrite requests to `index.html`.

In the Cyberpanel domain management panel, click on **Rewrite Rules** and paste the following OLS rules:
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```
Click **Save**.

---

## Phase 2: Deploy Node.js Express Backend

The backend runs persistently on the server port `5000` under the management of PM2.

### 1. Upload Backend Source Code
Upload the `NK-backend` files to the VPS (e.g. into `/home/nkyluxury-backend` or `/home/domain.com/backend`).
> [!IMPORTANT]
> Do NOT upload the `node_modules` folder. The dependencies must be installed clean on the server itself.

### 2. Configure Production `.env` on Server
Create a `.env` file in the backend root directory on your server:
```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://nkylux.com

# MongoDB Database Connection
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.mongodb.net/nkyluxury?retryWrites=true&w=majority

# JWT Authentication Configuration
JWT_SECRET=your_highly_secure_long_random_key_string
JWT_EXPIRE=30d

# Cloudinary CDN Configuration
CLOUDINARY_CLOUD_NAME=ditqrzton
CLOUDINARY_API_KEY=134454299293665
CLOUDINARY_API_SECRET=_rCURLRjIE5oBFPERcD7bPtDnn8

# Email Configuration (NKYLUXURY Gmail SMTP App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=owner_email@gmail.com
EMAIL_PASS=owner_16_letter_gmail_app_password
EMAIL_FROM="NKYLUXURY <owner_email@gmail.com>"

# Paystack API Keys
PAYSTACK_PUBLIC_KEY=live_pk_xxxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=live_sk_xxxxxxxxxxxxxx
```
> [!TIP]
> The Paystack owner should log in to their Paystack Dashboard, grab their **Live Public Key** and **Live Secret Key**, and paste them here. If these are left blank, checkout processes automatically run in a safe **Mock Sandbox Mode** for testing.

### 3. Install Dependencies on VPS
SSH into your server terminal, navigate to the backend folder, and run:
```bash
npm install --production
```

---

## Phase 3: Setup Backend Daemon via PM2

PM2 ensures the server starts automatically and stays online 24/7.

### 1. Install PM2 Globally
Run on the VPS server command line:
```bash
npm install -g pm2
```

### 2. Launch the Application Process
Start the server process:
```bash
pm2 start server.js --name "nkyluxury-backend"
```

### 3. Setup Persistent Startup
Ensure the process restarts when the server boots up:
```bash
pm2 startup
```
This command generates a configuration command. Copy and run the exact output command printed in your VPS terminal.
After running it, save the current processes configuration:
```bash
pm2 save
```

### 4. PM2 Cheat Sheet
- **Check Status**: `pm2 status`
- **View Logs**: `pm2 logs nkyluxury-backend`
- **Restart Backend**: `pm2 restart nkyluxury-backend`
- **Stop Backend**: `pm2 stop nkyluxury-backend`

---

## Phase 4: Configure OpenLiteSpeed Reverse Proxy

We must tell OpenLiteSpeed to route any backend API requests (`https://nkylux.com/api/*`) directly to our PM2 instance running on port `5000`.

### Option A: Proxy Rewrite Rule (Recommended & Easiest)
In Cyberpanel -> Websites -> Manage -> **Rewrite Rules**, append this proxy rule right after your React rewrite rules:
```apache
RewriteRule ^api/(.*)$ http://127.0.0.1:5000/api/$1 [P,L]
```
The `[P]` flag instructs OpenLiteSpeed to proxy the request in the background.

### Option B: LiteSpeed WebAdmin Console Context
If your OpenLiteSpeed build does not support inline proxy rewrite rules:
1. Log in to the **OpenLiteSpeed WebAdmin Console** (typically on port `7080`, e.g. `https://your-ip:7080`).
2. Go to **Virtual Hosts** -> select your domain.
3. Click on the **External App** tab and add a new App:
   - **Type**: Web Server
   - **Name**: `nk-express-backend`
   - **Address**: `http://127.0.0.1:5000`
4. Go to the **Context** tab and click `+` to add a Context:
   - **Type**: Proxy
   - **URI**: `/api/`
   - **External App**: Select `nk-express-backend`
5. Perform a Graceful Restart of the LiteSpeed Server.
