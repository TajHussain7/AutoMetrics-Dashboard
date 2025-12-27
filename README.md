# AutoMetrics Travel Data Dashboard

## Overview

AutoMetrics Travel Data Dashboard is a modern web application designed to streamline the management, analysis, and visualization of travel-related data for organizations and agencies. The platform provides a secure, user-friendly interface for uploading, processing, and exploring travel data, empowering users to make data-driven decisions with ease.

## Key Features

- **Comprehensive Dashboard:** Visualize key metrics such as total bookings, revenue, profit, and agent activity in real time.
- **Data Management:** Upload, view, edit, and manage travel data efficiently with advanced filtering and sorting capabilities.
- **Analytics Hub:** Access interactive charts and analytics to uncover trends and insights from your travel data.
- **Export Center:** Export processed data in various formats for reporting and further analysis.
- **User Management:** Role-based access control for administrators and users, including support for announcements and feedback.
- **Secure File Handling:** All data transfers are encrypted, and files are automatically deleted after processing unless saved by the user.
- **Audit & History:** Track upload history and recent activity for transparency and compliance.
- **Responsive Design:** Optimized for both desktop and mobile devices.

## Technology Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express, MongoDB
- **APIs:** RESTful endpoints for data operations and user management
- **Security:** End-to-end encryption, regular audits, and compliance monitoring

## Getting Started

1. **Clone the repository:**
   ```sh
   git clone <repository-url>
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment variables:**
   - Set up your MongoDB connection and other required environment variables as described in the project documentation.
   - Optionally set the announcements WebSocket URL for client builds using the Vite env var `VITE_ANNOUNCEMENTS_WS_URL` (defaults to `ws://localhost:8081` for local development).
4. **Run the development server:**
   ```sh
   npm run dev
   ```
5. **Access the dashboard:**
   - Open your browser and navigate to `http://localhost:5173` (or the configured port).

## Usage

- **Upload Data:** Use the dashboard to upload travel data files. Supported formats and templates are described in the documentation.
- **Analyze & Visualize:** Explore summary cards, charts, and tables to gain insights from your data.
- **Export:** Download processed data for reporting or further analysis.
- **User Roles:** Admins can manage users, announcements, and review feedback.

## Feedback & Support

For questions, feedback, or support, please use the feedback feature within the dashboard or contact the project maintainers.

## Deploying on Render (Serve frontend from backend) ✅

If you want the backend to serve the built frontend (single Render service), follow these steps:

1. Create a **Web Service** in Render and point it at the **repository root** (not the `api` folder).
2. Set the **Build Command** to:
   ```sh
   npm ci && npm run build
   ```
   - This runs the Vite client build (`dist/public`) and compiles the server (`dist/api/app.js`).
3. Set the **Start Command** to:

   ```sh
   npm start
   ```

   - `npm start` runs `node dist/api/app.js` (the server will serve static files from `dist/public` in production).

   **Note:** If you'd prefer to run the TypeScript server directly (skip compiling with `tsc`), you can use `tsx` in production. To do that on Render, set the environment variable `NPM_CONFIG_PRODUCTION=false` so devDependencies (like `tsx`) are installed, and set the Start Command to:

   ```sh
   tsx api/app.ts
   ```

   Alternatively, compile the server separately with `npm run build:server` and keep the Start Command as `npm start`.

4. Add required **Environment Variables** in Render (Environment → Environment Variables):
   - `NODE_ENV=production`
   - `MONGODB_URI` — your MongoDB connection string
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD` — to provision the default admin user
   - `FRONTEND_URL` — set to `https://<your-render-url>` (used by the server CORS config; if frontend is served from the same host, use that URL)
5. Deploy the service and monitor the build logs. The build should create `dist/public` (client assets) and `dist/api/app.js` (compiled server).

**Notes:**

- Serving the client from the same origin simplifies auth and cookies (no cross-origin cookies needed).
- If the build fails with a missing `dist/public`, ensure the build command ran successfully and that `vite build` completes without errors.

---

_This project is intended for professional use. Please ensure you follow your organization's data privacy and security guidelines when deploying or using this application._
