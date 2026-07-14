# Bill Scanner

Bill Scanner is a full-stack web application designed to help you securely store, manage, and search your bills and receipts directly within your personal Google Drive. 

## Features

- **Google Drive Integration:** Authenticates and securely uploads your files to a dedicated folder in Google Drive.
- **Search & Filtering:** Easily search bills by person name, start date, and end date.
- **Vercel Ready:** Pre-configured to support serverless deployment on Vercel.
- **Modern UI:** Built with Vite, React, and Tailwind CSS.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide React
- **Backend:** Node.js, Express, Multer, Google APIs (Drive)
- **Deployment:** Vercel (Configured via `vercel.json`)

## Local Development Setup

### 1. Prerequisites
- Node.js installed on your machine.
- A Google Cloud Project with the **Google Drive API** enabled.
- OAuth 2.0 Client IDs generated (Web application) in Google Cloud Console. 

### 2. Google Credentials
1. Download your OAuth 2.0 Client ID JSON file from Google Cloud.
2. Rename the file to `credentials.json` and place it in the `server/` directory.
3. Ensure your Authorized redirect URIs in Google Cloud include `http://localhost:5000/api/auth/callback`.

### 3. Installation
Install the required dependencies for both the frontend and backend from the root directory:
```bash
npm run install:all
```

### 4. Running the App
You can start both the frontend and backend concurrently.

**For Windows Users:**
Simply double-click the `start.bat` file located in the root directory.

**Using NPM:**
Run the following command from the root directory:
```bash
npm start
```
The application will be available at `http://localhost:5173`.

## Deployment to Vercel

This repository is pre-configured to be deployed on Vercel.

1. Import this repository into your Vercel Dashboard.
2. In the deployment settings, add the following Environment Variables:
   - `GOOGLE_CREDENTIALS`: Paste the exact string contents of your local `server/credentials.json`.
   - `GOOGLE_TOKEN`: Paste the exact string contents of your local `server/token.json` (generate this by running and authenticating locally first).
   - `REDIRECT_URI`: Set to your Vercel production URL (e.g., `https://your-app-name.vercel.app/api/auth/callback`). Make sure to add this URL to your Authorized redirect URIs in Google Cloud.
3. Deploy! Vercel will automatically use the root `vercel.json` to build and route the project correctly.

## Note
Do NOT commit your `credentials.json`, `token.json`, or `.env` files. They are automatically ignored via `.gitignore` for your security.
