"use client";

import React, { useState } from "react";
import { ScrollReveal } from "../ui/ScrollReveal";

const FAQS = [
  {
    q: "What is CloudCode?",
    a: "CloudCode is a cloud-powered development environment that lets you write, run, debug, and deploy applications from anywhere. Every workspace runs inside an isolated container with a full development environment, integrated terminal, AI assistance, Git support, and live previews."
  },
  {
    q: "Do I need to install anything?",
    a: "No. CloudCode runs entirely in the cloud. Simply create a workspace and start coding instantly without installing SDKs, compilers, or language runtimes on your device."
  },
  {
    q: "How fast are workspaces created?",
    a: "Most workspaces are ready within a few seconds. CloudCode provisions isolated development containers on demand so you can start building almost immediately."
  },
  {
    q: "Which programming languages are supported?",
    a: "CloudCode supports virtually any language that can run inside a Linux container, including: JavaScript / TypeScript, Python, Java, Go, Rust, PHP, C / C++, Ruby, Node.js, Bun, and Deno. You can also install additional runtimes inside your workspace."
  },
  {
    q: "Can I connect my GitHub repositories?",
    a: "Yes. You can connect your GitHub account, clone repositories, commit changes, create branches, and push updates directly from CloudCode."
  },
  {
    q: "Is every workspace isolated?",
    a: "Absolutely. Every project runs inside its own secure container with isolated storage, processes, and networking to ensure security and consistency."
  },
  {
    q: "Can I use CloudCode from my phone or tablet?",
    a: "Yes. CloudCode is designed with a mobile-first experience while still providing professional developer tools. You can code, run terminals, preview applications, and manage projects from virtually any device."
  },
  {
    q: "Does CloudCode include AI?",
    a: "Yes. CloudCode includes an integrated AI coding assistant that can generate code, explain code, fix bugs, refactor files, generate tests, answer project questions, and assist directly inside your workspace."
  },
  {
    q: "Can I choose my own AI model?",
    a: "Yes. Depending on your plan, you can use CloudCode's built-in AI models or connect your own API keys for supported providers."
  },
  {
    q: "Is my source code private?",
    a: "Yes. Your code remains private. CloudCode does not use your private repositories to train public AI models, and all workspaces run in isolated environments with encrypted communication."
  },
  {
    q: "Does CloudCode support Docker?",
    a: "Yes. Since every workspace runs inside a containerized environment, you can work with Docker-based projects and custom development environments where supported."
  },
  {
    q: "Can I install packages and dependencies?",
    a: "Absolutely. You have full terminal access, allowing you to install packages, libraries, frameworks, and tools just as you would on a local Linux machine."
  },
  {
    q: "Can I preview my application?",
    a: "Yes. CloudCode provides live application previews so you can instantly test web applications while developing."
  },
  {
    q: "Does CloudCode include a terminal?",
    a: "Yes. Every workspace includes a fully featured Linux terminal with package managers, compilers, shells, and common developer utilities pre-installed."
  },
  {
    q: "Can I import an existing project?",
    a: "Yes. You can import projects from GitHub or upload your own code to continue development without changing your workflow."
  },
  {
    q: "Is there a free plan?",
    a: "Yes. CloudCode offers a free tier so you can explore the platform and start building without a credit card. Paid plans unlock additional compute resources, AI usage, storage, and collaboration features."
  },
  {
    q: "Who is CloudCode built for?",
    a: "CloudCode is designed for individual developers, students, open-source contributors, freelancers, startup teams, and enterprise engineering teams. Whether you're building your first app or managing production systems, CloudCode provides a consistent development environment."
  },
  {
    q: "Why choose CloudCode over a local development setup?",
    a: "CloudCode eliminates environment setup, dependency conflicts, and machine limitations. Every workspace is reproducible, accessible from anywhere, and ready to code in seconds, allowing you to focus on building instead of configuring."
  }
];

interface FaqsProps {
  colors: {
    border: string;
    text: string;
    textSecondary: string;
  };
}

export function Faqs({ colors }: FaqsProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAllFaq, setShowAllFaq] = useState(false);

  return (
    <section className="w-full max-w-2xl px-6 py-28 z-10">
      <ScrollReveal>
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tighter">{"Frequently Asked Questions"}</h2>
        </div>
      </ScrollReveal>

      <div className="relative">
        <div className={`transition-all duration-500 overflow-hidden ${!showAllFaq ? "max-h-[480px]" : "max-h-none pb-12"}`}>
          {FAQS.map((faq, idx) => (
            <ScrollReveal key={idx} delay={(idx % 10) * 50}>
              <div className={`border-b ${colors.border} py-1`}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full py-4 flex justify-between items-center text-left cursor-pointer transition-all duration-250 group"
                >
                  <span className={`text-[13px] md:text-sm font-medium tracking-tight ${colors.text} group-hover:text-zinc-500 dark:group-hover:text-white transition-colors`}>
                    {faq.q}
                  </span>
                  <svg 
                    className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-300 ml-4 ${openFaq === idx ? "rotate-180" : ""}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${openFaq === idx ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <div className={`pb-4 pt-1 text-xs md:text-sm ${colors.textSecondary} leading-relaxed font-light`}>
                      {faq.a}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Faded Background & Show More Button */}
        {!showAllFaq && (
          <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-[#FAFAFA] dark:from-[#030303] via-[#FAFAFA]/90 dark:via-[#030303]/90 to-transparent flex items-end justify-center pb-2 z-20 pointer-events-none">
            <div className="pointer-events-auto w-full flex items-center gap-4">
              <div className={`flex-grow border-t ${colors.border}`}></div>
              <button 
                onClick={() => setShowAllFaq(true)}
                className="px-6 py-2 bg-[#FAFAFA] dark:bg-[#030303] hover:bg-[#F3F4F6] dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-xs font-bold transition-all cursor-pointer text-zinc-900 dark:text-zinc-50 shadow-md whitespace-nowrap"
              >
                {"Show More FAQs"}
              </button>
              <div className={`flex-grow border-t ${colors.border}`}></div>
            </div>
          </div>
        )}

        {showAllFaq && (
          <div className="flex items-center w-full gap-4 mt-6">
            <div className={`flex-grow border-t ${colors.border}`}></div>
            <button 
              onClick={() => setShowAllFaq(false)}
              className="px-6 py-2 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-xs font-bold transition-all cursor-pointer text-zinc-900 dark:text-zinc-50 whitespace-nowrap"
            >
              {"Show Less FAQs"}
            </button>
            <div className={`flex-grow border-t ${colors.border}`}></div>
          </div>
        )}
      </div>
    </section>
  );
}
