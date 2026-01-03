// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


"use server";

const privateConfig =
{
    "fb_app_secret": process.env.FB_APP_SECRET,
    "fb_reg_pin": process.env.FB_REG_PIN,
    "fb_verify_token": process.env.FB_VERIFY_TOKEN
}

export default async function getPrivateConfig() {
    return privateConfig;
};
