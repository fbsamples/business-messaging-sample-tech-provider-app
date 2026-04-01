// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  eslint: {

  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'scontent.xx.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: '*.facebook.com',
      },
    ],
  },
};

export default nextConfig;
