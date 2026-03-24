// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
'use client';
import Ably from 'ably';
import { useState, useEffect } from 'react';
import { Radio, Clock, CheckCircle2, ChevronDown, ChevronUp, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebhookEntry {
  field: string;
  receivedAt: string;
  status: number;
  payload: unknown;
}

function extractField(data: unknown): string {
  try {
    const d = data as { entry?: { changes?: { field?: string }[] }[] };
    return d?.entry?.[0]?.changes?.[0]?.field || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function WebhookRow({ webhook, index }: { webhook: WebhookEntry; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const fieldLabel = webhook.field.charAt(0).toUpperCase() + webhook.field.slice(1);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-gray-900">{fieldLabel}</span>
            <span className={cn(
              'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
              webhook.status === 200 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            )}>
              {webhook.status}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-[11px] text-gray-400 font-mono">{webhook.receivedAt}</span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Payload</div>
          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-auto max-h-64">
            <pre className="text-[11px] font-mono text-gray-700 p-4 whitespace-pre leading-relaxed">
              {JSON.stringify(webhook.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LiveWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [connected, setConnected] = useState(false);

  function addWebhook(data: unknown) {
    const entry: WebhookEntry = {
      field: extractField(data),
      receivedAt: formatTimestamp(new Date()),
      status: 200,
      payload: data,
    };
    setWebhooks((old_state) => [entry, ...old_state]);
  }

  useEffect(() => {
    setIsMounted(true);
    const ablyClient = new Ably.Realtime({
      authCallback: async (_tokenParams, callback) => {
        fetch('/api/ably_auth')
          .then((response) => response.json())
          .then((tokenRequest) => callback(null, tokenRequest))
          .catch((error) => callback(error, null));
      },
    });
    ablyClient.connection.on('connected', () => setConnected(true));
    ablyClient.connection.on('disconnected', () => setConnected(false));
    const channel = ablyClient.channels.get('get-started');
    channel.subscribe('first', (message) => addWebhook(message.data));
    return function cleanup() {
      ablyClient.close();
    };
  }, []);

  if (!isMounted) return null;

  return (
    <div>
      <div className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium mb-5',
        connected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
      )}>
        <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', connected ? 'bg-emerald-500' : 'bg-amber-500')} />
        {connected ? 'Connected \u2014 listening for events' : 'Connecting...'}
        <Wifi className="w-3 h-3" />
      </div>

      {webhooks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <Radio className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No webhook events yet</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            Events will appear here in real time as they are received by your app.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook, index) => (
            <WebhookRow key={index} webhook={webhook} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
