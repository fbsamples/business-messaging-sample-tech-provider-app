// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatErrors } from '@/app/errorformat';
import { feGraphApiPostWrapper } from '@/app/fe_utils';
import FBL4BLauncher from '@/app/components/Fbl4bLauncher';
import { SessionInfo } from '@/app/types/api';
import {
  Settings2, Code2, Rocket, ChevronRight, ExternalLink, Info,
  CheckCircle2, Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Rich popover tooltip — portal-based, viewport-edge-aware positioning
const TOOLTIP_WIDTH = 320;
const TOOLTIP_MARGIN = 8; // min gap from viewport edge

function RichTip({ content, children }: { content: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [arrowLeft, setArrowLeft] = useState<string>('50%');
  const [placeBelow, setPlaceBelow] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const reposition = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tooltipH = tooltipRef.current?.offsetHeight ?? 200;

    // Horizontal: center on anchor, then clamp to viewport
    const idealLeft = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    const clampedLeft = Math.max(
      TOOLTIP_MARGIN,
      Math.min(idealLeft, vw - TOOLTIP_WIDTH - TOOLTIP_MARGIN)
    );
    // Arrow offset relative to tooltip box
    const arrowCenter = rect.left + rect.width / 2 - clampedLeft;
    const arrowPct = Math.max(16, Math.min(arrowCenter, TOOLTIP_WIDTH - 16));

    // Vertical: prefer above, flip below if not enough space
    const spaceAbove = rect.top;
    const spaceBelow = vh - rect.bottom;
    const below = spaceAbove < tooltipH + 16 && spaceBelow > spaceAbove;

    setPlaceBelow(below);
    setArrowLeft(`${arrowPct}px`);

    if (below) {
      setStyle({
        position: 'fixed',
        top: rect.bottom + 10,
        left: clampedLeft,
        zIndex: 9999,
        pointerEvents: 'none',
        fontFamily: 'inherit',
      });
    } else {
      setStyle({
        position: 'fixed',
        top: rect.top - 10,
        left: clampedLeft,
        transform: 'translateY(-100%)',
        zIndex: 9999,
        pointerEvents: 'none',
        fontFamily: 'inherit',
      });
    }
  }, []);

  const handleMouseEnter = () => {
    setOpen(true);
    // Reposition after the tooltip renders so we can measure its height
    requestAnimationFrame(() => reposition());
  };

  // Reposition again once tooltip height is known
  useEffect(() => {
    if (open) reposition();
  }, [open, reposition]);

  return (
    <span
      ref={anchorRef}
      className="inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && mounted && createPortal(
        <div ref={tooltipRef} style={style}>
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            width: `${TOOLTIP_WIDTH}px`,
            overflow: 'hidden',
            fontSize: '13px',
            color: '#111827',
          }}>
            {content}
          </div>
          {/* Arrow */}
          {placeBelow ? (
            // Arrow pointing up (tooltip is below anchor)
            <div style={{
              position: 'absolute',
              top: '-6px',
              left: arrowLeft,
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '6px solid white',
            }} />
          ) : (
            // Arrow pointing down (tooltip is above anchor)
            <div style={{
              position: 'absolute',
              bottom: '-6px',
              left: arrowLeft,
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid white',
            }} />
          )}
        </div>,
        document.body
      )}
    </span>
  );
}

function HelpDot({ tip }: { tip: React.ReactNode }) {
  return (
    <RichTip content={tip}>
      <span className="ml-1.5 w-4 h-4 inline-flex items-center justify-center rounded-full text-[10px] font-medium text-gray-400 border border-gray-300 cursor-help hover:text-gray-600 hover:border-gray-400 transition-colors select-none">?</span>
    </RichTip>
  );
}

