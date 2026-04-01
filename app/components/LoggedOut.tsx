// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import publicConfig from '@/app/publicConfig';
import { getAppDetails } from '@/app/api/beUtils';

export default async function LoggedOut() {
  const { appId } = publicConfig;
  const appDetails = await getAppDetails(appId);
  const appName = appDetails.name;

  return (
    <main className="min-h-screen bg-[#e8edf2] flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{appName}</h1>
        <p className="text-sm text-gray-500 mt-1">Developer Testing Environment</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Get started</h2>
          <p className="text-sm text-gray-500 mt-1.5">
            Log in to your account or create one to access the developer dashboard and test environment.
          </p>
        </div>

        {/* Log In Button */}
        <a
          href="/auth/login"
          className="flex items-center justify-between w-full px-5 py-4 bg-[#2563a8] text-white rounded-xl hover:bg-[#1d5296] active:bg-[#174a8a] transition-colors mb-4"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <div>
              <div className="font-bold text-base leading-tight">Log In</div>
              <div className="text-xs text-blue-200 leading-tight">Access your dashboard</div>
            </div>
          </div>
          <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>

        {/* OR divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium tracking-widest">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Sign Up Button */}
        <a
          href="/auth/login?screen_hint=signup"
          className="flex items-center justify-between w-full px-5 py-4 bg-white text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#2563a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            <div>
              <div className="font-bold text-base text-gray-900 leading-tight">Sign Up</div>
              <div className="text-xs text-gray-400 leading-tight">Create a new account</div>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-xs text-gray-500">
          This is a developer testing environment.
          <br />
          By continuing, you agree to the{' '}
          <a
            href="https://opensource.fb.com/legal/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="https://opensource.fb.com/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Privacy Policy
          </a>
          .
        </p>
        <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Built on Meta Platform APIs
        </p>
      </div>
    </main>
  );
}
