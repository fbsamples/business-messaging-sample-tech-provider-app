// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


'use client';

import type { ReactNode } from 'react';

interface CopyableProps {
    text_to_copy: string;
    children: ReactNode;
}

export default function Copyable({ text_to_copy, children }: CopyableProps) {

    const copy = (text: string) => {
        navigator.clipboard.writeText(text)
    };

    return (
        <div onClick={() => copy(text_to_copy)} >
            {children}
        </div>
    )
}
