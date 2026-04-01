// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

import './globals.css';
import ErrorBoundary from '@/app/components/ErrorBoundary';
import MissingEnvVars from '@/app/components/MissingEnvVars';
import { getMissingEnvVars, type MissingEnvVarInfo } from '@/app/envChecker';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sample Tech Provider',
  description:
    'A sample tech provider that allows for easy instantiation by developers, and easy testing of Meta Business products, onboarding. and APIs',
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
        <body className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
          <MissingEnvVars missingVars={missingEnvVars} />
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <Script src="https://connect.facebook.net/en_US/sdk.js" strategy="afterInteractive" />

      <body className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ErrorBoundary>{children}</ErrorBoundary>
        <footer
          style={{
            textAlign: 'center',
            padding: '12px 16px',
            fontSize: '12px',
            color: '#6b7280',
            borderTop: '1px solid #e5e7eb',
            marginTop: '24px',
          }}
        >
          <span>Copyright &copy; {new Date().getFullYear()} Meta Platforms, Inc. All rights reserved.</span>
          {' · '}
          <a
            href="https://opensource.fb.com/legal/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#6b7280', textDecoration: 'underline' }}
          >
            Terms of Use
          </a>
          {' · '}
          <a
            href="https://opensource.fb.com/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#6b7280', textDecoration: 'underline' }}
          >
            Privacy Policy
          </a>
        </footer>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
