// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import publicConfig from "../public_config";
import { getAppDetails } from "../api/be_utils";

export default async function LoggedOut() {
  const { app_id } = publicConfig;
  const appDetails = await getAppDetails(app_id);
  const app_name = appDetails.name;

  return (
    <main className="min-h-screen bg-[#edf2f7] flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{app_name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Developer Testing Environment
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Get started</h2>
          <p className="text-sm text-gray-500 mt-1">
            Log in to your account or create one to access the developer
            dashboard and test environment.
          </p>
        </div>

        {/* Log In Button - primary blue with icon */}
        <a
          href="/auth/login"
          className="flex items-center justify-between w-full px-5 py-4 bg-[#1877f2] text-white rounded-xl hover:bg-[#166fe5] active:bg-[#1565d8] transition-colors mb-4"
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <div>
              <div className="font-semibold text-sm">Log In</div>
              <div className="text-xs text-blue-100">Access your dashboard</div>
            </div>
          </div>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </a>

        {/* OR divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 uppercase">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Sign Up Button - outlined with icon */}
        <a
          href="/auth/login?screen_hint=signup"
          className="flex items-center justify-between w-full px-5 py-4 bg-white text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            <div>
              <div className="font-semibold text-sm">Sign Up</div>
              <div className="text-xs text-gray-400">Create a new account</div>
            </div>
          </div>
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </a>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-xs text-gray-400">
          This is a developer testing environment.
          <br />
          By continuing, you agree to the{" "}
          <a href="#" className="text-blue-500 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-blue-500 hover:underline">
            Privacy Policy
          </a>
          .
        </p>
        <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          Built on Meta Platform APIs
        </p>
      </div>
    </main>
  );
}
