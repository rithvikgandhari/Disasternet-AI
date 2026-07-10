# Disasternet-AI
**Intelligent Disaster Prediction & Emergency Response Platform**  
Powered by IBM Watsonx.ai (Granite Foundation Model)

---

## Features

| Feature | Description |
|---|---|
| 🎯 AI Prediction | Real-time flood, cyclone, wildfire, heatwave, landslide risk scores |
| 🗺️ Live Map | Leaflet/OpenStreetMap GIS with disaster markers |
| 📡 Incident Reporting | Citizen reports with AI image verification |
| 🏠 Shelter Finder | Real-time bed/food/medical availability |
| 🚗 Evacuation Routes | Safest routes avoiding hazard zones |
| 🤝 Volunteer Portal | Task coordination and registration |
| 📊 Gov Dashboard | Heatmap, KPIs, district-level command view |
| 🔍 AI Damage Assessment | Post-disaster impact and recovery planning |
| 🆘 SOS Button | One-tap emergency alert with GPS |
| 🤖 AI Chat | IBM Watsonx.ai Granite chatbot assistant |

---

## Quick Start

### 1. Configure IBM Watsonx.ai Credentials

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

```env
WATSONX_API_KEY=your_ibm_cloud_api_key_here
WATSONX_PROJECT_ID=your_watsonx_project_id_here
WATSONX_BASE_URL=https://us-south.ml.cloud.ibm.com
WATSONX_MODEL_ID=ibm/granite-13b-chat-v2
```

### 2. Update `env.js`

Open `env.js` and fill in your keys:

```js
window.ENV = {
  WATSONX_API_KEY:    "your_key_here",
  WATSONX_PROJECT_ID: "your_project_id_here",
  // ...
};
```

> **In Production:** Use a build tool (Vite/Webpack with `dotenv-webpack`) to inject `.env` values automatically at build time. Never commit real keys.

### 3. Open in Browser

```bash
# Simple: just open index.html in a browser
# Or serve with any static server:
npx serve .
# or
python -m http.server 8080
```

---

## How to Get IBM Watsonx.ai Credentials

1. Create an [IBM Cloud account](https://cloud.ibm.com/registration)
2. Provision a **Watson Machine Learning** service
3. Create a **Watsonx.ai project**
4. Generate an **API Key** at https://cloud.ibm.com/iam/apikeys
5. Copy your **Project ID** from the Watsonx.ai project settings

---

## File Structure

```
disasternet-ai/
├── index.html          # Main SPA — all pages
├── env.js              # Runtime env config (generated from .env)
├── .env.example        # Template for environment variables
├── .env                # Your actual keys (DO NOT COMMIT)
├── css/
│   └── main.css        # Full design system stylesheet
└── js/
    ├── watsonx.js      # IBM Watsonx.ai API integration
    └── app.js          # Page logic, rendering, interactions
```

---

## IBM Watsonx.ai Integration

The platform uses the Watsonx.ai **text generation** API with the **Granite 13B Chat** model for:

- **Disaster Risk Analysis** — Analyzes weather + sensor data → structured risk JSON
- **Image Verification** — Classifies disaster photos, estimates severity
- **Damage Assessment** — Estimates population impact, infrastructure, economic cost
- **AI Chat Assistant** — Emergency guidance, evacuation advice, shelter info

When API keys are not configured, the platform runs in **demo mode** with realistic pre-built responses.

---

## Target Users

- 👨‍👩‍👧 Citizens — SOS, shelters, evacuation routes
- 🚒 Emergency Responders — Incident feed, rescue coordination
- 🏥 Hospitals — Patient intake forecasting
- 🤝 NGOs — Volunteer coordination
- 🏛️ Government / NDMA — Command dashboard, resource allocation

---

## Future Scope

- Drone integration
- IoT flood/earthquake sensors
- Satellite imagery analysis
- Offline emergency mode
- Multilingual voice assistant
- Digital twin for smart cities
