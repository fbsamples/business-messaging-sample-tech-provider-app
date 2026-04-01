// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useState } from 'react';
import type { MissingEnvVarInfo } from '@/app/envChecker';

// Group definitions with label, color badge, and variable keys
const ENV_VAR_GROUPS: { label: string; color: string; textColor: string; keys: string[] }[] = [
  {
    label: 'Facebook / Meta API',
    color: 'bg-blue-600',
    textColor: 'text-white',
    keys: ['FB_APP_ID', 'FB_APP_SECRET', 'FB_GRAPH_API_VERSION', 'FB_REG_PIN', 'FB_VERIFY_TOKEN'],
  },
  {
    label: 'Auth0 Authentication',
    color: 'bg-orange-500',
    textColor: 'text-white',
    keys: ['APP_BASE_URL', 'AUTH0_DOMAIN', 'AUTH0_SECRET', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET'],
  },
  {
    label: 'Database & Services',
    color: 'bg-emerald-600',
    textColor: 'text-white',
    keys: ['POSTGRES_URL', 'ABLY_KEY', 'TP_CONTACT_EMAIL'],
  },
];

// Friendly descriptions matching the Figma
const FRIENDLY_DESCRIPTIONS: { [key: string]: string } = {
  FB_APP_ID: 'Facebook App ID for the application',
  FB_APP_SECRET: 'Facebook App Secret — keep out of source control',
  FB_GRAPH_API_VERSION: 'Facebook Graph API version to use (e.g., v19.0)',
  FB_REG_PIN: 'Facebook Registration PIN',
  FB_VERIFY_TOKEN: 'Facebook Webhook Verify Token',
  APP_BASE_URL: 'Base URL of the application (e.g., http://localhost:3000)',
  AUTH0_DOMAIN: 'Auth0 domain (e.g., your-tenant.auth0.com)',
  AUTH0_SECRET: 'Auth0 secret for session encryption',
  AUTH0_CLIENT_ID: 'Auth0 client ID',
  AUTH0_CLIENT_SECRET: 'Auth0 client secret',
  POSTGRES_URL: 'PostgreSQL connection URL (auto-configured on Vercel)',
  ABLY_KEY: 'Ably API key for real-time messaging',
  TP_CONTACT_EMAIL: 'Contact email displayed in the application',
};

function copyToClipboard(text: string) {
  try {
    navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={`inline-flex items-center gap-1 text-xs font-medium rounded px-1.5 py-0.5 transition-colors flex-shrink-0 ${
        copied ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'
      }`}
      title="Copy"
    >
      {copied ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
}

interface GroupRowProps {
  group: (typeof ENV_VAR_GROUPS)[0];
  missingKeys: string[];
  missingVars: MissingEnvVarInfo[];
  isOpen: boolean;
  onToggle: () => void;
}

function GroupRow({ group, missingKeys, missingVars, isOpen, onToggle }: GroupRowProps) {
  const initial = group.label.charAt(0);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Group header — clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-7 h-7 rounded-lg ${group.color} ${group.textColor} flex items-center justify-center text-xs font-bold flex-shrink-0`}
          >
            {initial}
          </span>
          <span className="text-sm font-semibold text-gray-800">{group.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {missingKeys.length} variable{missingKeys.length !== 1 ? 's' : ''}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Variable rows */}
      {isOpen && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {missingKeys.map((key) => {
            const varInfo = missingVars.find((v) => v.name === key);
            const desc = FRIENDLY_DESCRIPTIONS[key] || varInfo?.description || '';
            return (
              <div key={key} className="flex items-start gap-4 px-5 py-3.5 bg-white">
                <div className="w-1 h-full self-stretch flex-shrink-0 flex items-start pt-1">
                  <div className="w-1 h-4 bg-red-400 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-600 font-mono">{key}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface MissingEnvVarsProps {
  missingVars: MissingEnvVarInfo[];
}

export default function MissingEnvVars({ missingVars }: MissingEnvVarsProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const missingNames = new Set(missingVars.map((v) => v.name));

  // Build initial open state — all groups with missing vars open by default
  const groupsWithMissing = ENV_VAR_GROUPS.map((group) => ({
    ...group,
    missingKeys: group.keys.filter((k) => missingNames.has(k)),
  })).filter((g) => g.missingKeys.length > 0);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(groupsWithMissing.map((g) => g.label)));

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const envTemplate = missingVars.map((v) => `# ${v.description}\n${v.name}=`).join('\n\n');

  const handleCopyAll = () => {
    copyToClipboard(envTemplate);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#f2f2f2] flex flex-col font-sans">
      {/* ── Top nav bar ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-900">Sample App</span>
          <span className="text-gray-300 mx-1">|</span>
          <span className="text-gray-500">Developer Environment</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/auth/logout"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Login
          </a>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            Configuration Error
          </span>
        </div>
      </div>

      {/* ── Alert banner ── */}
      <div className="bg-red-50 border-b border-red-100 px-6 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-sm text-gray-800">
            <span className="font-semibold text-red-600">Missing Environment Variables</span> The application cannot
            start — <span className="font-semibold">{missingVars.length} required variables</span> are not configured.
          </p>
        </div>
      </div>

      {/* ── Main two-column content ── */}
      <div className="flex-1 px-6 py-6">
        <div className="max-w-5xl mx-auto flex gap-5 items-start">
          {/* Left: Required Variables */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h2 className="text-sm font-semibold text-gray-700">Required Variables</h2>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                {missingVars.length} missing
              </span>
            </div>

            <div className="space-y-3">
              {groupsWithMissing.map((group) => (
                <GroupRow
                  key={group.label}
                  group={group}
                  missingKeys={group.missingKeys}
                  missingVars={missingVars}
                  isOpen={openGroups.has(group.label)}
                  onToggle={() => toggleGroup(group.label)}
                />
              ))}
            </div>
          </div>

          {/* Right: How to Fix + Quick Start + Docs */}
          <div className="w-72 flex-shrink-0 space-y-4">
            {/* How to Fix */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                How to Fix
              </h3>
              <ol className="space-y-3.5 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Create a{' '}
                    <code className="text-xs bg-gray-100 text-gray-800 px-1 py-0.5 rounded font-mono">.env.local</code>{' '}
                    file in your project root directory
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <span>Add the missing environment variables listed on the left</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <span>Restart your development server</span>
                </li>
              </ol>
            </div>

            {/* Quick Start */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-gray-400 font-mono text-base leading-none">&gt;_</span>
                Quick Start
              </h3>
              <p className="text-xs text-gray-500 mb-2">Copy the example env file and fill in your values:</p>
              <div className="bg-gray-900 rounded-lg px-3.5 py-2.5 flex items-center justify-between mb-3">
                <code className="text-xs font-mono text-gray-100">cp .env.example .env.local</code>
                <CopyButton text="cp .env.example .env.local" />
              </div>
              <p className="text-xs text-gray-500 mb-2">Then restart:</p>
              <div className="bg-gray-900 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
                <code className="text-xs font-mono text-gray-100">
                  <span className="text-green-400">npm</span> run dev
                </code>
                <CopyButton text="npm run dev" />
              </div>
            </div>

            {/* View Setup Documentation */}
            <a
              href="https://github.com/fbsamples/business-messaging-sample-tech-provider-app#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700">View Setup Documentation</span>
              </div>
              <svg
                className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>

            {/* Copy All Variables */}
            <button
              onClick={handleCopyAll}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {copiedAll ? 'Copied!' : 'Copy All Variables'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
