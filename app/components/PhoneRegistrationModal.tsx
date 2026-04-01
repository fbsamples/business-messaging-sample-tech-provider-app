// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useState, useRef, useEffect } from 'react';
import { feGraphApiPostWrapper } from '@/app/feUtils';

interface PhoneRegistrationModalProps {
  phone: {
    id: string;
    display_phone_number: string;
    wabaId: string;
    status: string;
    code_verification_status: string;
  };
  onClose: () => void;
  onRegistrationComplete?: () => void;
}

type Step = 'request' | 'verify' | 'register' | 'done';

export default function PhoneRegistrationModal({
  phone,
  onClose,
  onRegistrationComplete,
}: PhoneRegistrationModalProps) {
  const [step, setStep] = useState<Step>(() => {
    if (phone.status === 'CONNECTED') return 'done';
    if (phone.code_verification_status === 'VERIFIED') return 'register';
    if (phone.status === 'SENT') return 'verify';
    return 'request';
  });
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(6);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  useEffect(() => {
    if (otpExpiry <= 0) return undefined;
    const timer = setTimeout(() => {
      const next = otpExpiry - 1;
      setOtpExpiry(next);
      if (next === 0) {
        setOtpExpired(true);
        setError('Code expired. Please request a new one.');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [otpExpiry]);

  function handleDigitChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleRequestCode() {
    setIsLoading(true);
    setError(null);
    try {
      await feGraphApiPostWrapper('/api/request_code', {
        waba_id: phone.wabaId,
        phone_number_id: phone.id,
      });
      setStep('verify');
      setResendTimer(60);
      setOtpExpiry(600);
      setOtpExpired(false);
    } catch {
      setError('Failed to request verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyCode() {
    const otpCode = digits.join('');
    if (otpCode.length !== 6) return;
    setIsLoading(true);
    setError(null);
    try {
      await feGraphApiPostWrapper('/api/verify_code', {
        wabaId: phone.wabaId,
        phoneId: phone.id,
        otpCode,
      });
      setStep('register');
    } catch (err: unknown) {
      setAttempts((prev) => prev - 1);
      const errMsg = (err as { message?: string; code?: string })?.message ?? (err as { code?: string })?.code ?? '';
      if (/expired/i.test(errMsg)) {
        setError('Your code has expired. Please request a new one.');
      } else if (/rate|limit/i.test(errMsg)) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError('Invalid code. Please check and try again.');
      }
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister() {
    setIsLoading(true);
    setError(null);
    try {
      await feGraphApiPostWrapper('/api/register', {
        wabaId: phone.wabaId,
        phoneId: phone.id,
      });
      setStep('done');
      onRegistrationComplete?.();
    } catch (err: unknown) {
      const errMsg = (err as { message?: string; code?: string })?.message ?? (err as { code?: string })?.code ?? '';
      if (/expired/i.test(errMsg)) {
        setError('Your code has expired. Please request a new one.');
      } else if (/rate|limit/i.test(errMsg)) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError('Failed to register phone. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" onClick={onClose}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === 'request' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Verify your phone number</h2>
            <p className="text-sm text-gray-600">
              We&apos;ll send a verification code to {phone.display_phone_number}. It may take a few moments to arrive.
            </p>
            <button
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              onClick={handleRequestCode}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send verification code'}
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Verify your phone number</h2>
            <p className="text-sm text-gray-600">
              We sent a verification code to {phone.display_phone_number}. It may take a few moments to arrive. To
              verify your number, enter the 6-digit code.
            </p>

            {otpExpired ? (
              <div className="text-center space-y-3 py-2">
                <p className="text-sm text-red-600 font-medium">Code expired</p>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                  onClick={handleRequestCode}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Resend code'}
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification code</label>
                  <div className="flex gap-2 justify-center">
                    {digits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          inputRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        className="w-11 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                        value={digit}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        maxLength={1}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <button
                    className={`text-blue-600 hover:text-blue-800 ${resendTimer > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleRequestCode}
                    disabled={resendTimer > 0 || isLoading}
                  >
                    Resend code {resendTimer > 0 ? `(0:${resendTimer.toString().padStart(2, '0')})` : ''}
                  </button>
                  <span className="text-gray-500">
                    Code expires in {Math.floor(otpExpiry / 60)}:{(otpExpiry % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{attempts}/6 attempts left</span>
                  {attempts === 0 && (
                    <span className="text-red-600">Too many attempts. Please request a new code.</span>
                  )}
                </div>

                <button
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                  onClick={handleVerifyCode}
                  disabled={isLoading || digits.some((d) => !d) || attempts === 0}
                >
                  {isLoading ? 'Verifying...' : 'Next'}
                </button>
              </>
            )}
          </div>
        )}

        {step === 'register' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Complete registration</h2>
            <p className="text-sm text-gray-600">
              Your phone number has been verified. Click below to complete the registration.
            </p>
            <button
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              onClick={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 font-medium">Phone number registered successfully!</p>
            <button
              className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
