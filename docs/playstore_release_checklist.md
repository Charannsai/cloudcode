# 🚀 CloudCode Play Store Release Checklist

This is the status of all requirements to publish **CloudCode** on the Google Play Store without getting rejected.

## 1. 🟢 Codebase Changes (COMPLETED)

*   **[x] Real Account Deletion (Backend & Frontend)**:
    *   **Backend:** Added a real `DELETE /cc-api/user` endpoint in `backend/src/app/cc-api/user/route.ts` that cleans up the user's active Docker containers, workspace directories, and database records.
    *   **Frontend:** Updated the "Delete Account" flow in `mobile/app/(tabs)/settings.tsx` to call the real API and clean up local storage.
*   **[x] Microphone Prominent Disclosure**:
    *   Created a permission helper at `mobile/lib/permissions.ts` that shows a prominent disclosure explaining how voice data is used *before* the OS triggers the microphone prompt.
    *   Integrated this into all voice-trigger points: `VoiceOverlay.tsx`, `AITab.tsx`, and `ai.tsx`.
*   **[x] Legal & Privacy Links**:
    *   Added clickable "Privacy Policy" and "Terms of Service" links at the bottom of the `About` sub-screen in `mobile/app/(tabs)/settings.tsx`.
*   **[x] Android Versioning**:
    *   Added `"versionCode": 1` to the `android` block in `mobile/app.json`.

---

## 2. 🟡 Action Items for You (PENDING)

### 📄 Legal & Hosting
*   **[ ] Draft & Host the Privacy Policy:**
    *   You need to host your privacy policy at a public URL (e.g., `https://cloudcode.app/privacy` or a public GitHub Pages link).
    *   *Must disclose:* Authentication (GitHub profile data) and Microphone usage (voice commands processed securely, not stored/shared).
*   **[ ] Draft & Host the Terms of Service:**
    *   Host your Terms of Service at a public URL (e.g., `https://cloudcode.app/terms`).
*   **[ ] Web-based Account Deletion Page:**
    *   Google Play requires a web link where users can request account deletion without having the app installed.
    *   *Action:* Build a simple page on your website (e.g., `https://cloudcode.app/delete-account`) where users can log in with GitHub and trigger the backend deletion API.

### ⚙️ Production Configuration
*   **[ ] Update API URL for Production:**
    *   Update the `.env` file for your production build so that `EXPO_PUBLIC_API_URL` points to your live HTTPS production server instead of `localhost` or local IP.
*   **[ ] Update Branding Assets:**
    *   Replace the default Expo icons and splash screen in the `mobile/assets/` folder with your custom branding.

### 🏪 Google Play Console & Submission
*   **[ ] Create Google Developer Account:**
    *   Register at the Google Play Console ($25 one-time registration fee).
*   **[ ] Complete the Data Safety Form:**
    *   Declare that you collect: *Personal Info* (Name, Email, User ID), *Audio Files* (voice recordings), and *App Performance* (crash logs, diagnostics). State that data is encrypted in transit and users can request deletion.
*   **[ ] Prepare Store Listing Assets:**
    *   **App Title:** Max 30 chars.
    *   **Short Description:** Max 80 chars.
    *   **Full Description:** Max 4000 chars.
    *   **App Icon:** 512x512 PNG, no transparency, max 1MB.
    *   **Feature Graphic:** 1024x500 JPG or 24-bit PNG.
    *   **Screenshots:** At least 2 phone screenshots (up to 8) and tablet screenshots (since tablet support is enabled).
*   **[ ] Run Closed Testing (The 20-Tester Rule):**
    *   If your Play Console account was created after Nov 9, 2023, you must run a closed test with at least **20 testers** who must be opted-in for at least **14 days consecutively** before you can apply to release the app to production.

---

## 3. 🛠️ Commands to Build and Test

When you are ready to build the app for testing:
1.  **Configure EAS Build:**
    ```bash
    eas build:configure
    ```
2.  **Build the Android App Bundle (AAB):**
    ```bash
    eas build --platform android --profile preview
    ```
    *(This will output an `.aab` file which you can upload directly to the Google Play Console).*
