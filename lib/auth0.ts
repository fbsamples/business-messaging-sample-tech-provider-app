// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Auth0Client } from '@auth0/nextjs-auth0/server';

const _auth0 = new Auth0Client();

const bypassAuth = process.env.BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock session for local dev bypass
const mockSession: any = {
  user: {
    email: process.env.TP_CONTACT_EMAIL ?? 'dev@localhost',
    name: 'Local Dev User',
    sub: 'local-dev',
  },
};

export const auth0 = bypassAuth
  ? {
      ..._auth0,
      getSession: async () => mockSession,
      middleware: _auth0.middleware.bind(_auth0),
    }
  : _auth0;
