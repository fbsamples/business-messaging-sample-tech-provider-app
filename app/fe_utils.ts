// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


export async function feGraphApiPostWrapper(url: string, params = {}) {
    console.log('feApiPostWrapper:', 'url', url, 'params', params);
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params)
    });
    const data = await response.json();
    if (!response.ok) {
        const error = new Error(data.message || 'Request failed') as any;
        error.code = data.code || 'UNKNOWN_ERROR';
        error.message = data.message || 'An unexpected error occurred. Please try again.';
        throw error;
    }
    return data;
}