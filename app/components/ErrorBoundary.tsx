// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Red accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />

              <div className="px-8 pt-8 pb-6">
                {/* Icon */}
                <div className="flex justify-center mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-red-600"
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
                </div>

                {/* Message */}
                <div className="text-center mb-6">
                  <h1 className="text-xl font-bold text-gray-900 mb-2">
                    Something went wrong
                  </h1>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    An unexpected error occurred. Try refreshing the page. If
                    the problem persists, check the browser console for details.
                  </p>
                </div>

                {/* Error detail */}
                {this.state.error && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                    <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap break-words">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                )}

                {/* Actions */}
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 active:bg-gray-950 transition-colors shadow-sm"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
