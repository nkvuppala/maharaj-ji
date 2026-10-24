# Maharaj-ji Speaks • Deployment & Hosting Guide (maharaja-ji.com)

## Target Host Architecture: `maharaja-ji.com`
- **Domain**: `maharaja-ji.com`
- **Host**: **InMotion Hosting, Inc.** (IP: `192.249.121.132`)
- **Web Server**: **Apache** with cPanel management

This project has been specifically configured to deploy seamlessly onto Apache / cPanel / InMotion Hosting without requiring Vercel.

---

## 1. What's Included in This Zip Package
1. **`server.js`**: Standalone production Node.js HTTP server. Serves all static web assets with SPA fallback and automatically handles all API routes (`/api/groq/chat`, `/api/voyage/embed`, `/api/voyage/rerank`, `/api/groq/status`).
2. **`.env`**: Contains all live production API keys for Voyage AI (`voyage-4-large`, `rerank-3`) and Groq (`llama-3.3-70b-versatile` with 3 automatic fallback keys).
3. **`.htaccess`**: Ready-to-use Apache configuration for cPanel with Single-Page Application (SPA) routing, CORS headers, and reverse-proxy rules.
4. **`public/data/embeddings.json`**: Pre-computed 1024-dimension vector embeddings for the entire Maharaj-ji knowledge base.
5. **Full Source Code**: React + Vite frontend, soundscape audio synthesizer, and serverless proxy handlers.

---

## 2. Deployment Options on InMotion Hosting / cPanel

### Method A: cPanel "Setup Node.js App" (Recommended - Turnkey)
InMotion Hosting cPanel provides a native Node.js application manager powered by Phusion Passenger for Apache:

1. **Upload Files**:
   - Log in to your cPanel dashboard.
   - Open **File Manager** and upload `Maharaja-Web-App-Only.zip` to a directory (e.g. `/home/username/maharaja-app/`).
   - Extract the zip file in that folder.
2. **Create the Node.js Application**:
   - In cPanel, click **Setup Node.js App** (under Software).
   - Click **Create Application**.
   - **Node.js version**: Choose `20.x` (or `18.x`).
   - **Application mode**: `Production`.
   - **Application root**: `maharaja-app` (the folder where you extracted the files).
   - **Application URL**: `maharaja-ji.com` (select your domain from the dropdown).
   - **Application startup file**: `server.js`.
3. **Install Dependencies & Start**:
   - Click the **Run NPM Install** button in the cPanel Node.js interface.
   - Click **Start App**.
   - Your Apache server will now automatically forward `maharaja-ji.com` traffic directly to the Maharaj-ji web app!

---

### Method B: InMotion VPS / Dedicated / SSH with PM2
If you have SSH access to your InMotion server:

1. **Connect via SSH**:
   ```bash
   ssh username@maharaja-ji.com
   ```
2. **Navigate & Extract**:
   ```bash
   mkdir -p ~/apps/maharajji && cd ~/apps/maharajji
   unzip Maharaja-Web-App-Only.zip
   ```
3. **Install & Build**:
   ```bash
   npm install
   npm run build
   ```
4. **Launch with PM2**:
   ```bash
   npm install -g pm2
   PORT=3000 pm2 start server.js --name "maharajji-app"
   pm2 save
   pm2 startup
   ```
5. **Configure Apache `.htaccess` in `public_html`**:
   Ensure `public_html/.htaccess` contains:
   ```apache
   RewriteEngine On
   RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
   ```

---

### Method C: Cloudflare / Docker / VPS
If hosting in a container:
```bash
docker build -t maharajji .
docker run -d -p 3000:3000 --env-file .env --name maharajji maharajji
```

---

## 3. Verifying the Deployment
After starting the app, visit `https://maharaja-ji.com/`:
- **Chat**: Type a query like *"How to find inner peace?"* or *"Teach me about Kainchi Dham"*.
- **Guardrails**: Try asking about world politics or technology; the zero-token interceptor will return Maharaj-ji's loving spiritual deflection without consuming API quota.
- **Soundscapes**: Click the **Sound** tab in the top header and listen to offline Web Audio synthesis (Tanpura, Om, Kainchi Temple bells).
- **Japa**: Open the **Japa** tab to practice 108 bead mala meditation with voice and tap counting.
