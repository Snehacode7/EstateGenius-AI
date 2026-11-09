# EstateGenius AI — Autonomous PropTech OS

![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI_Engine-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![PayPal](https://img.shields.io/badge/PayPal-Sandbox_SDK-003087?style=for-the-badge&logo=paypal&logoColor=white)

An AI-powered, autonomous real estate orchestration platform combining spatial 3D property tours, dynamic lease agreement generation, and automated multi-tenant PayPal escrow checkouts.

---

## 🚀 Architectural Overview & Sponsor Integrations

EstateGenius AI leverages cutting-edge AI and payment infrastructure to automate end-to-end real estate transactions and property exploration:

### 1. 🤖 Google Gemini API (AI Orchestration)
- **Conversational Brokerage:** Powers the interactive AI real estate assistant for instant property inquiries, neighborhood insights, and dynamic pricing evaluation.
- **Dynamic Legal Lease Engine:** Automatically generates customized, legally formatted lease agreements based on tenant and landlord preferences.
- **Voice Capabilities:** Utilizes Gemini Live API features for real-time natural voice interactions during virtual property walkthroughs.

### 2. 💳 PayPal Developer Sandbox SDK (Escrow & Payments)
- **Multi-Tenant Rent Checkouts:** Seamless handling of security deposits, holding fees, and monthly rent checkouts.
- **Automated Escrow Workflow:** Simulates real estate escrow holding, releasing funds upon digital lease execution.
- **Developer Sandbox:** Integrated using client-side JavaScript SDK components (`VITE_PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_ID`) for sandbox testing environment.

### 3. ⚡ Vercel (Production Cloud Hosting)
- **Zero-Config Frontend Hosting:** Optimized deployment for static React/Vite build pipelines (`npm run build`).
- **Global Edge Network:** Lightning-fast asset delivery and sub-second route rendering.
- **Environment Vault:** Secure production variable management for Gemini API keys and PayPal credentials.

### 4. 🛠️ Additional Tools & Technologies
- **Frontend Stack:** React, Vite, TypeScript, Tailwind CSS
- **3D Visualization:** Three.js for interactive 3D property models and virtual walkthroughs
- **API Design & Testing:** Postman & APIMatic for API testing, specification validation, and SDK integration management

---

## ⚡ Deployment on Vercel

1. **Import Repository:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard) $\rightarrow$ Click **"Add New..."** $\rightarrow$ **"Project"**.
   - Select your GitHub repository: `Snehacode7/EstateGenius-AI`.

2. **Configure Build Settings (Auto-Detected by Vercel):**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

3. **Add Environment Variables in Vercel:**
   Expand the **Environment Variables** section and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_GEMINI_API_KEY` | *Your Google Gemini API Key* |
   | `GEMINI_API_KEY` | *Your Google Gemini API Key* |
   | `VITE_PAYPAL_CLIENT_ID` | *Your PayPal Sandbox Client ID* |

4. Click **Deploy**. Your app will be live in seconds with a production `.vercel.app` URL!

---

## ⚙️ Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Snehacode7/EstateGenius-AI.git](https://github.com/Snehacode7/EstateGenius-AI.git)
   cd EstateGenius-AI
