# Civic Voice — Transparent Civic Grievance & Infrastructure Platform

> **“Speak your issue, we will handle the rest.”**

Civic Voice is a transparent, inclusive, accessible civic grievance and municipal infrastructure triage platform. It provides two independent web interfaces: Citizen (including public accountability) and restricted Handler Operations. Each has its own direct link; neither interface shows a portal chooser or a link to switch to the other. Both reuse the same report and authentication services.

**Prototype storage note:** the current services use browser `localStorage`, not a hosted server database. The two pages share data when opened on the same browser and origin, but different devices or browsers do not share reports. A real deployment needs a server-side API/database and server-enforced authorization.

---

## 🌟 Brand & Visual Design
- **Name**: Civic Voice
- **Tagline**: *“Speak your issue, we will handle the rest.”*
- **Theme**: Warm white with orange accents (`#ea580c` / `#f97316`) by default, plus a Theme Selector with 4 readable modes:
  1. White & Orange (Default)
  2. High Contrast Dark
  3. Soft Slate & Blue
  4. Warm Sand & Terracotta
- **Accessibility & Low-Literacy Support**:
  - Clear icons paired with audio instructions (`Volume2` speech synthesis readouts) for low-literacy citizens.
  - Large readable text and generous spacing.
  - Color is never used as the sole conveyor of information (all statuses and priorities include text badges and iconography).

---

## 🌐 Language-First Citizen Onboarding
- **First Screen Seen by Citizens**: A mandatory Language Selection screen appears on the citizen's first visit before reaching the intake form.
- **45 Global Languages**: Includes authentic native scripts, regional classification, and BCP-47 speech mappings.
- **Interactive Audio Pronunciation**: Citizens can click the speaker button next to any language to hear its name spoken aloud.
- **Persistent Preference**: Chosen language is remembered across sessions and can be modified at any time via the header switcher.

---

## 📱 Citizen Identity & Honest Privacy Safeguards
- **Primary Contact**: Phone number with an international country dial code selector (`+1`, `+91`, `+44`, `+52`, etc.).
- **Optional Email**: Email is never required to submit a grievance.
- **Transparent Privacy Safeguards**:
  - Contact numbers are strictly restricted to authorized municipal triage crews for dispatch and clarification.
  - Citizen phone numbers, email addresses, and full names are **never** displayed on public dashboards or returned via public APIs.
  - Internal staff notes are strictly kept separate and never exposed in citizen or public views.

---

## 📝 Reporting Flow: Form Mode & Talk Mode
Citizens can toggle between two reporting modes at any time:

### 1. Form Mode
- Structured fields for problem description, category, location, and contact information.
- Standard categories: Roads, Water, Street Lighting, Waste, Bridges, Pollution, Transit, and **Other issue**.
- **“Other issue”**: Enables a custom free-form description so citizens are never forced into an existing category.
- **Location**: Enter address manually or click **“Use My Current Location”** for GPS coordinate detection.
- **Optional Photos**: Select or upload photos, preview them, replace them, or remove them. Photos are never required.
- **Review Step**: Clear summary and explainable triage preview before final submission.

### 2. Talk Mode (Voice Dictation & Transcription)
- Built-in speech recognition transcribes citizen voice directly into the editable report text field.
- Independent spoken dialect selector allows citizens to speak in their native tongue even if the UI is set to another language.
- Explicit states: `recording`, `stop`, `processing`, `transcript`, `retry`, and `manual text fallback`.
- Preserves the original-language transcript while providing official municipal translation side-by-side.
- Follow-up questions:
  - Where is the problem located?
  - Are there immediate safety hazards or danger to people?
  - Would you like to report another issue right after?
- Citizens can report multiple issues sequentially with ease.

---

## 🔍 Citizen Report Tracking & Engagement
- **Reference Number**: Each report receives a unique tracking code (e.g. `CV-2026-8941`).
- **Plain-Language Status**: Clear status indicators (`Submitted`, `Triaged`, `Assigned`, `In Progress`, `Resolved`).
- **Status Timeline**: Visual progress tracker with timestamped municipal audit events.
- **Citizen-Handler Communication**: Direct two-way messaging with assigned municipal crews.
- **Flag Unresolved**: Citizens can flag a report if work has stalled or remains incomplete.
- **Post-Resolution Feedback**: Accessible 1–5 star rating bar, satisfaction level, and optional feedback comment.
- **Temporary Precaution Guidance**: Prominently labeled as *Informational Guidance (Not an official emergency service or 911 dispatch)*.

