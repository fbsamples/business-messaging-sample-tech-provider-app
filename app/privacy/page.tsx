// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Privacy Policy</h1>
        <p className="text-[14px] text-gray-500 leading-relaxed mb-6">
          This is a placeholder page. As the operator of this application, you are responsible for providing your own Privacy Policy that complies with applicable laws and Meta&apos;s platform policies.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-left mb-6">
          <p className="text-[13px] font-semibold text-amber-800 mb-1">Action required</p>
          <p className="text-[12px] text-amber-700 leading-relaxed">
            Replace the content of <code className="bg-amber-100 px-1 rounded font-mono text-[11px]">app/privacy/page.tsx</code> with your own Privacy Policy before deploying to production. This URL (<code className="bg-amber-100 px-1 rounded font-mono text-[11px]">/privacy</code>) can be referenced in your Meta app configuration and Embedded Signup setup.
          </p>
        </div>
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-[13px] font-semibold rounded-full hover:bg-slate-700 transition-colors">
          ← Back to app
        </Link>
      </div>
    </main>
  );
}
