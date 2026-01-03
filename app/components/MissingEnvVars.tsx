// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { MissingEnvVarInfo } from "../env_checker";

interface MissingEnvVarsProps {
  missingVars: MissingEnvVarInfo[];
}

export default function MissingEnvVars({ missingVars }: MissingEnvVarsProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Missing Environment Variables
          </h1>
          <p className="text-gray-600">
            The application cannot start because some required environment
            variables are not configured.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Required Variables ({missingVars.length})
          </h2>
          <ul className="space-y-3">
            {missingVars.map((envVar) => (
              <li
                key={envVar.name}
                className="bg-white rounded-lg p-4 border border-red-100"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                  </div>
                  <div>
                    <code className="text-sm font-mono font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                      {envVar.name}
                    </code>
                    <p className="text-sm text-gray-600 mt-1">
                      {envVar.description}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            How to Fix
          </h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </span>
              <span>
                Create a{" "}
                <code className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-sm font-mono">
                  .env.local
                </code>{" "}
                file in your project root directory
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </span>
              <span>Add the missing environment variables listed above</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </span>
              <span>Restart your development server</span>
            </li>
          </ol>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-500 text-center">
            💡 Tip: You can copy{" "}
            <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">
              .env.example
            </code>{" "}
            to{" "}
            <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">
              .env.local
            </code>{" "}
            and fill in the values if an example file exists.
          </p>
        </div>
      </div>
    </div>
  );
}