// Tooltip content builders
function TipSection({ title, items, footer }: {
  title: string;
  items: { name: string; desc: string }[];
  footer?: string;
}) {
  return (
    <div>
      <div className="px-4 pt-3.5 pb-2 border-b border-gray-100">
        <p className="text-[13px] font-bold text-gray-900">{title}</p>
      </div>
      <div className="px-4 py-2 space-y-2.5">
        {items.map((item) => (
          <div key={item.name}>
            <p className="text-[12px] font-semibold text-gray-800">{item.name}</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
      {footer && (
        <div className="px-4 pb-3.5 pt-1 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 leading-relaxed">{footer}</p>
        </div>
      )}
    </div>
  );
}

function TipBody({ title, body, sections }: {
  title: string;
  body: string;
  sections?: { heading: string; text: string }[];
}) {
  return (
    <div>
      <div className="px-4 pt-3.5 pb-2 border-b border-gray-100">
        <p className="text-[13px] font-bold text-gray-900">{title}</p>
      </div>
      <div className="px-4 py-3">
        <p className="text-[12px] text-gray-500 leading-relaxed">{body}</p>
      </div>
      {sections?.map((s) => (
        <div key={s.heading} className="px-4 pb-3.5 border-t border-gray-100 pt-3">
          <p className="text-[12px] font-bold text-gray-800 mb-1">{s.heading}</p>
          <p className="text-[11px] text-gray-500 leading-relaxed">{s.text}</p>
        </div>
      ))}
    </div>
  );
}

const VERSION_TIP = (
  <TipSection
    title="ES Version Guide"
    items={[
      { name: 'v2 (Recommended for production)', desc: 'Classic ES with multiple forks and legacy features support.' },
      { name: 'v2-public-preview', desc: 'Mirrors v2 but uses Unified Onboarding UI for non-forked flows.' },
      { name: 'v3', desc: 'Similar to v2 without forks. Adds app-only feature flag and removes proxy sharing.' },
      { name: 'v3-public-preview', desc: 'Reveals Unified Onboarding UI for Cloud API onboarding.' },
      { name: 'v3-alpha-1', desc: 'Alpha release with expanded Unified Onboarding for select partners/products.' },
      { name: 'v4-public-preview (Testing only)', desc: 'Preview version of v4 for testing and feedback.' },
      { name: 'v4 (Coming October 2025)', desc: 'Upcoming major release with enhanced features.' },
    ]}
  />
);

const FEATURE_TYPE_TIP = (
  <TipSection
    title="ES Feature Type Guide"
    items={[
      { name: 'whatsapp_business_app_onboarding', desc: 'Standard WhatsApp Business App onboarding flow.' },
      { name: 'only_waba_sharing', desc: 'Restricts the flow to WABA (WhatsApp Business Account) sharing only.' },
      { name: 'none (Default)', desc: 'No additional feature type or restricted sharing applied.' },
    ]}
  />
);

const FEATURES_TIP = (
  <TipSection
    title="ES Features Guide"
    items={[
      { name: 'marketing_messages_lite', desc: 'Enables a lightweight version of marketing message features during onboarding.' },
    ]}
    footer="Enter feature flags as comma-separated values or leave empty for default behavior."
  />
);

const PREFILLED_TIP = (
  <TipBody
    title="ES Pre-filled Guide"
    body="Indicates that fields (such as business info or phone numbers) are pre-populated within the onboarding flow to accelerate user completion."
    sections={[{
      heading: 'When enabled:',
      text: 'Known business information and phone numbers will be automatically filled in during the onboarding process, reducing manual data entry and speeding up customer onboarding.',
    }]}
  />
);

const PROVIDER_CONFIG_TIP = (
  <TipBody
    title="Provider Config"
    body="Your Tech Provider configuration token. Each config maps to a distinct app setup in Meta's system — controls which app_id and permissions are used."
  />
);

function Toggle({ checked, onChange, label, tip }: { checked: boolean; onChange: (v: boolean) => void; label: string; tip: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group/toggle">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
          checked ? 'bg-[#1877F2]' : 'bg-gray-200'
        )}
      >
        <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
      </button>
      <span className="text-[13px] text-gray-600 group-hover/toggle:text-gray-900 transition-colors">{label}</span>
      <HelpDot tip={tip} />
    </label>
  );
}

type Step = 1 | 2 | 3;
function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { id: 1 as Step, label: 'Configure', sub: 'Set parameters' },
    { id: 2 as Step, label: 'Review Payload', sub: 'JSON ready' },
    { id: 3 as Step, label: 'Launch & Review', sub: 'Run the flow' },
  ];
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all',
                done ? 'bg-emerald-500 text-white' : active ? 'bg-[#1877F2] text-white' : 'bg-gray-200 text-gray-400'
              )}>
                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
              </div>
              <div>
                <div className={cn('text-[12px] font-semibold leading-tight', active ? 'text-slate-700' : done ? 'text-emerald-600' : 'text-gray-400')}>{s.label}</div>
                <div className="text-[10px] text-gray-400 leading-tight">{s.sub}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('mx-3 h-px w-10 transition-colors', done ? 'bg-emerald-300' : 'bg-gray-200')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionCard({ icon, title, subtitle, children, className }: {
  icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden', className)}>
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
          {icon}
        </div>
        <div>
          <div className="text-[13px] font-semibold text-slate-700">{title}</div>
          {subtitle && <div className="text-[11px] text-gray-400">{subtitle}</div>}
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

function SelectField({ label, tip, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; tip: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label} <HelpDot tip={tip} />
      </label>
      <select
        className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors cursor-pointer"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export default function ClientDashboard({ app_id, app_name, bm_id, user_id, tp_configs, public_es_feature_options: _public_es_feature_options, public_es_versions, public_es_feature_types, es_prefilled_setup }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const updateUrlParams = (updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, (value as string[]).join(','));
      } else {
        params.set(key, String(value));
      }
    });
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const parseUrlParams = () => {
    const esVersion = searchParams.get('esVersion') || public_es_versions[0];
    const esFeatureType = searchParams.get('esFeatureType') || '';
    const esFeatures = searchParams.get('esFeatures') ? searchParams.get('esFeatures')!.split(',') : [];
    const tpConfig = searchParams.get('tpConfig') || tp_configs[0]?.id || '';
    return { esVersion, esFeatureType, esFeatures, tpConfig };
  };

  const { esVersion: initialEsVersion, esFeatureType: initialEsFeatureType, esFeatures: initialEsFeatures, tpConfig: initialTpConfig } = parseUrlParams();

  const [esOptionFeatureType, setEsOptionFeatureType] = useState(initialEsFeatureType);
  const [esOptionFeatures, setEsOptionFeatures] = useState(initialEsFeatures);
  const [esOptionConfig, setEsOptionConfig] = useState(initialTpConfig);
  const [esOptionVersion, setEsOptionVersion] = useState(initialEsVersion);
  const [esOptionPrefilled, setEsOptionPrefilled] = useState(false);
  const [es_option_reg, setEs_option_reg] = useState(true);
  const [es_option_sub, setEs_option_sub] = useState(true);
  const [step, setStep] = useState<Step>(1);
  const computeEsConfig = (ft, cfg, feats, ver, pf) => {
    const c: any = {
      config_id: cfg, response_type: 'code', override_default_response_type: true,
      extras: { sessionInfoVersion: '3', version: ver, featureType: ft,
        features: feats ? feats.map((f) => ({ name: f })) : null }
    };
    if (ft === '') delete c.extras.featureType;
    if (pf) c.setup = es_prefilled_setup;
    return c;
  };

  const [esConfig, setEsConfig] = useState(JSON.stringify(computeEsConfig(esOptionFeatureType, esOptionConfig, esOptionFeatures, esOptionVersion, esOptionPrefilled), null, 2));
  const [bannerInfo, setBannerInfo] = useState<string>('');
  const [lastEventData, setLastEventData] = useState<any>(null);

  const recomputeJson = (ft, cfg, feats, ver, pf) => {
    setEsConfig(JSON.stringify(computeEsConfig(ft, cfg, feats, ver, pf), null, 2));
    setStep(2);
  };

  const handleBannerInfoChange = useCallback((info: string) => setBannerInfo(info), []);
  const handleLastEventDataChange = useCallback((data: any) => setLastEventData(data), []);

  const handleSaveToken = useCallback((code: string, session_info: SessionInfo) => {
    setBannerInfo('Setting up WABA...');
    const { waba_id, business_id, phone_number_id, page_ids, ad_account_ids, catalog_ids, dataset_ids, instagram_account_ids } = session_info.data;
    const filterIds = (ids: string[] | undefined) => (ids || []).filter(id => id && id.trim() !== '');
    feGraphApiPostWrapper('/api/token', {
      code, app_id, waba_id, waba_ids: waba_id ? [waba_id] : [],
      business_id, phone_number_id,
      page_ids: page_ids || [], ad_account_ids: ad_account_ids || [],
      dataset_ids: filterIds(dataset_ids), catalog_ids: filterIds(catalog_ids),
      instagram_account_ids: filterIds(instagram_account_ids),
      es_option_reg, es_option_sub, user_id
    }).then(d => setBannerInfo('WABA Setup Finished\n' + formatErrors(d) + '\n'));
  }, [app_id, es_option_reg, es_option_sub, user_id]);

  const handleClickFbl4b = useCallback(() => {
    setStep(3);
    fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, action: 'launch_fbl4b' }) });
  }, [user_id]);

  const setFt = (v) => { if (v === 'only_waba_sharing') setEs_option_reg(false); setEsOptionFeatureType(v); updateUrlParams({ esFeatureType: v }); recomputeJson(v, esOptionConfig, esOptionFeatures, esOptionVersion, esOptionPrefilled); };
  const setCfg = (v) => { setEsOptionConfig(v); updateUrlParams({ tpConfig: v }); recomputeJson(esOptionFeatureType, v, esOptionFeatures, esOptionVersion, esOptionPrefilled); };
  const setReg = (v) => { if (v && esOptionFeatureType === 'only_waba_sharing') setFt(''); setEs_option_reg(v); };
  const setVer = (v) => { setEsOptionVersion(v); updateUrlParams({ esVersion: v }); recomputeJson(esOptionFeatureType, esOptionConfig, esOptionFeatures, v, esOptionPrefilled); };
  const setPf = (v) => { setEsOptionPrefilled(v); recomputeJson(esOptionFeatureType, esOptionConfig, esOptionFeatures, esOptionVersion, v); };
  const setFeats = (e) => { const f = e.target.value.split(',').map(s => s.trim()).filter(Boolean); setEsOptionFeatures(f); updateUrlParams({ esFeatures: f }); recomputeJson(esOptionFeatureType, esOptionConfig, f, esOptionVersion, esOptionPrefilled); };

  const highlightJson = (json: string) => {
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'text-amber-700';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'text-blue-700' : 'text-emerald-700';
      } else if (/true|false/.test(match)) cls = 'text-violet-700';
      else if (/null/.test(match)) cls = 'text-red-500';
      return `<span class="${cls}">${match}</span>`;
    });
  };

  return (
    <div className="p-6 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-4">
        <a target="_blank" href={`https://developers.facebook.com/apps/${app_id}`} className="hover:text-gray-700 transition-colors font-mono">App {app_id}</a>
        <ChevronRight className="w-3 h-3" />
        <a target="_blank" href={`https://business.facebook.com/latest/settings/whatsapp_account?business_id=${bm_id}`} className="hover:text-gray-700 transition-colors font-mono">Business {bm_id}</a>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600">Configuration</span>
      </div>

      {/* Page title */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-700">Configuration</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Set up Embedded Signup parameters. The JSON payload updates live as you adjust options.</p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Main grid */}
      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Left column */}
        <div className="space-y-5">
          <SectionCard icon={<Settings2 className="w-4 h-4" />} title="Provider Config" subtitle="Select a configuration token to use">
            <div className="space-y-5">
              <SelectField label="Provider Config" tip={PROVIDER_CONFIG_TIP} value={esOptionConfig} onChange={(e) => setCfg(e.target.value)}>
                {tp_configs.map((config) => (
                  <option key={config.id} value={config.id}>{config.name} ({config.id})</option>
                ))}
              </SelectField>

              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Version" tip={VERSION_TIP} value={esOptionVersion} onChange={(e) => setVer(e.target.value)}>
                  {public_es_versions.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </SelectField>
                <SelectField label="Feature Type" tip={FEATURE_TYPE_TIP} value={esOptionFeatureType} onChange={(e) => setFt(e.target.value)}>
                  <option value="">None</option>
                  {public_es_feature_types[esOptionVersion]?.map((ft) => (
                    <option key={ft} value={ft}>{ft}</option>
                  ))}
                </SelectField>
              </div>

              <div>
                <label className="flex items-center text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Features <HelpDot tip={FEATURES_TIP} />
                </label>
                <input
                  type="text"
                  value={esOptionFeatures.join(', ')}
                  onChange={setFeats}
                  placeholder="e.g. marketing_messages_lite"
                  className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                />
              </div>

              <div className="pt-2 space-y-3 border-t border-gray-100">
                <Toggle checked={esOptionPrefilled} onChange={setPf} label="Pre-fill info" tip={PREFILLED_TIP} />
                <Toggle checked={es_option_reg} onChange={setReg} label="Register number" tip={
                  <TipBody
                    title="Register number"
                    body="Calls the register phone number API automatically after a successful signup. Required before sending messages. Disable if you want to register manually."
                  />
                } />
                <Toggle checked={es_option_sub} onChange={setEs_option_sub} label="Subscribe webhooks" tip={
                  <TipBody
                    title="Subscribe webhooks"
                    body="Subscribes the WABA to your app’s webhooks automatically after signup. Disable if you manage webhook subscriptions separately."
                  />
                } />
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<Code2 className="w-4 h-4" />} title="Generated Payload" subtitle="Passed to FB.login(callback, payload) · updates live">
            <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">JSON</span>
                <span className="text-[10px] text-gray-400 font-mono">FB.login(callback, payload)</span>
              </div>
              <pre
                className="text-[12px] font-mono p-4 overflow-auto max-h-72 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightJson(esConfig) }}
              />
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-3">
              <Info className="w-3 h-3 flex-shrink-0" />
              This JSON is generated from the configuration above and updates live as you change options.
            </p>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <div className="sticky top-20 space-y-5">
            <SectionCard icon={<Rocket className="w-4 h-4" />} title="Launch" subtitle="Start the Embedded Signup flow">
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-4 space-y-1.5">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Current Config</div>
                {[
                  { label: 'Config ID', value: esOptionConfig },
                  { label: 'Version', value: esOptionVersion },
                  { label: 'Feature Type', value: esOptionFeatureType || 'None' },
                  { label: 'Register number', value: es_option_reg ? 'On' : 'Off' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-800 font-mono text-[11px] truncate max-w-[140px]">{value}</span>
                  </div>
                ))}
              </div>
              <FBL4BLauncher
                app_id={app_id}
                app_name={app_name}
                esConfig={esConfig}
                onClickFbl4b={handleClickFbl4b}
                onBannerInfoChange={handleBannerInfoChange}
                onLastEventDataChange={handleLastEventDataChange}
                onSaveToken={handleSaveToken}
                onQuickLaunch={undefined}
              />
            </SectionCard>

            <SectionCard icon={<Code2 className="w-4 h-4" />} title="Response" subtitle="Results from the signup flow">
              {bannerInfo || lastEventData ? (
                <div className="space-y-3">
                  {bannerInfo && (
                    <div className={cn(
                      'text-[12px] px-4 py-3 rounded-lg font-mono leading-relaxed',
                      bannerInfo.includes('Finished') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      bannerInfo.includes('Error') || bannerInfo.includes('Exited') ? 'bg-red-50 text-red-600 border border-red-200' :
                      'bg-sky-50 text-sky-700 border border-sky-200'
                    )}>
                      <pre className="whitespace-pre-wrap">{bannerInfo}</pre>
                    </div>
                  )}
                  {lastEventData && (
                    <div>
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Session Event</div>
                      <div className="bg-gray-50 rounded-lg p-3 overflow-auto max-h-48 border border-gray-200">
                        <pre className="text-[11px] text-gray-700 font-mono whitespace-pre-wrap leading-relaxed">{JSON.stringify(lastEventData, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-gray-200 rounded-xl py-8 text-center">
                  <Circle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-[13px] text-gray-400 font-medium">No response yet</p>
                  <p className="text-[11px] text-gray-300 mt-0.5">Results appear here after launching</p>
                </div>
              )}
              <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100">
                <a href="https://developers.facebook.com/docs/whatsapp/embedded-signup/implementation#response-callback"
                   target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-600 transition-colors">
                  <ExternalLink className="w-3 h-3" /> Response Callback
                </a>
                <a href="https://developers.facebook.com/docs/whatsapp/embedded-signup/implementation#session-logging-message-event-listener"
                   target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-600 transition-colors">
                  <ExternalLink className="w-3 h-3" /> Session Events
                </a>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
