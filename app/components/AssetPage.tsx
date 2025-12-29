// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { ReactNode } from 'react';
import Header from '@/app/components/Header';

interface AssetPageProps {
    title: string;
    user_id: string;
    children: ReactNode;
    emptyMessage?: string;
    isEmpty?: boolean;
}

export default function AssetPage({
    title,
    user_id,
    children,
    emptyMessage = "No items found.",
    isEmpty = false
}: AssetPageProps) {
    return (
        <div className="min-h-screen">
            <Header user_id={user_id} />
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">{title}</h1>
                {isEmpty ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">{emptyMessage}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
