import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="bg-[#030712] text-gray-100 min-h-screen flex flex-col items-center relative overflow-x-hidden font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.1)_0%,rgba(0,0,0,0)_70%)] pointer-events-none z-0" />

      {/* Header */}
      <header className="w-full max-w-5xl px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
            CloudCode
          </Link>
          <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
            Beta
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
            Terms
          </Link>
        </nav>
      </header>

      {/* Legal Content */}
      <main className="w-full max-w-3xl px-6 pt-16 pb-32 text-left z-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        <p className="text-xs text-gray-500 mb-12">Last Updated: June 29, 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed text-sm">
          <p>
            This Privacy Policy ("Policy") describes how CloudCode ("Company", "we", "us", or "our") collects, uses, protects, and shares personal data obtained from users ("you", "your", or "User") of the CloudCode mobile application (the "App"), our website located at https://cloudcode.app, and related services, including our cloud container hosting and artificial intelligence components (collectively, the "Service").
          </p>
          <p>
            We are committed to protecting your privacy and ensuring compliance with applicable global data protection regulations, including the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and the Google Play Developer Distribution Agreement.
          </p>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">1. Data Controller</h2>
            <p>
              The data controller responsible for your personal data is CloudCode, Inc. If you have any questions regarding this Policy, our data practices, or your rights, you can contact our Data Protection Officer (DPO) at <span className="text-white font-medium">dpo@cloudcode.app</span> or write to us at support@cloudcode.app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">2. Categories of Personal Data We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-2">A. Authentication and Account Data (GitHub OAuth)</h3>
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
                <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-2">B. Audio and Voice Data (Microphone Permission)</h3>
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
                <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-2">C. Technical, Usage, and Sandbox Data</h3>
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
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">3. Legal Bases for Processing (GDPR Compliance)</h2>
            <p className="mb-2">We process your personal data under the following legal bases pursuant to Article 6 of the GDPR:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><span className="text-white font-medium">Performance of a Contract (Art. 6(1)(b)):</span> To authenticate your account, provision your Linux sandboxes, and compile/run your projects.</li>
              <li><span className="text-white font-medium">Consent (Art. 6(1)(a)):</span> To access your microphone and process your audio recordings for voice commands. You can revoke this consent at any time in your device's system settings.</li>
              <li><span className="text-white font-medium">Legitimate Interests (Art. 6(1)(f)):</span> To protect our cloud infrastructure from abuse, monitor resource utilization, and perform security audits.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">4. Third-Party Subprocessors</h2>
            <p className="mb-4">
              We share certain data with trusted third-party service providers (subprocessors) to help us deliver the Service. These subprocessors are bound by strict Data Processing Agreements (DPAs) and cannot use your data for any other purpose:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-400 border border-gray-800">
                <thead className="bg-gray-900/50 text-white border-b border-gray-800">
                  <tr>
                    <th className="p-3">Subprocessor</th>
                    <th className="p-3">Purpose</th>
                    <th className="p-3">Data Transferred</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="p-3 font-semibold text-white">Supabase / PostgreSQL</td>
                    <td className="p-3">Database hosting & session state</td>
                    <td className="p-3">User profiles, project metadata, billing states.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Cloud Hosting Providers</td>
                    <td className="p-3">Docker container sandbox orchestration</td>
                    <td className="p-3">Isolated workspace files and active terminal logs.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">OpenAI / Google / Anthropic</td>
                    <td className="p-3">LLM-based AI code assistance (Optional)</td>
                    <td className="p-3">Prompt text/code snippets (only if utilizing built-in models).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">5. Data Retention & Account Deletion</h2>
            <p className="mb-4">
              We retain your personal data only as long as your account remains active. If your account is inactive for more than 12 consecutive months, we reserve the right to delete your workspaces and profiles.
            </p>
            <p className="mb-4">
              You have the right to request the permanent and immediate deletion of your account and all associated data at any time:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 mb-4">
              <li><strong>In-App Deletion:</strong> Navigate to <span className="text-white font-medium">Settings &gt; Profile &gt; Delete Account</span>. This triggers our backend database to wipe your profile and immediately terminates and cleans up all active Docker containers and files.</li>
              <li><strong>Web Deletion:</strong> If the app is uninstalled, you can securely authenticate and request deletion via our <Link href="/delete-account" className="text-indigo-400 underline hover:text-indigo-300">Account Deletion Page</Link>.</li>
            </ul>
            <p>Once requested, your account is deleted instantly. Backup logs are fully purged within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">6. Your Rights (GDPR & CCPA)</h2>
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
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">7. Security</h2>
            <p>
              We implement industry-standard administrative, technical, and physical security measures. All data in transit is encrypted using TLS 1.3. Your database records are secured behind virtual private networks, and container environments are fully isolated from one another using kernel-level namespaces and cgroups to prevent cross-tenant data access.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto w-full max-w-5xl px-6 py-10 border-t border-gray-900 flex flex-col items-center gap-4 z-10">
        <div className="flex flex-wrap gap-6 justify-center text-xs text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="text-gray-800">•</span>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
        <p className="text-[11px] text-gray-600 text-center">
          &copy; {new Date().getFullYear()} CloudCode. All rights reserved. Built for developers.
        </p>
      </footer>
    </div>
  );
}
