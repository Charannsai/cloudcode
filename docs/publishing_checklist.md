# 📋 CloudCode Production & Publishing Checklist

This checklist consolidates all remaining actions, legal requirements, technical updates, and infrastructure tasks required to launch **CloudCode** on the Google Play Store and deploy the backend container service securely in production.

---

## 1. 🛡️ Google Play Store & Legal Compliance (Pending)

Google Play has strict policies around user privacy, data control, and device permissions. To avoid rejection, the following items must be resolved:

- [ ] **Draft & Host the Privacy Policy:**
  - Create a dedicated public webpage (e.g., `https://cloudcode.app/privacy` or a public GitHub Pages URL).
  - *Must disclose:* GitHub OAuth usage (collecting name/email/ID) and Microphone usage (voice control processing).
- [ ] **Draft & Host the Terms of Service:**
  - Create a public Terms of Service page (e.g., `https://cloudcode.app/terms`).
- [ ] **Web-based Account Deletion Portal:**
  - *Google Play Policy:* Users must be able to delete their account from a browser without having the app installed.
  - *Action:* Create a web page in the `web` component (e.g., `web/src/app/delete-account/page.tsx`) where users can log in via GitHub and trigger the backend `/cc-api/user` deletion API.
- [ ] **Update Branding Assets:**
  - Replace the default Expo assets, icons, and splash screens inside the [mobile/assets](file:///c:/Users/UshaSree/OneDrive/Desktop/cloudcode/mobile/assets) folder with custom high-resolution CloudCode branding.
- [ ] **Submit the Play Console Data Safety Form:**
  - Declare that the app collects *Personal Info* (GitHub Profile Data), *Audio Files* (for voice command inputs), and *App Performance* (crash logs/diagnostics). State that data is encrypted in transit and users can request deletion.
- [ ] **Run Closed Testing (The 20-Tester Rule):**
  - If your Google Play Developer Account was created after November 9, 2023, you must recruit at least **20 testers** to run a closed test for **14 consecutive days** before requesting production access.

> [!NOTE]
> Detailed Play Store release items are archived in [playstore_release_checklist.md](file:///c:/Users/UshaSree/OneDrive/Desktop/cloudcode/docs/playstore_release_checklist.md).

---

## 💳 2. In-App Purchase Migration (RevenueCat)

To sell premium subscriptions on Android and maintain compliance, the app must migrate from Dodo Payments (web-based checkout) to native Google Play Billing using **RevenueCat**.

- [ ] **Play Console Subscription Configuration:**
  - Create the subscription products (`pro_monthly` and `advanced_monthly`) in the Google Play Console under **Monetization > Subscriptions**.
- [ ] **RevenueCat Dashboard Setup:**
  - Set up Google Play Developer credentials and upload the Google Cloud Service Account JSON key.
- [ ] **Mobile SDK Integration:**
  - Install `react-native-purchases` in the [mobile/package.json](file:///c:/Users/UshaSree/OneDrive/Desktop/cloudcode/mobile/package.json) file.
  - Initialize the Purchases SDK in [mobile/app/_layout.tsx](file:///c:/Users/UshaSree/OneDrive/Desktop/cloudcode/mobile/app/_layout.tsx) and bind the active user using `Purchases.logIn(user.id)` on login.
- [ ] **Replace Checkout Flows:**
  - Replace the Dodo web checkouts inside [settings.tsx](file:///c:/Users/UshaSree/OneDrive/Desktop/cloudcode/mobile/app/%28tabs%29/settings.tsx) and [LimitExceededModal.tsx](file:///c:/Users/UshaSree/OneDrive/Desktop/cloudcode/mobile/components/LimitExceededModal.tsx) with native billing calls using `Purchases.purchasePackage()`.
- [ ] **Backend Webhook Integration:**
  - Replace the Dodo Payments webhook in [route.ts](file:///c:/Users/UshaSree/OneDrive/Desktop/cloudcode/backend/src/app/cc-api/billing/webhook/route.ts) with a RevenueCat webhook handler to securely listen to events (`INITIAL_PURCHASE`, `RENEWAL`, `EXPIRATION`) and sync user tiers in Supabase.

> [!IMPORTANT]
> The roadmap to execute this migration is outlined in [implementation_plan_pricing](file:///c:/Users/UshaSree/OneDrive/Desktop/cloudcode/docs/implementation_plan_pricing).

---

## 🛠️ 3. Core IDE Feature Gaps (Prototype to Premium)

To make the in-app experience feel premium and fully functional, the remaining feature gaps must be addressed:

- [ ] **Persistent Terminal Sessions:**
  - Make container shell connections persistent (using `tmux` multiplexing or backend socket buffers) so switching screens or tabs doesn't disconnect running processes.
- [ ] **Multi-File Tab Bar & Split-Screen View:**
  - Implement a tab manager at the top of the [editor.tsx](file:///c:/Users/UshaSree/OneDrive/Desktop/cloudcode/mobile/app/project/%5Bid%5D/editor.tsx) screen to view/switch multiple open files and add support for split view.
- [ ] **Path-Specific File Creation:**
  - Update the file explorer context actions to support creating files and folders in specific subdirectories instead of just the workspace root.
- [ ] **Language-Agnostic Code Runner:**
  - Implement a top-level "Run" button in the IDE that detects the file extension (Python, JS, C, Go) and executes the correct CLI run command inside the terminal.
- [ ] **Chrome-style DevTools:**
  - Enhance the web preview screen with a developer panel showing HTML inspector elements, console logs, network requests, and live resource trackers.
- [ ] **Zustand Persistence & UI Skeleton Loaders:**
  - Persist UI configurations, open file references, and connection states to avoid jarring reload screen blinks.
  - Implement sleek loading animations for actions with high network latency (>150ms).

> [!TIP]
> The full details of these features are described in the [upcoming_features.md](file:///c:/Users/UshaSree/OneDrive/Desktop/cloudcode/docs/upcoming_features.md) roadmap document.

---

## 🌐 4. Infrastructure & Server Hardening

Before deploying the Next.js API server to a live VPS to receive actual client traffic:

- [ ] **Deploy the Host VPS Node:**
  - Provision your 8GB Droplet on DigitalOcean using the developer credits.
- [ ] **Docker Socket & Container Isolation Security:**
  - Configure the Docker daemon to block inter-container communication (ICC) and enforce non-root access for user terminal processes inside containers.
- [ ] **Update Environment Variables:**
  - Create the production `.env` files. Ensure `EXPO_PUBLIC_API_URL` points to your secure production backend endpoint (`https://api.cloudcode.app`).
- [ ] **Verify Auto-Sleep Cron Efficiency:**
  - Ensure that the 2-minute interval cron job in [server.ts](file:///c:/Users/UshaSree/OneDrive/Desktop/cloudcode/backend/src/server.ts) successfully frees host RAM by stopping idle workspaces (5-10 minutes inactivity for the Free tier).
- [ ] **Implement Waitlist / Invite Checks:**
  - Protect the 8GB Droplet from traffic spikes by implementing an invite-only waitlist screen during onboarding in the mobile client.

> [!CAUTION]
> Free-tier scaling metrics and server limits are analyzed in [zero_cost_scaling_plan.md](file:///c:/Users/UshaSree/OneDrive/Desktop/cloudcode/docs/zero_cost_scaling_plan.md) and [scaling_and_cost_analysis.md](file:///c:/Users/UshaSree/OneDrive/Desktop/cloudcode/docs/scaling_and_cost_analysis.md).
