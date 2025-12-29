// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


'use client';

export default function BspBanner({ children }: { children: React.ReactNode }) {

    const banner = (
        <div className="mt-3 mb-3 border-dotted rounded-lg border px-5 py-4 border-gray-400 bg-gray-100 text-xs">
            {children}
        </div>
    );

    return (
        <>
            {banner}
        </>
    );
}
