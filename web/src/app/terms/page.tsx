"use client";

import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function TermsOfService() {
  const { theme, mounted, toggleTheme, colors } = useTheme();

  if (!mounted) {
    return <div className="bg-[#030303] min-h-screen" suppressHydrationWarning />;
  }

  return (
    <div className={theme === "dark" ? "dark" : ""}>
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
          Terms of Service
        </h1>
        <p className="text-xs text-gray-500 mb-12">Last Updated: June 29, 2026</p>

        <div className={`space-y-8 leading-relaxed text-sm ${
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        }`}>
          <p>
            These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and CloudCode, Inc. ("Company", "we", "us", or "our") governing your access to and use of the CloudCode mobile application (the "App"), our website located at https://cloudcode.app, and all related cloud development, container hosting, and artificial intelligence services (collectively, the "Service").
          </p>
          <p>
            Please read these Terms carefully before accessing or using the Service. By creating an account, authenticating via GitHub, or otherwise accessing the Service, you agree to be bound by these Terms. If you do not agree to all of these Terms, you are prohibited from using the Service.
          </p>

          <section>
            <h2 className={`text-lg font-bold mb-3 border-b pb-2 ${
              theme === "dark" 
                ? "text-white border-gray-800/80" 
                : "text-[#0F1115] border-gray-200"
            }`}>
              1. Eligibility & Authentication
            </h2>
            <p className="mb-4">
              To access and use the Service, you must be at least 13 years of age (or the minimum age of digital consent in your country). If you are under 18, you represent that you have received parental or guardian consent to use the Service.
            </p>
            <p>
              <strong>GitHub Authentication:</strong> The Service requires you to authenticate using your GitHub account. You are solely responsible for maintaining the security and confidentiality of your GitHub credentials. You agree that you are fully responsible for all activities, projects, and container sessions initiated under your account. We are not liable for any loss or damage arising from unauthorized access to your account.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 border-b pb-2 ${
              theme === "dark" 
                ? "text-white border-gray-800/80" 
                : "text-[#0F1115] border-gray-200"
            }`}>
              2. Acceptable Use of Cloud Sandboxes
            </h2>
            <p className="mb-4">
              CloudCode provides you with isolated, cloud-hosted Linux container environments ("Sandboxes") for software development, compilation, and testing. You are granted a limited, non-transferable, revocable license to use these Sandboxes.
            </p>
            <p className="mb-4">
              You agree that you will **NOT** use, nor allow any third party to use, the Sandboxes or the Service to:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 mb-4">
              <li>Engage in any form of cryptocurrency mining (including but not limited to Bitcoin, Ethereum, or Monero).</li>
              <li>Launch Denial of Service (DoS/DDoS) attacks, perform unauthorized port scanning, network sniffing, or distribute malware, trojans, or ransomware.</li>
              <li>Host phishing pages, engage in spamming, or distribute bulk unsolicited emails.</li>
              <li>Attempt to escape container isolation, exploit Linux kernel vulnerabilities, or gain unauthorized root access to our host servers.</li>
              <li>Store, share, or compile material that violates intellectual property rights or is otherwise illegal.</li>
              <li>Establish persistent reverse-shells or background daemons designed to bypass our inactivity timeout mechanisms.</li>
            </ul>
            <p>
              We reserve the right to monitor Sandbox CPU, RAM, and network activity. Any violation of this Acceptable Use Section will result in the **immediate termination** of your active Sandboxes and the permanent suspension of your account without prior warning.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 border-b pb-2 ${
              theme === "dark" 
                ? "text-white border-gray-800/80" 
                : "text-[#0F1115] border-gray-200"
            }`}>
              3. User Code & Intellectual Property
            </h2>
            <p className="mb-4">
              <strong>Ownership:</strong> You retain sole ownership and all intellectual property rights in and to any source code, project files, assets, or repositories that you write, import, compile, or deploy within our Sandboxes. CloudCode claims no ownership, license, or proprietary rights over your code.
            </p>
            <p>
              <strong>Responsibility:</strong> You represent and warrant that you own or have the necessary licenses, rights, and permissions to use and compile any code or repositories you import into the Service. You agree to indemnify and hold harmless CloudCode from any claims arising out of your violation of third-party intellectual property rights.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 border-b pb-2 ${
              theme === "dark" 
                ? "text-white border-gray-800/80" 
                : "text-[#0F1115] border-gray-200"
            }`}>
              4. Subscriptions, Resource Limits & Billing
            </h2>
            <p className="mb-4">
              Certain subscription tiers provide access to enhanced container resources (such as dedicated CPU cores, persistent SSD storage, or increased RAM limits).
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li><strong>Billing:</strong> Fees for paid subscription tiers are billed in advance on a recurring monthly or annual basis.</li>
              <li><strong>Cancellation:</strong> You can cancel your subscription at any time. Upon cancellation, your account will revert to the free tier at the end of your current billing cycle, and resources exceeding the free tier limits may be permanently deleted.</li>
              <li><strong>Refunds:</strong> All fees are non-refundable unless explicitly required by local consumer protection laws.</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 border-b pb-2 ${
              theme === "dark" 
                ? "text-white border-gray-800/80" 
                : "text-[#0F1115] border-gray-200"
            }`}>
              5. Account Deletion & Termination
            </h2>
            <p className="mb-4">
              You can terminate these Terms at any time by permanently deleting your account:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 mb-4">
              <li><strong>In-App:</strong> Under <span className={`font-medium ${theme === "dark" ? "text-white" : "text-black"}`}>Settings &gt; Profile &gt; Delete Account</span>.</li>
              <li><strong>Web:</strong> Via our secure <Link href="/delete-account" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline font-medium">Account Deletion Page</Link>.</li>
            </ul>
            <p>
              Upon deletion, your user profile, active container instances, workspace files, and billing history will be permanently and irreversibly destroyed. We reserve the right to suspend or terminate your account at our sole discretion, without notice, if you breach these Terms.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 border-b pb-2 ${
              theme === "dark" 
                ? "text-white border-gray-800/80" 
                : "text-[#0F1115] border-gray-200"
            }`}>
              6. Disclaimer of Warranties
            </h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, TIMELY, OR ERROR-FREE, OR THAT YOUR WORKSPACE FILES WILL NOT BE SUBJECT TO DATA LOSS. YOU ARE SOLELY RESPONSIBLE FOR MAINTAINING INDEPENDENT BACKUPS OF YOUR SOURCE CODE.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 border-b pb-2 ${
              theme === "dark" 
                ? "text-white border-gray-800/80" 
                : "text-[#0F1115] border-gray-200"
            }`}>
              7. Limitation of Liability
            </h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL CLOUDCODE, INC. OR ITS DIRECTORS, EMPLOYEES, OR PARTNERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 border-b pb-2 ${
              theme === "dark" 
                ? "text-white border-gray-800/80" 
                : "text-[#0F1115] border-gray-200"
            }`}>
              8. Contact Us
            </h2>
            <p>
              If you have any questions regarding these Terms, please contact us at <span className={`font-medium ${theme === "dark" ? "text-white" : "text-black"}`}>legal@cloudcode.app</span>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer theme={theme} colors={colors} toggleTheme={toggleTheme} />
    </div>
    </div>
  );
}
