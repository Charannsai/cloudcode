"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function DeleteAccount() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) return;

    // Simulate sending request to the backend API or support email
    console.log("Account Deletion Requested for:", { username, email });
    setSubmitted(true);
  };

  return (
    <div className="bg-[#030712] text-gray-100 min-h-screen flex flex-col items-center relative overflow-x-hidden font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(248,81,73,0.08)_0%,rgba(0,0,0,0)_70%)] pointer-events-none z-0" />

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
          <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
            Terms
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-2xl px-6 pt-16 pb-32 text-left z-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
          Delete Your Account & Data
        </h1>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          Under Google Play policies, we provide a way for you to delete your account and all associated personal and sensitive data.
        </p>

        {/* Warning Box */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 mb-8 flex gap-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2" className="flex-shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
          </svg>
          <div>
            <h4 className="text-red-400 font-bold text-sm mb-1">Warning: This action is permanent and irreversible</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Deleting your account will immediately and permanently destroy your user profile, active container sandboxes, all project files, Git configurations, and billing history. This data cannot be recovered.
            </p>
          </div>
        </div>

        {!submitted ? (
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-bold text-white mb-3">Option 1: Delete Instantly In-App (Recommended)</h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                The fastest way to delete your account and instantly wipe all container environments is from within the CloudCode mobile app:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-400 pl-2">
                <li>Open the <span className="text-white">CloudCode</span> app on your mobile device.</li>
                <li>Go to the <span className="text-white">Settings</span> tab.</li>
                <li>Tap on your <span className="text-white">Profile</span> card at the top.</li>
                <li>Scroll to the bottom and tap <span className="text-red-400 font-medium">Delete Account</span>.</li>
                <li>Confirm your choice. Your account and all data will be deleted instantly.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">Option 2: Request Deletion via Web</h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                If you no longer have the app installed, you can submit a deletion request using the form below. Once submitted, our systems will process the request and delete your account and all associated data within 24 hours.
              </p>

              <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                      GitHub Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. octocat"
                      className="w-full px-4 py-3 rounded-lg border border-gray-800 bg-gray-950/20 text-sm text-white focus:outline-none focus:border-indigo-500 focus:bg-gray-950/45 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                      Email Address associated with GitHub
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. octocat@github.com"
                      className="w-full px-4 py-3 rounded-lg border border-gray-800 bg-gray-950/20 text-sm text-white focus:outline-none focus:border-indigo-500 focus:bg-gray-950/45 transition-all"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      Request Account & Data Deletion
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3 className="text-green-400 font-bold text-lg">Deletion Request Received</h3>
            <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
              Your request to delete your account and associated data has been submitted successfully. Our systems will process this and permanently erase all your data within 24 hours. You will receive an email confirmation once the process is complete.
            </p>
            <div className="pt-2">
              <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300 underline">
                Return to Home
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto w-full max-w-5xl px-6 py-10 border-t border-gray-900 flex flex-col items-center gap-4 z-10">
        <div className="flex flex-wrap gap-6 justify-center text-xs text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="text-gray-800">•</span>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
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
