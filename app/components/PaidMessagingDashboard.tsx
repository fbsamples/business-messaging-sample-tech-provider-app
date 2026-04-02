// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
'use client';

import { useState, useRef, useEffect } from 'react';
import type {
  WabaClientData,
  MessageTemplate,
  TemplateComponent,
  TemplateComponentParam,
  TemplateMediaParam,
} from '@/app/types/api';

interface PaidMessagingDashboardProps {
  wabas: WabaClientData[];
}

// Extract {{N}} variables from a component's text
function extractVariables(text: string): number[] {
  const matches = text.matchAll(/\{\{(\d+)\}\}/g);
  return [...new Set([...matches].map(m => parseInt(m[1], 10)))].sort((a, b) => a - b);
}

export default function PaidMessagingDashboard({ wabas }: PaidMessagingDashboardProps) {
  // Selections
  const [selectedWabaId, setSelectedWabaId] = useState('');
  const [selectedPhoneId, setSelectedPhoneId] = useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('');
  const [recipient, setRecipient] = useState('');

  // Data
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, Record<number, string>>>({});
  const [mediaValues, setMediaValues] = useState<Record<string, string>>({});

  // UI state
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const selectedWaba = wabas.find(w => w.id === selectedWabaId);
  const phones = selectedWaba?.phone_numbers?.data || [];
  const selectedTemplate = selectedTemplateKey
    ? templates.find(t => `${t.name}::${t.language}` === selectedTemplateKey)
    : null;

  // Fetch templates when WABA changes
  const handleWabaChange = async (wabaId: string) => {
    setSelectedWabaId(wabaId);
    setSelectedPhoneId('');
    setSelectedTemplateKey('');
    setTemplates([]);
    setVariableValues({});
    setMediaValues({});
    setError('');
    setSuccess('');

    if (!wabaId) return;

    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoadingTemplates(true);
    try {
      const res = await fetch(
        `/api/paid_messaging/templates?waba_id=${wabaId}`,
        { signal: abortControllerRef.current.signal }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to fetch templates');
        return;
      }
      setTemplates(data.templates || []);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleTemplateChange = (key: string) => {
    setSelectedTemplateKey(key);
    setVariableValues({});
    setMediaValues({});
    setError('');
    setSuccess('');
  };

  const setVariableValue = (componentType: string, varIndex: number, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [componentType]: { ...prev[componentType], [varIndex]: value },
    }));
  };

  const setMediaValue = (componentType: string, value: string) => {
    setMediaValues(prev => ({ ...prev, [componentType]: value }));
  };

  // Build component_params from template + user inputs
  const buildComponentParams = (): TemplateComponentParam[] => {
    if (!selectedTemplate) return [];
    const params: TemplateComponentParam[] = [];

    for (const comp of selectedTemplate.components) {
      if (comp.type === 'HEADER') {
        if (comp.format && comp.format !== 'TEXT') {
          // Media header
          const url = mediaValues['HEADER'] || '';
          if (!url) continue;
          const mediaType = comp.format.toLowerCase() as 'image' | 'video' | 'document';
          const param: TemplateMediaParam = mediaType === 'document'
            ? { type: 'document', document: { link: url } }
            : mediaType === 'video'
              ? { type: 'video', video: { link: url } }
              : { type: 'image', image: { link: url } };
          params.push({ type: 'header', parameters: [param] });
        } else if (comp.text) {
          const vars = extractVariables(comp.text);
          if (vars.length > 0) {
            const parameters: TemplateMediaParam[] = vars.map(v => ({
              type: 'text' as const,
              text: variableValues['HEADER']?.[v] || '',
            }));
            params.push({ type: 'header', parameters });
          }
        }
      } else if (comp.type === 'BODY' && comp.text) {
        const vars = extractVariables(comp.text);
        if (vars.length > 0) {
          const parameters: TemplateMediaParam[] = vars.map(v => ({
            type: 'text' as const,
            text: variableValues['BODY']?.[v] || '',
          }));
          params.push({ type: 'body', parameters });
        }
      }
      // FOOTER has no variables; BUTTONS with dynamic URLs can be added later
    }
    return params;
  };

  // Check if all required fields are filled
  const isFormValid = (): boolean => {
    if (!selectedWabaId || !selectedPhoneId || !selectedTemplateKey || !recipient) return false;
    if (!/^\+\d{7,15}$/.test(recipient)) return false;
    if (!selectedTemplate) return false;

    for (const comp of selectedTemplate.components) {
      if (comp.type === 'HEADER' && comp.format && comp.format !== 'TEXT') {
        if (!mediaValues['HEADER']) return false;
      }
      if ((comp.type === 'HEADER' || comp.type === 'BODY') && comp.text) {
        const vars = extractVariables(comp.text);
        for (const v of vars) {
          if (!variableValues[comp.type]?.[v]) return false;
        }
      }
    }
    return true;
  };

  const handleSend = async () => {
    if (!selectedTemplate) return;
    setError('');
    setSuccess('');
    setSending(true);

    const [templateName, templateLanguage] = selectedTemplateKey.split('::');

    try {
      const res = await fetch('/api/paid_messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waba_id: selectedWabaId,
          phone_number_id: selectedPhoneId,
          template_name: templateName,
          template_language: templateLanguage,
          recipient,
          component_params: buildComponentParams(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send message');
        return;
      }
      const messageId = data.messages?.[0]?.id || 'unknown';
      setSuccess(`Message sent successfully! Message ID: ${messageId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Render template variable inputs
  const renderVariableInputs = () => {
    if (!selectedTemplate) return null;

    return selectedTemplate.components.map((comp: TemplateComponent) => {
      if (comp.type === 'FOOTER') return null;

      // Media header
      if (comp.type === 'HEADER' && comp.format && comp.format !== 'TEXT') {
        const label = comp.format === 'IMAGE' ? 'Image URL'
          : comp.format === 'VIDEO' ? 'Video URL'
            : 'Document URL';
        return (
          <div key={`media-${comp.type}`} className="space-y-1">
            <label className="text-xs font-medium text-gray-500">{label}</label>
            <input
              type="url"
              value={mediaValues['HEADER'] || ''}
              onChange={e => setMediaValue('HEADER', e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}...`}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        );
      }

      // Text variables
      if (!comp.text) return null;
      const vars = extractVariables(comp.text);
      if (vars.length === 0) return null;

      return (
        <div key={`vars-${comp.type}`} className="space-y-2">
          <p className="text-xs font-medium text-gray-500">{comp.type} variables</p>
          <p className="text-xs text-gray-400 font-mono">{comp.text}</p>
          {vars.map(v => (
            <div key={`${comp.type}-${v}`} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-16 flex-shrink-0">{`{{${v}}}`}</span>
              <input
                type="text"
                value={variableValues[comp.type]?.[v] || ''}
                onChange={e => setVariableValue(comp.type, v, e.target.value)}
                placeholder={`Value for {{${v}}}`}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5 max-w-2xl">
      {/* WABA selector */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">WABA</label>
        <select
          value={selectedWabaId}
          onChange={e => handleWabaChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          <option value="">Select a WABA...</option>
          {wabas.map((waba, index) => (
            <option key={`${waba.id}-${index}`} value={waba.id}>
              {waba.name || waba.id}
            </option>
          ))}
        </select>
      </div>

      {/* Phone selector */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Phone Number</label>
        <select
          value={selectedPhoneId}
          onChange={e => { setSelectedPhoneId(e.target.value); setError(''); setSuccess(''); }}
          disabled={!selectedWabaId}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white disabled:opacity-50"
        >
          <option value="">
            {!selectedWabaId ? 'Select a WABA first...' : phones.length === 0 ? 'No phones registered for this WABA' : 'Select a phone number...'}
          </option>
          {phones.map(phone => (
            <option key={phone.id} value={phone.id}>
              {phone.display_phone_number} ({phone.verified_name})
            </option>
          ))}
        </select>
      </div>

      {/* Template selector */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Message Template</label>
        {loadingTemplates ? (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading templates...
          </div>
        ) : (
          <select
            value={selectedTemplateKey}
            onChange={e => handleTemplateChange(e.target.value)}
            disabled={!selectedWabaId || templates.length === 0}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white disabled:opacity-50"
          >
            <option value="">
              {!selectedWabaId ? 'Select a WABA first...' : templates.length === 0 ? 'No approved templates found' : 'Select a template...'}
            </option>
            {templates.map(template => (
              <option
                key={`${template.name}-${template.language}`}
                value={`${template.name}::${template.language}`}
              >
                {template.name} ({template.language})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Template preview + variable inputs */}
      {selectedTemplate && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Template Variables</p>
          {renderVariableInputs()}
          {/* Show footer if present */}
          {selectedTemplate.components.find(c => c.type === 'FOOTER') && (
            <p className="text-xs text-gray-400 italic">
              Footer: {selectedTemplate.components.find(c => c.type === 'FOOTER')?.text}
            </p>
          )}
        </div>
      )}

      {/* Recipient */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Recipient Phone Number</label>
        <input
          type="tel"
          value={recipient}
          onChange={e => { setRecipient(e.target.value); setError(''); setSuccess(''); }}
          placeholder="+1234567890"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {recipient && !/^\+\d{7,15}$/.test(recipient) && (
          <p className="text-xs text-red-500 mt-1">Phone number must be in E.164 format (e.g., +1234567890)</p>
        )}
      </div>

      {/* Error / Success */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!isFormValid() || sending}
        className="w-full py-2.5 px-4 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {sending ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending...
          </>
        ) : (
          'Send Template Message'
        )}
      </button>
    </div>
  );
}
