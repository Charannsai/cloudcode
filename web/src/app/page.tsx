import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-[#030712] text-gray-100 min-h-screen flex flex-col items-center relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,rgba(0,0,0,0)_70%)] pointer-events-none z-0" />
      <div className="absolute top-[30%] right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,rgba(0,0,0,0)_70%)] pointer-events-none z-0" />

      {/* Header */}
      <header className="w-full max-w-5xl px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
            CloudCode
          </span>
          <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
            Beta
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
            Terms
          </Link>
          <Link href="/delete-account" className="text-xs font-semibold text-red-400 border border-red-500/30 hover:border-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-md bg-red-500/5 transition-all">
            Delete Account
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-5xl px-6 pt-20 pb-32 flex flex-col items-center text-center z-10">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl mb-6 bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent">
          The Next-Generation Cloud IDE in Your Pocket
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Provision isolated Linux sandboxes, write code with AI assistance, run root terminals, and preview deployments instantly from your mobile device.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 justify-center mb-16">
          <a href="#" className="bg-white text-[#030712] hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(255,255,255,0.25)] px-6 py-3.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-[0_4px_20px_rgba(255,255,255,0.15)] transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Download on Google Play
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="bg-white/5 text-white border border-gray-800 hover:border-gray-700 hover:bg-white/10 px-6 py-3.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            View on GitHub
          </a>
        </div>

        {/* Premium Interactive Mockup */}
        <div className="w-full max-w-3xl rounded-xl border border-gray-800 bg-[#0b0f19] p-2 shadow-2xl mb-24">
          <div className="rounded-lg border border-gray-800/50 bg-[#070913] overflow-hidden">
            {/* Window Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0c0f1d] border-b border-gray-800/60">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-gray-500 font-mono">sandbox-node-1 (CloudCode Terminal)</span>
              <div className="w-12" />
            </div>
            {/* Terminal Body */}
            <div className="p-5 text-left font-mono text-xs md:text-sm space-y-3 min-h-[220px]">
              <div className="text-gray-500"># Setting up container environment...</div>
              <div className="text-indigo-400">✓ Container initialized successfully</div>
              <div className="text-cyan-400">✓ Node.js compiler v20.10.0 ready</div>
              <div className="flex items-center gap-2 pt-2">
                <span className="text-green-400">root@cloudcode:~$</span>
                <span className="text-white">npm run dev</span>
              </div>
              <div className="text-gray-400 pl-4">
                &gt; cloudcode-app@1.0.0 dev
                <br />
                &gt; next dev -p 3000
              </div>
              <div className="text-green-400 pl-4">
                ready - started server on 0.0.0.0:3000, url: http://localhost:3000
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-green-400">root@cloudcode:~$</span>
                <span className="w-2 h-4 bg-indigo-500 animate-pulse inline-block" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {/* Feature 1 */}
          <div className="bg-[#0f172a] border border-gray-800 hover:border-indigo-500/50 p-8 rounded-2xl transition-all duration-300">
            <div className="w-11 h-11 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="12" x="2" y="9" rx="2" />
                <path d="M9 22V9M15 22V9M2 13h20" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Isolated Linux Sandboxes</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Spin up secure, dedicated cloud containers instantly. Run compilers, install packages, and manage files with full root authority.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#0f172a] border border-gray-800 hover:border-cyan-500/50 p-8 rounded-2xl transition-all duration-300">
            <div className="w-11 h-11 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">AI Pair Programming</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Work alongside collaborative LLM agents. Describe the feature you want in plain English or voice commands and watch it build.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#0f172a] border border-gray-800 hover:border-pink-500/50 p-8 rounded-2xl transition-all duration-300">
            <div className="w-11 h-11 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center mb-6">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 17l6-6-6-6M12 19h8" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Professional Shell & Git</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Write commits, manage branches, and open pull requests. Experience a fully responsive multi-shell terminal optimized for mobile.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto w-full max-w-5xl px-6 py-10 border-t border-gray-900 flex flex-col items-center gap-4 z-10">
        <div className="flex flex-wrap gap-6 justify-center text-xs text-gray-400">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
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
