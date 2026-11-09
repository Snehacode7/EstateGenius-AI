# EstateGenius-AI — Autonomous PropTech OS

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
- **Developer Sandbox:** Integrated using client-side JavaScript SDK components (`VITE_PAYPAL_CLIENT_ID`) for sandbox testing environment.

### 3. 🌐 Render (Cloud Deployment Platform)
- **Frontend Web Service Hosting:** Configured for single-page React/Vite deployment with optimized static build delivery (`npm run build` targeting `dist`).
- **Environment Management:** Secure vault storage for production environment variables (`VITE_GEMINI_API_KEY`, `VITE_PAYPAL_CLIENT_ID`).

### 4. 🛠️ Additional Tools & Technologies
- **Frontend Stack:** React, Vite, TypeScript, Tailwind CSS
- **3D Visualization:** Three.js for interactive 3D property models and virtual walkthroughs
- **API Design & Testing:** Postman & APIMatic for API testing, specification validation, and SDK integration management

---

## ⚙️ Setup & Local Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Snehacode7/EstateGenius-AI.git](https://github.com/Snehacode7/EstateGenius-AI.git)
   cd EstateGenius-AI
