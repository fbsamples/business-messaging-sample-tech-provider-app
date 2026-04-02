// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @vercel/postgres before importing beUtils
vi.mock('@vercel/postgres', () => ({
  sql: vi.fn(),
}));

// Mock privateConfig
vi.mock('@/app/privateConfig', () => ({
  default: vi.fn().mockResolvedValue({
    fbAppSecret: 'test_app_secret',
    fbRegPin: '123456',
    fbVerifyToken: 'test_verify_token',
  }),
}));

// Mock publicConfig
vi.mock('@/app/publicConfig', () => ({
  default: {
    appId: 'test_app_id',
    graphApiVersion: 'v21.0',
    redirectUri: 'https://example.com/callback',
  },
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('beUtils - Paid Messaging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMessageTemplates', () => {
    it('returns only APPROVED and QUALITY_PENDING templates', async () => {
      const { getMessageTemplates } = await import('@/app/api/beUtils');

      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: [
              { name: 'hello', language: 'en_US', status: 'APPROVED', components: [], category: 'MARKETING' },
              { name: 'promo', language: 'en_US', status: 'QUALITY_PENDING', components: [], category: 'MARKETING' },
              { name: 'rejected', language: 'en_US', status: 'REJECTED', components: [], category: 'MARKETING' },
              { name: 'paused', language: 'en_US', status: 'PAUSED', components: [], category: 'MARKETING' },
              { name: 'pending', language: 'en_US', status: 'PENDING', components: [], category: 'MARKETING' },
            ],
          }),
      });

      const result = await getMessageTemplates('waba_123', 'token_abc');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('hello');
      expect(result[0].status).toBe('APPROVED');
      expect(result[1].name).toBe('promo');
      expect(result[1].status).toBe('QUALITY_PENDING');
    });

    it('returns empty array when no templates match sendable statuses', async () => {
      const { getMessageTemplates } = await import('@/app/api/beUtils');

      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: [
              { name: 'rejected', language: 'en_US', status: 'REJECTED', components: [], category: 'MARKETING' },
            ],
          }),
      });

      const result = await getMessageTemplates('waba_123', 'token_abc');
      expect(result).toHaveLength(0);
    });

    it('returns empty array when API returns no data', async () => {
      const { getMessageTemplates } = await import('@/app/api/beUtils');

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ data: [] }),
      });

      const result = await getMessageTemplates('waba_123', 'token_abc');
      expect(result).toHaveLength(0);
    });

    it('throws when Graph API returns an error', async () => {
      const { getMessageTemplates } = await import('@/app/api/beUtils');

      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            error: { message: 'Invalid access token', type: 'OAuthException', code: 190 },
          }),
      });

      await expect(getMessageTemplates('waba_123', 'bad_token')).rejects.toThrow(
        'Invalid access token'
      );
    });
  });

  describe('getTemplateGatingData', () => {
    it('returns true for both when health_status has no payment errors and approved templates exist', async () => {
      const { getTemplateGatingData } = await import('@/app/api/beUtils');

      // First call: health_status check, second call: templates check
      mockFetch
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              id: 'waba_123',
              health_status: {
                can_send_message: 'AVAILABLE',
                entities: [
                  { entity_type: 'WABA', can_send_message: 'AVAILABLE', errors: [] },
                ],
              },
            }),
        })
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              data: [
                { name: 'hello', status: 'APPROVED' },
                { name: 'draft', status: 'PENDING' },
              ],
            }),
        });

      const result = await getTemplateGatingData('waba_123', 'token_abc');
      expect(result.hasPaymentMethod).toBe(true);
      expect(result.hasApprovedTemplates).toBe(true);
    });

    it('returns false for payment when health_status has PAYMENT_METHOD_ERROR', async () => {
      const { getTemplateGatingData } = await import('@/app/api/beUtils');

      mockFetch
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              id: 'waba_123',
              health_status: {
                can_send_message: 'LIMITED',
                entities: [
                  {
                    entity_type: 'WABA',
                    can_send_message: 'LIMITED',
                    errors: [
                      {
                        error_description: 'No valid payment method on file',
                        possible_solution: 'Add a valid payment method to your account',
                      },
                    ],
                  },
                ],
              },
            }),
        })
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              data: [{ name: 'draft', status: 'PENDING' }],
            }),
        });

      const result = await getTemplateGatingData('waba_123', 'token_abc');
      expect(result.hasPaymentMethod).toBe(false);
      expect(result.hasApprovedTemplates).toBe(false);
    });

    it('handles Graph API error responses gracefully', async () => {
      const { getTemplateGatingData } = await import('@/app/api/beUtils');

      mockFetch
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              error: { message: 'Permission denied', type: 'OAuthException', code: 200 },
            }),
        })
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              error: { message: 'Permission denied', type: 'OAuthException', code: 200 },
            }),
        });

      const result = await getTemplateGatingData('waba_123', 'token_abc');
      expect(result.hasPaymentMethod).toBe(false);
      expect(result.hasApprovedTemplates).toBe(false);
    });

    it('handles fetch failures gracefully', async () => {
      const { getTemplateGatingData } = await import('@/app/api/beUtils');

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await getTemplateGatingData('waba_123', 'token_abc');
      expect(result.hasPaymentMethod).toBe(false);
      expect(result.hasApprovedTemplates).toBe(false);
    });

    it('returns true for payment when health_status has no WABA entity errors', async () => {
      const { getTemplateGatingData } = await import('@/app/api/beUtils');

      mockFetch
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              id: 'waba_123',
              health_status: {
                can_send_message: 'AVAILABLE',
                entities: [
                  { entity_type: 'PHONE_NUMBER', can_send_message: 'AVAILABLE', errors: [] },
                ],
              },
            }),
        })
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              data: [{ name: 'hello', status: 'APPROVED' }],
            }),
        });

      const result = await getTemplateGatingData('waba_123', 'token_abc');
      // No WABA entity found means no payment error detected → hasPaymentMethod = true
      expect(result.hasPaymentMethod).toBe(true);
    });

    it('detects QUALITY_PENDING as sendable for gating', async () => {
      const { getTemplateGatingData } = await import('@/app/api/beUtils');

      mockFetch
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              id: 'waba_123',
              health_status: {
                can_send_message: 'AVAILABLE',
                entities: [],
              },
            }),
        })
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              data: [{ name: 'promo', status: 'QUALITY_PENDING' }],
            }),
        });

      const result = await getTemplateGatingData('waba_123', 'token_abc');
      expect(result.hasApprovedTemplates).toBe(true);
    });
  });

  describe('sendTemplateMessage', () => {
    it('sends template message with correct payload', async () => {
      const { sendTemplateMessage } = await import('@/app/api/beUtils');

      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            messaging_product: 'whatsapp',
            contacts: [{ wa_id: '1234567890' }],
            messages: [{ id: 'wamid.abc123' }],
          }),
      });

      const result = await sendTemplateMessage(
        'phone_123',
        'token_abc',
        '+1234567890',
        'hello_world',
        'en_US',
        []
      );

      expect(result.messages[0].id).toBe('wamid.abc123');

      // Verify the fetch was called with correct body
      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.messaging_product).toBe('whatsapp');
      expect(body.to).toBe('+1234567890');
      expect(body.type).toBe('template');
      expect(body.template.name).toBe('hello_world');
      expect(body.template.language.code).toBe('en_US');
    });

    it('throws when Graph API returns an error', async () => {
      const { sendTemplateMessage } = await import('@/app/api/beUtils');

      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            error: {
              message: 'Template not found',
              type: 'OAuthException',
              code: 100,
            },
          }),
      });

      await expect(
        sendTemplateMessage('phone_123', 'token_abc', '+1234567890', 'nonexistent', 'en_US', [])
      ).rejects.toThrow('Template not found');
    });

    it('sends component params for templates with variables', async () => {
      const { sendTemplateMessage } = await import('@/app/api/beUtils');

      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            messages: [{ id: 'wamid.xyz789' }],
          }),
      });

      const componentParams = [
        {
          type: 'body' as const,
          parameters: [{ type: 'text' as const, text: 'John' }],
        },
      ];

      await sendTemplateMessage(
        'phone_123',
        'token_abc',
        '+1234567890',
        'greeting',
        'en_US',
        componentParams
      );

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.template.components).toEqual(componentParams);
    });
  });
});