---

## 🔒 Handler Operations Portal & Administrator Governance
Handler operations are strictly protected against unauthorized access. Citizens cannot access operations by changing URLs or roles.

### 1. One-Time Initial Admin Bootstrap
To prevent account takeovers, bots, or race conditions:
- The site owner configures a secure bootstrap setup token:
  ```
  CIVICVOICE-ADMIN-BOOTSTRAP-2026
  ```
- The first administrator uses this token to atomically register the initial admin account.
- **Permanent Lock**: As soon as the first admin account is created, public admin registration is permanently locked and the bootstrap tab disappears.

### 2. Handler Approval & Role Management
- New handlers register via **“Request Access”** and start with `pending` status.
- Only the authenticated Administrator can approve, suspend, or reassign handlers to departments.
- Timestamped audit trail records all access decisions and privilege grants.

### 3. Demo Handler Credentials (Local Testing)
For local evaluation, a pre-approved municipal officer account is seeded:
- **Email**: `marcos.vance@civicvoice.gov`
- **Password**: `handler123`
- **Role**: Lead Operations Officer (Department: MWSA - Municipal Water & Sewer Authority)

---

## ⚙️ Operations Workbench Capabilities
- Real-time queue with multi-criteria filters (Status, Urgency, Category, Department, Zone).
- Dual-language view displaying original citizen dictation and official translation.
- Automated Explainable Triage:
  - Immediate Danger Score (0–100)
  - Risk to People
  - Scale of Disruption
  - Rate of Worsening
  - Suggested Authority & Precaution Guidance
- Handler controls to reassign departments or override severity (requiring a documented justification).
- **Split Messaging**: Citizen-facing communication vs. Private internal engineering notes (amber styling, never returned to citizen view).
- Mandatory formal resolution summary before marking a grievance resolved.

---

## 📊 Public Accountability Dashboard
- Aggregates city-wide infrastructure performance metrics without compromising privacy.
- Displays grievance volume, resolution rates, average turnaround time, category distributions, and neighborhood zone performance.
- Completely redacts private names, phone numbers, email addresses, and internal notes.

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev

# 3. Build for production (TypeScript compile + Vite bundle)
npm run build
```

Open these addresses while the Vite server is running:

- Citizen and public accountability app: `http://localhost:5173/` or `http://localhost:5173/citizen.html`
- Handler Operations app: `http://localhost:5173/handler.html`

---

## 🔑 External Cloud Service Integrations (Optional)

The application includes fully functional client-side fallbacks (Web Speech API, browser Geolocation, rule-based multilingual translation, and local storage). To connect production cloud services:

| Service | Environment Variable | Functionality |
|---|---|---|
| **Speech-to-Text** | `VITE_AZURE_SPEECH_KEY`, `VITE_AZURE_SPEECH_REGION` | Cloud transcription fallback |
| **Neural Translation** | `VITE_DEEPL_API_KEY` or `VITE_GOOGLE_TRANSLATE_KEY` | Real-time multilingual translation |
| **Mapping & Geocoding** | `VITE_MAPBOX_TOKEN` or `VITE_GOOGLE_MAPS_KEY` | Vector map pins & reverse geocoding |
| **SMS Alerts** | `VITE_TWILIO_AUTH_TOKEN` | SMS dispatch alerts to citizen phone numbers |
# Civic Voice — Transparent Civic Grievance & Infrastructure Platform

## 👥 Team Details
- **Team Name:** Team DHA_YAM
- **Team Members & Roles:**
  - Member 1: [Madhu karthik]
  - Member 2: [Samarth]
- Member 3:[Gourav]
## 🚀 Live Deployment URLs
- **Citizen Portal:** [https://ephemeral-truffle-034026.netlify.app/citizen]
- **Handler Portal:** [https://ephemeral-truffle-034026.netlify.app/handler]

## 💻 Local Setup Instructions
To run this project locally, execute the following commands in your terminal:


