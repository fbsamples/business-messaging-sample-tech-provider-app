// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


"use server";

import checkEnvironmentVariables from "./env_checker";

// Define all required environment variables
const requiredEnvVars = {
    FB_APP_SECRET: process.env.FB_APP_SECRET,
    FB_SUAT: process.env.FB_SUAT,
    FB_REG_PIN: process.env.FB_REG_PIN,
    FB_VERIFY_TOKEN: process.env.FB_VERIFY_TOKEN,
    AUTH0_SECRET: process.env.AUTH0_SECRET,
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
};

// check if all required env vars are set
checkEnvironmentVariables(requiredEnvVars);

const privateConfig =
{
    "fb_app_secret": process.env.FB_APP_SECRET,
    "fb_reg_pin": process.env.FB_REG_PIN,
    "fb_verify_token": process.env.FB_VERIFY_TOKEN,
    "fb_suat": process.env.FB_SUAT
}

export default async function getPrivateConfig() {
    return privateConfig;
};