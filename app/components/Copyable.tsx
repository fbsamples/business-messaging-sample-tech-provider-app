// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


'use client';

export default function Copyable({ text_to_copy, children }) {

    const copy = (text_to_copy) => {
        navigator.clipboard.writeText(text_to_copy)
    };

    return (
        <div onClick={() => copy(text_to_copy)} >
            {children}
        </div>
    )
}
