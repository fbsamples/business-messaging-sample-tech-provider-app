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
  TemplateGatingData,
} from '@/app/types/api';

interface PaidMessagingDashboardProps {
  wabas: WabaClientData[];
}

type TabKey = 'template' | 'mm_lite';

// Extract {{N}} variables from a component's text
function extractVariables(text: string): number[] {
  const matches = text.matchAll(/\{\{(\d+)\}\}/g);
  return [...new Set([...matches].map(m => parseInt(m[1], 10)))].sort((a, b) => a - b);
}

// Per-tab form state — each tab keeps its own in-progress message so switching
// tabs doesn't discard what the user has typed.
type TabFormState = {
  selectedTemplateKey: string;
  recipient: string;
  variableValues: Record<string, Record<number, string>>;
  mediaValues: Record<string, string>;
  campaignLabel: string;
  optInConfirmed: boolean;
  sending: boolean;
  error: string;
  success: string;
};

const emptyTabState: TabFormState = {
  selectedTemplateKey: '',
  recipient: '',
  variableValues: {},
  mediaValues: {},
  campaignLabel: '',
  optInConfirmed: false,
  sending: false,
  error: '',
  success: '',
};

export default function PaidMessagingDashboard({ wabas }: PaidMessagingDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('template');

  // Shared selections
  const [selectedWabaId, setSelectedWabaId] = useState('');
  const [selectedPhoneId, setSelectedPhoneId] = useState('');

  // Shared templates (loaded per WABA, filtered per tab at render time)
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [gating, setGating] = useState<TemplateGatingData | null>(null);

  // Per-tab form state
  const [templateForm, setTemplateForm] = useState<TabFormState>(emptyTabState);
  const [mmLiteForm, setMmLiteForm] = useState<TabFormState>(emptyTabState);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const paymentBlocked = gating !== null && !gating.hasPaymentMethod;
  const selectedWaba = wabas.find(w => w.id === selectedWabaId);
  const phones = selectedWaba?.phone_numbers?.data || [];

  const activeForm = activeTab === 'template' ? templateForm : mmLiteForm;
  const setActiveForm = activeTab === 'template' ? setTemplateForm : setMmLiteForm;

  // MM Lite is marketing-specific, so only surface MARKETING templates there.
  const visibleTemplates = activeTab === 'mm_lite'
    ? templates.filter(t => t.category === 'MARKETING')
    : templates;

  const selectedTemplate = activeForm.selectedTemplateKey
    ? visibleTemplates.find(t => `${t.name}::${t.language}` === activeForm.selectedTemplateKey)
    : null;

  const handleWabaChange = async (wabaId: string) => {
    setSelectedWabaId(wabaId);
    setSelectedPhoneId('');
    setTemplates([]);
    setGating(null);
    setTemplateForm(emptyTabState);
    setMmLiteForm(emptyTabState);

    if (!wabaId) return;

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
        const msg = data.error || 'Failed to fetch templates';
        setTemplateForm(prev => ({ ...prev, error: msg }));
        setMmLiteForm(prev => ({ ...prev, error: msg }));
        return;
      }
      setTemplates(data.templates || []);
      if (data.gating) setGating(data.gating);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Failed to fetch templates';
      setTemplateForm(prev => ({ ...prev, error: msg }));
      setMmLiteForm(prev => ({ ...prev, error: msg }));
    } finally {
      setLoadingTemplates(false);
    }
  };

  const updateForm = (patch: Partial<TabFormState>) => {
    setActiveForm(prev => ({ ...prev, ...patch }));
  };

  const handleTemplateChange = (key: string) => {
    updateForm({
      selectedTemplateKey: key,
      variableValues: {},
      mediaValues: {},
      error: '',
      success: '',
    });
  };

  const setVariableValue = (componentType: string, varIndex: number, value: string) => {
    setActiveForm(prev => ({
      ...prev,
      variableValues: {
        ...prev.variableValues,
        [componentType]: { ...prev.variableValues[componentType], [varIndex]: value },
      },
    }));
  };

  const setMediaValue = (componentType: string, value: string) => {
    setActiveForm(prev => ({
      ...prev,
      mediaValues: { ...prev.mediaValues, [componentType]: value },
    }));
  };

  const buildComponentParams = (): TemplateComponentParam[] => {
    if (!selectedTemplate) return [];
    const params: TemplateComponentParam[] = [];

    for (const comp of selectedTemplate.components) {
      if (comp.type === 'HEADER') {
        if (comp.format && comp.format !== 'TEXT') {
          const url = activeForm.mediaValues['HEADER'] || '';
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
              text: activeForm.variableValues['HEADER']?.[v] || '',
            }));
            params.push({ type: 'header', parameters });
          }
        }
      } else if (comp.type === 'BODY' && comp.text) {
        const vars = extractVariables(comp.text);
        if (vars.length > 0) {
          const parameters: TemplateMediaParam[] = vars.map(v => ({
            type: 'text' as const,
            text: activeForm.variableValues['BODY']?.[v] || '',
          }));
          params.push({ type: 'body', parameters });
        }
      }
    }
    return params;
  };

  const isFormValid = (): boolean => {
    if (!selectedWabaId || !selectedPhoneId || !activeForm.selectedTemplateKey || !activeForm.recipient) return false;
    if (!/^\+\d{7,15}$/.test(activeForm.recipient)) return false;
    if (!selectedTemplate) return false;

    for (const comp of selectedTemplate.components) {
      if (comp.type === 'HEADER' && comp.format && comp.format !== 'TEXT') {
        if (!activeForm.mediaValues['HEADER']) return false;
      }
      if ((comp.type === 'HEADER' || comp.type === 'BODY') && comp.text) {
        const vars = extractVariables(comp.text);
        for (const v of vars) {
          if (!activeForm.variableValues[comp.type]?.[v]) return false;
        }
      }
    }

    // MM Lite requires an explicit marketing opt-in attestation.
    if (activeTab === 'mm_lite' && !activeForm.optInConfirmed) return false;
    return true;
  };

  const handleSend = async () => {
    if (!selectedTemplate) return;
    updateForm({ error: '', success: '', sending: true });

    const [templateName, templateLanguage] = activeForm.selectedTemplateKey.split('::');

    const payload: Record<string, unknown> = {
      waba_id: selectedWabaId,
      phone_number_id: selectedPhoneId,
      template_name: templateName,
      template_language: templateLanguage,
      recipient: activeForm.recipient,
      component_params: buildComponentParams(),
    };

    if (activeTab === 'mm_lite' && activeForm.campaignLabel.trim()) {
      payload.biz_opaque_callback_data = activeForm.campaignLabel.trim();
    }

    try {
      const res = await fetch('/api/paid_messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        updateForm({ error: data.error || 'Failed to send message', sending: false });
        return;
      }
      const messageId = data.messages?.[0]?.id || 'unknown';
      updateForm({ success: `Message sent successfully! Message ID: ${messageId}`, sending: false });
    } catch (err: unknown) {
      updateForm({
        error: err instanceof Error ? err.message : 'Failed to send message',
        sending: false,
      });
    }
  };

  const renderVariableInputs = () => {
    if (!selectedTemplate) return null;

    return selectedTemplate.components.map((comp: TemplateComponent) => {
      if (comp.type === 'FOOTER') return null;

      if (comp.type === 'HEADER' && comp.format && comp.format !== 'TEXT') {
        const label = comp.format === 'IMAGE' ? 'Image URL'
          : comp.format === 'VIDEO' ? 'Video URL'
            : 'Document URL';
        return (
          <div key={`media-${comp.type}`} className="space-y-1">
            <label className="text-xs font-medium text-gray-500">{label}</label>
            <input
              type="url"
              value={activeForm.mediaValues['HEADER'] || ''}
              onChange={e => setMediaValue('HEADER', e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}...`}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        );
      }

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
                value={activeForm.variableValues[comp.type]?.[v] || ''}
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

  const sendButtonLabel = activeTab === 'template' ? 'Send Template Message' : 'Send Marketing Message Lite';

  const templateEmptyLabel = !selectedWabaId
    ? 'Select a WABA first...'
    : paymentBlocked
      ? 'Payment method required'
      : visibleTemplates.length === 0
        ? activeTab === 'mm_lite'
          ? 'No approved MARKETING templates found'
          : 'No approved templates found'
        : 'Select a template...';

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

      {/* Payment method warning — applies to both tabs */}
      {paymentBlocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm font-medium text-amber-800">Payment method required</p>
          <p className="text-xs text-amber-600 mt-0.5">
            This WABA does not have a payment method attached. Add a payment method in your WhatsApp Business Manager to send paid messages.
          </p>
        </div>
      )}

      {/* Phone selector */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Phone Number</label>
        <select
          value={selectedPhoneId}
          onChange={e => setSelectedPhoneId(e.target.value)}
          disabled={!selectedWabaId || paymentBlocked}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white disabled:opacity-50"
        >
          <option value="">
            {!selectedWabaId ? 'Select a WABA first...' : paymentBlocked ? 'Payment method required' : phones.length === 0 ? 'No phones registered for this WABA' : 'Select a phone number...'}
          </option>
          {phones.map(phone => (
            <option key={phone.id} value={phone.id}>
              {phone.display_phone_number} ({phone.verified_name})
            </option>
          ))}
        </select>
      </div>

      {/* Tab strip */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6" aria-label="Paid messaging options">
          {([
            { key: 'template', label: 'Template Messages' },
            { key: 'mm_lite', label: 'Marketing Messages Lite' },
          ] as const).map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative pb-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-indigo-600" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* MM Lite tab intro */}
      {activeTab === 'mm_lite' && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
          <p className="text-sm font-medium text-indigo-900">Marketing Messages Lite</p>
          <p className="text-xs text-indigo-700 mt-0.5">
            Send marketing template messages through the MM Lite flow. Only <strong>MARKETING</strong>-category templates are shown below. Recipients must have opted in to receive marketing messages from this business.
          </p>
        </div>
      )}

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
            value={activeForm.selectedTemplateKey}
            onChange={e => handleTemplateChange(e.target.value)}
            disabled={!selectedWabaId || paymentBlocked || visibleTemplates.length === 0}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white disabled:opacity-50"
          >
            <option value="">{templateEmptyLabel}</option>
            {visibleTemplates.map(template => (
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
          value={activeForm.recipient}
          onChange={e => updateForm({ recipient: e.target.value, error: '', success: '' })}
          disabled={paymentBlocked}
          placeholder="+1234567890"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
        />
        {activeForm.recipient && !/^\+\d{7,15}$/.test(activeForm.recipient) && (
          <p className="text-xs text-red-500 mt-1">Phone number must be in E.164 format (e.g., +1234567890)</p>
        )}
      </div>

      {/* MM Lite-only fields */}
      {activeTab === 'mm_lite' && (
        <>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Campaign tracking label <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={activeForm.campaignLabel}
              onChange={e => updateForm({ campaignLabel: e.target.value })}
              disabled={paymentBlocked}
              placeholder="e.g. spring-2026-promo"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
            />
            <p className="text-xs text-gray-400 mt-1">
              Passed as <code className="font-mono">biz_opaque_callback_data</code> so you can correlate delivery/read webhooks to a campaign.
            </p>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeForm.optInConfirmed}
              onChange={e => updateForm({ optInConfirmed: e.target.checked })}
              disabled={paymentBlocked}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
            />
            <span className="text-sm text-gray-700">
              I confirm the recipient has opted in to receive marketing messages from this business.
            </span>
          </label>
        </>
      )}

      {/* Error / Success */}
      {activeForm.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{activeForm.error}</p>
        </div>
      )}
      {activeForm.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-700">{activeForm.success}</p>
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!isFormValid() || activeForm.sending}
        className="w-full py-2.5 px-4 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {activeForm.sending ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending...
          </>
        ) : (
          sendButtonLabel
        )}
      </button>
    </div>
  );
}
