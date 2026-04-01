// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use server';

const privateConfig = {
  fbAppSecret: process.env.FB_APP_SECRET,
  fbRegPin: process.env.FB_REG_PIN,
  fbVerifyToken: process.env.FB_VERIFY_TOKEN,
  ablyKey: process.env.ABLY_KEY,
};

export default async function getPrivateConfig() {
  return privateConfig;
}
