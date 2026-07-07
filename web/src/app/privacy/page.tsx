"use client";

import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicy() {
  const { theme, mounted, toggleTheme, colors } = useTheme();

  if (!mounted) {
    return <div className="bg-[#030303] min-h-screen" suppressHydrationWarning />;
  }

  return (
    <div className={`${colors.bg} ${colors.text} min-h-screen flex flex-col items-center relative overflow-x-hidden font-sans transition-colors duration-350`}>
      {/* Background Ambient Glow */}
      {theme === "dark" && (
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.1)_0%,rgba(0,0,0,0)_70%)] pointer-events-none z-0" />
      )}

      {/* Header */}
      <Header theme={theme} colors={colors} />

      {/* Legal Content */}
      <main className="w-full max-w-3xl px-6 pt-16 pb-32 text-left z-10">
        <h1 className={`text-4xl font-extrabold tracking-tight mb-2 ${
          theme === "dark" 
            ? "bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent" 
            : "text-[#0F1115]"
        }`}>
          Privacy Policy
        </h1>
        <p className="text-xs text-gray-500 mb-12">Last Updated: June 29, 2026</p>

        <div className={`space-y-8 leading-relaxed text-sm ${
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        }`}>
          <p>
            This Privacy Policy ("Policy") describes how CloudCode ("Company", "we", "us", or "our") collects, uses, protects, and shares personal data obtained from users ("you", "your", or "User") of the CloudCode mobile application (the "App"), our website located at https://cloudcode.app, and related services, including our cloud container hosting and artificial intelligence components (collectively, the "Service").
          </p>
          <p>
            We are committed to protecting your privacy and ensuring compliance with applicable global data protection regulations, including the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and the Google Play Developer Distribution Agreement.
          </p>

          <section>
            <h2 className={`text-lg font-bold mb-3 border-b pb-2 ${
              theme === "dark" 
                ? "text-white border-gray-800/80" 
                : "text-[#0F1115] border-gray-200"
            }`}>
              1. Data Controller
            </h2>
            <p>
              The data controller responsible for your personal data is CloudCode, Inc. If you have any questions regarding this Policy, our data practices, or your rights, you can contact our Data Protection Officer (DPO) at <span className={`font-medium ${theme === "dark" ? "text-white" : "text-black"}`}>dpo@cloudcode.app</span> or write to us at support@cloudcode.app.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 border-b pb-2 ${
              theme === "dark" 
                ? "text-white border-gray-800/80" 
                : "text-[#0F1115] border-gray-200"
            }`}>
              2. Categories of Personal Data We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className={`font-semibold text-xs uppercase tracking-wider mb-2 ${
                  theme === "dark" ? "text-white" : "text-[#0F1115]"
                }`}>
                  A. Authentication and Account Data (GitHub OAuth)
                </h3>
                <p>
                  To use the Service, you must authenticate using your GitHub account. When you authorize CloudCode via GitHub OAuth, we collect the following categories of data from GitHub:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
                  <li>Your GitHub numeric User ID.</li>
                  <li>Your GitHub handle/username (e.g., @octocat).</li>
                  <li>Your primary verified email address.</li>
                  <li>Your public profile name and avatar image URL.</li>
                  <li>Your GitHub OAuth access token (stored securely to perform authorized actions on your behalf).</li>
                </ul>
              </div>

              <div>
                <h3 className={`font-semibold text-xs uppercase tracking-wider mb-2 ${
                  theme === "dark" ? "text-white" : "text-[#0F1115]"
                }`}>
                  B. Audio and Voice Data (Microphone Permission)
                </h3>
                <p>
                  If you opt to use our Voice Assistant feature ("Hey Cloud") to write or edit code, the App requests permission to access your device's microphone. 
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
                  <li><strong>Collection:</strong> We capture real-time audio recordings solely during your active voice interactions.</li>
                  <li><strong>Processing:</strong> The audio data is processed securely to translate your speech into text.</li>
                  <li><strong>Retention & Storage:</strong> Audio data is processed dynamically and is **never** stored permanently on our servers, nor is it ever shared, sold, or used for training proprietary models without your explicit opt-in.</li>
                </ul>
              </div>

              <div>
                <h3 className={`font-semibold text-xs uppercase tracking-wider mb-2 ${
                  theme === "dark" ? "text-white" : "text-[#0F1115]"
                }`}>
                  C. Technical, Usage, and Sandbox Data
                </h3>
                <p>
                  To maintain the security and operational integrity of our cloud environments, we collect:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
                  <li>Metadata about your isolated container sandboxes (CPU/RAM utilization, active terminal sessions).</li>
                  <li>Anonymized crash logs, device diagnostics, and app performance metrics.</li>
                  <li>IP addresses and access logs for security auditing and abuse prevention.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 border-b pb-2 ${
              theme === "dark" 
                ? "text-white border-gray-800/80" 
                : "text-[#0F1115] border-gray-200"
            }`}>
              3. Legal Bases for Processing (GDPR Compliance)
            </h2>
            <p className="mb-2">We process your personal data under the following legal bases pursuant to Article 6 of the GDPR:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><span className={`font-medium ${theme === "dark" ? "text-white" : "text-black"}`}>Performance of a Contract (Art. 6(1)(b)):</span> To authenticate your account, provision your Linux sandboxes, and compile/run your projects.</li>
              <li><span className={`font-medium ${theme === "dark" ? "text-white" : "text-black"}`}>Consent (Art. 6(1)(a)):</span> To access your microphone and process your audio recordings for voice commands. You can revoke this consent at any time in your device's system settings.</li>
              <li><span className={`font-medium ${theme === "dark" ? "text-white" : "text-black"}`}>Legitimate Interests (Art. 6(1)(f)):</span> To protect our cloud infrastructure from abuse, monitor resource utilization, and perform security audits.</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 border-b pb-2 ${
              theme === "dark" 
                ? "text-white border-gray-800/80" 
                : "text-[#0F1115] border-gray-200"
            }`}>
              4. Third-Party Subprocessors
            </h2>
            <p className="mb-4">
              We share certain data with trusted third-party service providers (subprocessors) to help us deliver the Service. These subprocessors are bound by strict Data Processing Agreements (DPAs) and cannot use your data for any other purpose:
            </p>
            <div className="overflow-x-auto font-sans">
              <table className={`w-full text-xs text-left border ${
                theme === "dark" 
                  ? "text-gray-400 border-gray-800" 
                  : "text-gray-650 border-gray-250"
              }`}>
                <thead className={`border-b ${
                  theme === "dark" 
                    ? "bg-gray-900/50 text-white border-gray-800" 
                    : "bg-gray-100 text-black border-gray-200"
                }`}>
                  <tr>
                    <th className="p-3">Subprocessor</th>
                    <th className="p-3">Purpose</th>
                    <th className="p-3">Data Transferred</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  theme === "dark" ? "divide-gray-800" : "divide-gray-200"
                }`}>
                  <tr>
                    <td className={`p-3 font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>Supabase / PostgreSQL</td>
                    <td className="p-3">Database hosting & session state</td>
                    <td className="p-3">User profiles, project metadata, billing states.</td>
                  </tr>
                  <tr>
                    <td className={`p-3 font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>Cloud Hosting Providers</td>
                    <td className="p-3">Docker container sandbox orchestration</td>
                    <td className="p-3">Isolated workspace files and active terminal logs.</td>
                  </tr>
                  <tr>
                    <td className={`p-3 font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>OpenAI / Google / Anthropic</td>
                    <td className="p-3">LLM-based AI code assistance (Optional)</td>
                    <td className="p-3">Prompt text/code snippets (only if utilizing built-in models).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 border-b pb-2 ${
              theme === "dark" 
                ? "text-white border-gray-800/80" 
                : "text-[#0F1115] border-gray-200"
            }`}>
              5. Data Retention & Account Deletion
            </h2>
            <p className="mb-4">
              We retain your personal data only as long as your account remains active. If your account is inactive for more than 12 consecutive months, we reserve the right to delete your workspaces and profiles.
            </p>
            <p className="mb-4">
              You have the right to request the permanent and immediate deletion of your account and all associated data at any time:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 mb-4">
              <li><strong>In-App Deletion:</strong> Navigate to <span className={`font-medium ${theme === "dark" ? "text-white" : "text-black"}`}>Settings &gt; Profile &gt; Delete Account</span>. This triggers our backend database to wipe your profile and immediately terminates and cleans up all active Docker containers and files.</li>
              <li><strong>Web Deletion:</strong> If the app is uninstalled, you can securely authenticate and request deletion via our <Link href="/delete-account" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline font-medium">Account Deletion Page</Link>.</li>
            </ul>
            <p>Once requested, your account is deleted instantly. Backup logs are fully purged within 30 days.</p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 border-b pb-2 ${
              theme === "dark" 
                ? "text-white border-gray-800/80" 
                : "text-[#0F1115] border-gray-200"
            }`}>
              6. Your Rights (GDPR & CCPA)
            </h2>
            <p className="mb-2">Depending on your location, you have the following data protection rights:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>The right to access, update, or delete the information we have on you.</li>
              <li>The right of rectification (correcting inaccurate data).</li>
              <li>The right to object to or restrict our processing of your personal data.</li>
              <li>The right to data portability (receiving a structured copy of your data).</li>
              <li>The right to withdraw consent at any time where we relied on your consent.</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 border-b pb-2 ${
              theme === "dark" 
                ? "text-white border-gray-800/80" 
                : "text-[#0F1115] border-gray-200"
            }`}>
              7. Security
            </h2>
            <p>
              We implement industry-standard administrative, technical, and physical security measures. All data in transit is encrypted using TLS 1.3. Your database records are secured behind virtual private networks, and container environments are fully isolated from one another using kernel-level namespaces and cgroups to prevent cross-tenant data access.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer theme={theme} colors={colors} toggleTheme={toggleTheme} />
    </div>
  );
}
