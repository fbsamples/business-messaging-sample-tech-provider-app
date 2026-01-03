// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


/* eslint-disable */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import ErrorBoundary from "@/app/components/ErrorBoundary";
import MissingEnvVars from "@/app/components/MissingEnvVars";
import { getMissingEnvVars, MissingEnvVarInfo } from "@/app/env_checker";

const inter = Inter({ subsets: ["latin"] });

// TODO: Add metadata to env vars
export const metadata: Metadata = {
  title: "Sample Tech Provider",
  description:
    "A sample tech provider that allows for easy instantiation by developers, and easy testing of Meta Business products, onboarding. and APIs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check for missing environment variables
  const missingEnvVars: MissingEnvVarInfo[] = getMissingEnvVars();

  // If there are missing environment variables, show the error page
  if (missingEnvVars.length > 0) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <MissingEnvVars missingVars={missingEnvVars} />
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="lazyOnload"
      />

      <body className={inter.className}>
        <ErrorBoundary>{children}</ErrorBoundary>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
