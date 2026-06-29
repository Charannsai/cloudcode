import Link from "next/link";

export default function TermsOfService() {
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
          <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
            Privacy
          </Link>
        </nav>
      </header>

      {/* Legal Content */}
      <main className="w-full max-w-3xl px-6 pt-16 pb-32 text-left z-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
          Terms of Service
        </h1>
        <p className="text-xs text-gray-500 mb-12">Last Updated: June 29, 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed text-sm">
          <p>
            Welcome to CloudCode. These Terms of Service ("Terms") govern your access to and use of the CloudCode mobile application (the "App"), our website, and our cloud development container services (collectively, the "Service").
          </p>
          <p>
            By creating an account or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use the Service.
          </p>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">1. Accounts and Authentication</h2>
            <p>
              To use CloudCode, you must log in using your GitHub account. You are responsible for maintaining the security of your GitHub account and credentials. We are not liable for any loss or damage arising from your failure to maintain account security. You must immediately notify us of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">2. Acceptable Use of Cloud Sandboxes</h2>
            <p className="mb-4">
              CloudCode provides you with isolated cloud container environments ("Sandboxes") to write, compile, and test code. You agree NOT to use these Sandboxes to:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>Engage in any form of cryptocurrency mining.</li>
              <li>Launch Denial of Service (DoS) attacks, port scanning, or distribute malware.</li>
              <li>Host illegal content or engage in fraudulent activities.</li>
              <li>Attempt to bypass container isolation or gain unauthorized access to our host servers or networks.</li>
              <li>Exceed the resource limits (CPU, RAM, storage) allocated to your subscription tier.</li>
            </ul>
            <p className="mt-4">
              We reserve the right to monitor container resource usage and immediately suspend or terminate any Sandbox or account that violates these acceptable use guidelines without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">3. Intellectual Property and User Code</h2>
            <p>
              You retain full ownership of all code, repositories, and intellectual property that you write, import, or deploy within the Service. We do not claim any ownership rights over your work. You represent and warrant that you have the necessary rights and permissions for any code or content you import into the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">4. Subscriptions and Billing</h2>
            <p>
              Certain features of the Service (such as increased RAM, persistent storage, or advanced AI features) may require a paid subscription. If you sign up for a paid subscription, you agree to our billing terms. All fees are non-refundable unless required by law or specified in our refund policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">5. Termination</h2>
            <p>
              You can terminate these Terms at any time by deleting your account. You can delete your account from within the App (Settings &gt; Profile &gt; Delete Account) or via the web on our <Link href="/delete-account" className="text-indigo-400 underline hover:text-indigo-300">Account Deletion Page</Link>. Upon deletion, your account, cloud workspaces, and container environments will be permanently deleted. We also reserve the right to suspend or terminate your account for violations of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 border-b border-gray-800/80 pb-2">6. Limitation of Liability</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL CLOUDCODE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR USE, INCURRED BY YOU, ARISING FROM YOUR ACCESS TO OR USE OF THE SERVICE.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto w-full max-w-5xl px-6 py-10 border-t border-gray-900 flex flex-col items-center gap-4 z-10">
        <div className="flex flex-wrap gap-6 justify-center text-xs text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="text-gray-800">•</span>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
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
