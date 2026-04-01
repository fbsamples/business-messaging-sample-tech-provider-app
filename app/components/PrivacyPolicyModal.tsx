// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

"use client";

import { useState, useEffect, useCallback } from "react";

interface PrivacyPolicyModalProps {
  app_name?: string;
  host?: string;
  contact_email?: string;
}

export default function PrivacyPolicyModal({
  app_name = "",
  host = "",
  contact_email = "",
}: PrivacyPolicyModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer bg-transparent border-none p-0 font-inherit"
      >
        Privacy Policy
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={close}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Modal */}
          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={close}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer bg-transparent border border-gray-200 z-10"
              aria-label="Close"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Scrollable content */}
            <div className="overflow-y-auto p-8 pr-6 privacy-policy-content">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Privacy Policy
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Last updated: May 18, 2025
              </p>

              <div className="text-sm text-gray-700 space-y-4 leading-relaxed">
                <p>
                  This privacy policy describes Our policies and procedures on
                  the collection, use and disclosure of Your information when You
                  use the Service and tells You about Your privacy rights and how
                  the law protects You.
                </p>
                <p>
                  We use Your Personal data to provide and improve the Service.
                  By using the Service, You agree to the collection and use of
                  information in accordance with this Privacy Policy. This
                  Privacy Policy has been created with the help of the Privacy
                  Policy Generator.
                </p>

                <h2 className="text-lg font-bold text-gray-900 pt-2">
                  Interpretation and Definitions
                </h2>

                <h3 className="text-base font-semibold text-gray-900">
                  Interpretation
                </h3>
                <p>
                  The words of which the initial letter is capitalized have
                  meanings defined under the following conditions. The following
                  definitions shall have the same meaning regardless of whether
                  they appear in singular or in plural.
                </p>

                <h3 className="text-base font-semibold text-gray-900">
                  Definitions
                </h3>
                <p>For the purposes of this Privacy Policy:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Account</strong> means a unique account created for
                    You to access our Service or parts of our Service.
                  </li>
                  <li>
                    <strong>Affiliate</strong> means an entity that controls, is
                    controlled by or is under common control with a party, where
                    &quot;control&quot; means ownership of 50% or more of the
                    shares, equity interest or other securities entitled to vote
                    for election of directors or other managing authority.
                  </li>
                  <li>
                    <strong>Company</strong> (referred to as either &quot;the
                    Company&quot;, &quot;We&quot;, &quot;Us&quot; or &quot;Our&quot; in
                    this Agreement) refers to {app_name || "the Company"}.
                  </li>
                  <li>
                    <strong>Cookies</strong> are small files that are placed on
                    Your computer, mobile device or any other device by a
                    website, containing the details of Your browsing history on
                    that website among its many uses.
                  </li>
                  <li>
                    <strong>Country</strong> refers to: California, United States
                  </li>
                  <li>
                    <strong>Device</strong> means any device that can access the
                    Service such as a computer, a cellphone or a digital tablet.
                  </li>
                  <li>
                    <strong>Personal Data</strong> is any information that
                    relates to an identified or identifiable individual.
                  </li>
                  <li>
                    <strong>Service</strong> refers to the Website.
                  </li>
                  <li>
                    <strong>Service Provider</strong> means any natural or legal
                    person who processes the data on behalf of the Company. It
                    refers to third-party companies or individuals employed by
                    the Company to facilitate the Service, to provide the Service
                    on behalf of the Company, to perform services related to the
                    Service or to assist the Company in analyzing how the Service
                    is used.
                  </li>
                  <li>
                    <strong>Usage Data</strong> refers to data collected
                    automatically, either generated by the use of the Service or
                    from the Service infrastructure itself (for example, the
                    duration of a page visit).
                  </li>
                  <li>
                    <strong>Website</strong> refers to {app_name || "the Website"}
                    {host && (
                      <>
                        , accessible from{" "}
                        <a
                          href={host}
                          rel="external nofollow noopener"
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          {host}
                        </a>
                      </>
                    )}
                  </li>
                  <li>
                    <strong>You</strong> means the individual accessing or using
                    the Service, or the company, or other legal entity on behalf
                    of which such individual is accessing or using the Service,
                    as applicable.
                  </li>
                </ul>

                <h2 className="text-lg font-bold text-gray-900 pt-2">
                  Collecting and Using Your Personal Data
                </h2>
                <h3 className="text-base font-semibold text-gray-900">
                  Types of Data Collected
                </h3>
                <h4 className="text-sm font-semibold text-gray-900">
                  Personal Data
                </h4>
                <p>
                  While using Our Service, We may ask You to provide Us with
                  certain personally identifiable information that can be used to
                  contact or identify You. Personally identifiable information
                  may include, but is not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Usage Data</li>
                </ul>

                <h4 className="text-sm font-semibold text-gray-900">
                  Usage Data
                </h4>
                <p>
                  Usage Data is collected automatically when using the Service.
                </p>
                <p>
                  Usage Data may include information such as Your Device&apos;s
                  Internet Protocol address (e.g. IP address), browser type,
                  browser version, the pages of our Service that You visit, the
                  time and date of Your visit, the time spent on those pages,
                  unique device identifiers and other diagnostic data.
                </p>

                <h4 className="text-sm font-semibold text-gray-900">
                  Tracking Technologies and Cookies
                </h4>
                <p>
                  We use Cookies and similar tracking technologies to track the
                  activity on Our Service and store certain information.
                </p>

                <h3 className="text-base font-semibold text-gray-900">
                  Use of Your Personal Data
                </h3>
                <p>
                  The Company may use Personal Data for the following purposes:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>To provide and maintain our Service</strong>,
                    including to monitor the usage of our Service.
                  </li>
                  <li>
                    <strong>To manage Your Account:</strong> to manage Your
                    registration as a user of the Service.
                  </li>
                  <li>
                    <strong>For the performance of a contract:</strong> the
                    development, compliance and undertaking of the purchase
                    contract for the products, items or services You have
                    purchased.
                  </li>
                  <li>
                    <strong>To contact You:</strong> To contact You by email,
                    telephone calls, SMS, or other equivalent forms of electronic
                    communication.
                  </li>
                  <li>
                    <strong>To provide You</strong> with news, special offers and
                    general information about other goods, services and events.
                  </li>
                  <li>
                    <strong>To manage Your requests:</strong> To attend and
                    manage Your requests to Us.
                  </li>
                  <li>
                    <strong>For business transfers:</strong> We may use Your
                    information to evaluate or conduct a merger, divestiture,
                    restructuring, reorganization, dissolution, or other sale or
                    transfer of some or all of Our assets.
                  </li>
                  <li>
                    <strong>For other purposes</strong>: We may use Your
                    information for other purposes, such as data analysis,
                    identifying usage trends, and to evaluate and improve our
                    Service.
                  </li>
                </ul>

                <h3 className="text-base font-semibold text-gray-900">
                  Retention of Your Personal Data
                </h3>
                <p>
                  The Company will retain Your Personal Data only for as long as
                  is necessary for the purposes set out in this Privacy Policy.
                </p>

                <h3 className="text-base font-semibold text-gray-900">
                  Transfer of Your Personal Data
                </h3>
                <p>
                  Your information, including Personal Data, is processed at the
                  Company&apos;s operating offices and in any other places where
                  the parties involved in the processing are located.
                </p>

                <h3 className="text-base font-semibold text-gray-900">
                  Delete Your Personal Data
                </h3>
                <p>
                  You have the right to delete or request that We assist in
                  deleting the Personal Data that We have collected about You.
                </p>

                <h3 className="text-base font-semibold text-gray-900">
                  Security of Your Personal Data
                </h3>
                <p>
                  The security of Your Personal Data is important to Us, but
                  remember that no method of transmission over the Internet, or
                  method of electronic storage is 100% secure.
                </p>

                <h2 className="text-lg font-bold text-gray-900 pt-2">
                  Children&apos;s Privacy
                </h2>
                <p>
                  Our Service does not address anyone under the age of 13. We do
                  not knowingly collect personally identifiable information from
                  anyone under the age of 13.
                </p>

                <h2 className="text-lg font-bold text-gray-900 pt-2">
                  Changes to this Privacy Policy
                </h2>
                <p>
                  We may update Our Privacy Policy from time to time. We will
                  notify You of any changes by posting the new Privacy Policy on
                  this page.
                </p>

                <h2 className="text-lg font-bold text-gray-900 pt-2">
                  Contact Us
                </h2>
                <p>
                  If you have any questions about this Privacy Policy, You can
                  contact us:
                </p>
                {contact_email && (
                  <ul className="list-disc pl-6">
                    <li>By email: {contact_email}</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
