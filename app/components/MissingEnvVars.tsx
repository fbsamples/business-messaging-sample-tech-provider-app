// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

"use client";

import { useState } from "react";
import { MissingEnvVarInfo } from "../env_checker";

const ENV_VAR_GROUPS: { label: string; keys: string[] }[] = [
  {
    label: "Facebook / Meta API",
    keys: [
      "FB_APP_ID",
      "FB_APP_SECRET",
      "FB_BUSINESS_ID",
      "FB_GRAPH_API_VERSION",
      "FB_REG_PIN",
      "FB_VERIFY_TOKEN",
    ],
  },
  {
    label: "Auth0 Authentication",
    keys: [
      "APP_BASE_URL",
      "AUTH0_DOMAIN",
      "AUTH0_SECRET",
      "AUTH0_CLIENT_ID",
      "AUTH0_CLIENT_SECRET",
    ],
  },
  {
    label: "Database & Services",
    keys: ["POSTGRES_URL", "ABLY_KEY", "TP_CONTACT_EMAIL"],
  },
];

function copyToClipboard(text: string) {
  try {
    navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2 py-1 transition-colors ${
        copied
          ? "text-green-600 bg-green-50"
          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
      }`}
      title="Copy to clipboard"
    >
      {copied ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
      {label && <span>{copied ? "Copied!" : label}</span>}
    </button>
  );
}

interface MissingEnvVarsProps {
  missingVars: MissingEnvVarInfo[];
}

export default function MissingEnvVars({ missingVars }: MissingEnvVarsProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const missingNames = new Set(missingVars.map((v) => v.name));

  const envTemplate = missingVars
    .map((v) => `# ${v.description}\n${v.name}=`)
    .join("\n\n");

  const handleCopyAll = () => {
    copyToClipboard(envTemplate);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const groupsWithMissing = ENV_VAR_GROUPS.map((group) => ({
    ...group,
    missingKeys: group.keys.filter((k) => missingNames.has(k)),
  })).filter((group) => group.missingKeys.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-900">Sample App</span>
          <span className="text-gray-300">&gt;</span>
          <span className="text-gray-500">Developer Testing Environment</span>
        </div>
        <a
          href="https://github.com/fbsamples/business-messaging-sample-tech-provider-app#readme"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Configuration Required
        </a>
      </div>

      {/* Red alert banner */}
      <div className="bg-red-50 border-b border-red-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-red-800">
                Missing Environment Variables
              </span>
              <span className="text-red-600 ml-1">
                — The application cannot start.{" "}
                <span className="font-semibold">
                  {missingVars.length} required variables
                </span>{" "}
                are not configured.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <button
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copiedAll ? "Copied!" : "Copy All"}
            </button>
            <a
              href="https://github.com/fbsamples/business-messaging-sample-tech-provider-app#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Setup Documentation
            </a>
          </div>
        </div>
      </div>

      {/* Main content - two columns */}
      <div className="flex-1 px-6 py-6">
        <div className="max-w-6xl mx-auto flex gap-6">
          {/* Left column: Required Variables */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Required Variables
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {groupsWithMissing.map((group) => (
                  <div key={group.label} className="px-6 py-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-semibold text-gray-700">
                        {group.label}
                      </span>
                      <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                        {group.missingKeys.length} required
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.missingKeys.map((key) => {
                        const varInfo = missingVars.find((v) => v.name === key);
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-2.5"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                              <code className="text-sm font-mono text-white font-medium">
                                {key}
                              </code>
                              <span className="text-xs text-gray-400 truncate hidden sm:inline">
                                {varInfo?.description}
                              </span>
                            </div>
                            <CopyButton text={`${key}=`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: How to Fix + Quick Start */}
          <div className="w-72 flex-shrink-0 space-y-4">
            {/* How to Fix */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How to Fix
              </h3>
              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Create a{" "}
                    <code className="text-xs bg-gray-100 text-gray-800 px-1 py-0.5 rounded font-mono">
                      .env.local
                    </code>{" "}
                    file in your project root
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <span>Add the missing environment variables listed</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <span>Restart your development server</span>
                </li>
              </ol>
            </div>

            {/* Quick Start */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Quick Start
              </h3>
              <div className="bg-gray-900 rounded-lg px-4 py-3 flex items-center justify-between">
                <code className="text-xs font-mono text-green-400">
                  cp .env.example .env.local
                </code>
                <CopyButton text="cp .env.example .env.local" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                onClick={handleCopyAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copiedAll ? "Copied!" : "Copy All Variables"}
              </button>
              <a
                href="https://github.com/fbsamples/business-messaging-sample-tech-provider-app#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Documentation
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs text-gray-400">
            Sample App &bull; Developer Testing Environment
          </p>
        </div>
      </div>
    </div>
  );
}
