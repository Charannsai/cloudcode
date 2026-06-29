"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface DecodedUser {
  id: string;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string;
}

function DeleteAccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<DecodedUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Check for token and decode user info on mount
  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      try {
        // Decode JWT payload client-side
        const base64Url = tokenParam.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          window
            .atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const decoded = JSON.parse(jsonPayload) as DecodedUser;
        setUser(decoded);
        
        // Clean up the URL token query param for safety
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error("Failed to decode token:", err);
        setError("Invalid session token. Please try signing in again.");
      }
    }
  }, [searchParams]);

  const handleGitHubLogin = () => {
    setLoading(true);
    const redirectUri = encodeURIComponent(window.location.origin + "/delete-account");
    window.location.href = `${API_URL}/cc-api/auth/github?redirect_uri=${redirectUri}`;
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/cc-api/user`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete account. Please try again.");
      }

      setDeleted(true);
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error("Deletion error:", err);
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setToken(null);
    setUser(null);
    router.push("/");
  };

  return (
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

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {deleted ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h3 className="text-green-400 font-bold text-lg">Account Deleted Successfully</h3>
          <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
            Your CloudCode account, active container sessions, workspace files, and database records have been permanently erased.
          </p>
          <div className="pt-2">
            <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300 underline">
              Return to Home
            </Link>
          </div>
        </div>
      ) : user ? (
        // Authenticated Deletion Screen
        <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-4">
            {user.avatar_url && (
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-12 h-12 rounded-full border border-gray-850"
              />
            )}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Authenticated User</div>
              <div className="text-sm font-bold text-white">@{user.login}</div>
              {user.email && <div className="text-xs text-gray-500">{user.email}</div>}
            </div>
          </div>

          <div className="border-t border-gray-850 pt-4">
            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              To complete the deletion process, please confirm that you want to delete your account. All running container instances, active billing plans, and code files will be destroyed immediately.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete My Account"
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={deleting}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Unauthenticated Login Screen
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
            <h2 className="text-lg font-bold text-white mb-3">Option 2: Sign In via Web to Delete</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              If you no longer have the app installed, please sign in with the GitHub account associated with your CloudCode profile to verify your identity and authorize the deletion request.
            </p>

            <button
              onClick={handleGitHubLogin}
              disabled={loading}
              className="w-full bg-white text-[#030712] hover:bg-gray-100 font-semibold py-3.5 px-4 rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                  Sign in with GitHub
                </>
              )}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

export default function DeleteAccount() {
  return (
    <div className="bg-[#030712] text-gray-100 min-h-screen flex flex-col items-center relative overflow-x-hidden font-sans">
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

      {/* Suspense Wrapper is required when using useSearchParams in Next.js App Router */}
      <Suspense fallback={
        <main className="w-full max-w-2xl px-6 pt-16 pb-32 flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
        </main>
      }>
        <DeleteAccountContent />
      </Suspense>

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
