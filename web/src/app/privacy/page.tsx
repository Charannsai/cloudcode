import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="bg-[#030712] text-gray-100 min-h-screen flex flex-col items-center relative overflow-hidden font-sans">
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
          <Link href="/delete-account" className="text-xs font-semibold text-red-400 border border-red-500/30 hover:border-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-md bg-red-500/5 transition-all">
            Delete Account
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
            At CloudCode, we take your privacy seriously. This Privacy Policy describes how CloudCode ("we", "us", or "our") collects, uses, and discloses your information when you use our mobile application (the "App") and our website.
          </p>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">1. Information We Collect</h2>
            <p className="mb-4">We only collect the information necessary to provide you with our cloud development services:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong className="text-white">GitHub Account Data:</strong> When you log in via GitHub OAuth, we collect your GitHub user ID, username, email address, avatar URL, and an access token. This is used solely to authenticate your identity, retrieve your repositories, and manage your projects.
              </li>
              <li>
                <strong className="text-white">Voice and Audio Recordings:</strong> If you use our voice assistant feature ("Hey Cloud"), the App accesses your device's microphone to capture your voice commands. This audio is processed securely to translate your speech into text. We do not store your voice recordings on our servers, and we do not share your audio data with third parties.
              </li>
              <li>
                <strong className="text-white">App Performance and Diagnostics:</strong> We collect crash logs and basic performance statistics to help us debug issues and improve the stability of the App. This data is anonymized and does not contain personal information.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">2. How We Use Your Information</h2>
            <p className="mb-4">We use the collected information to:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>Authenticate your account and maintain your session.</li>
              <li>Provision and manage your isolated cloud container sandboxes.</li>
              <li>Process your voice commands to perform developer actions.</li>
              <li>Improve the performance and reliability of our services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">3. Data Sharing and Disclosure</h2>
            <p className="mb-4">We do not sell, trade, or rent your personal information to third parties. We only share information in the following limited circumstances:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong className="text-white">Service Providers:</strong> We may share data with trusted third-party services (such as cloud hosting providers) that are necessary to run your container environments. These providers are bound by strict confidentiality agreements.
              </li>
              <li>
                <strong className="text-white">Legal Compliance:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">4. Data Retention and Security</h2>
            <p>
              We retain your personal data and project configurations only as long as your account is active. All communication between the App, the website, and our servers is fully encrypted using industry-standard SSL/TLS (HTTPS) connections. Your local settings are stored securely on your device using encrypted storage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">5. Your Rights and Account Deletion</h2>
            <p className="mb-4">
              You have full control over your data. You can request the permanent deletion of your account and all associated data (including your profile, workspaces, and container environments) at any time. You can do this:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>Directly within the App under <span className="text-white font-medium">Settings &gt; Profile &gt; Delete Account</span>.</li>
              <li>On our website by visiting the <Link href="/delete-account" className="text-indigo-400 underline hover:text-indigo-300">Account Deletion Page</Link>.</li>
            </ul>
            <p className="mt-4">Upon deletion, all your data is permanently and irreversibly erased from our databases and servers.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">6. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy, please contact us at <span className="text-white font-medium">support@cloudcode.app</span>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto w-full max-w-5xl px-6 py-10 border-t border-gray-900 flex flex-col items-center gap-4 z-10">
        <div className="flex flex-wrap gap-6 justify-center text-xs text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="text-gray-800">•</span>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <span className="text-gray-800">•</span>
          <Link href="/delete-account" className="hover:text-white transition-colors">Delete Account Request</Link>
        </div>
        <p className="text-[11px] text-gray-600 text-center">
          &copy; {new Date().getFullYear()} CloudCode. All rights reserved. Built for developers.
        </p>
      </footer>
    </div>
  );
}
