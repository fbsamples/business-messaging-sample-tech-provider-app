// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import { Settings2, Code2, Rocket, ChevronRight, ExternalLink, Info, CheckCircle2, Circle, Server, HelpCircle } from 'lucide-react';

import { formatErrors } from '@/app/errorformat';
import { feGraphApiPostWrapper } from '@/app/feUtils';
import FBL4BLauncher from '@/app/components/Fbl4bLauncher';
import type { SessionInfo } from '@/app/types/api';
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
  // Timer used to delay closing so the mouse can travel from trigger → popover
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const reposition = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tooltipH = tooltipRef.current?.offsetHeight ?? 200;

    // Horizontal: center on anchor, then clamp to viewport
    const idealLeft = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    const clampedLeft = Math.max(TOOLTIP_MARGIN, Math.min(idealLeft, vw - TOOLTIP_WIDTH - TOOLTIP_MARGIN));
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
        fontFamily: 'inherit',
      });
    } else {
      setStyle({
        position: 'fixed',
        top: rect.top - 10,
        left: clampedLeft,
        transform: 'translateY(-100%)',
        zIndex: 9999,
        fontFamily: 'inherit',
      });
    }
  }, []);

  const handleMouseEnter = () => {
    cancelClose();
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
      onMouseLeave={scheduleClose}
    >
      {children}
      {open &&
        mounted &&
        createPortal(
          <div ref={tooltipRef} style={style} onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
            <div
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                width: `${TOOLTIP_WIDTH}px`,
                overflow: 'hidden',
                fontSize: '13px',
                color: '#111827',
              }}
            >
              {content}
            </div>
            {/* Arrow */}
            {placeBelow ? (
              // Arrow pointing up (tooltip is below anchor)
              <div
                style={{
                  position: 'absolute',
                  top: '-6px',
                  left: arrowLeft,
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderBottom: '6px solid white',
                }}
              />
            ) : (
              // Arrow pointing down (tooltip is above anchor)
              <div
                style={{
                  position: 'absolute',
                  bottom: '-6px',
                  left: arrowLeft,
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '6px solid white',
                }}
              />
            )}
          </div>,
          document.body,
        )}
    </span>
  );
}

function HelpDot({ tip }: { tip: React.ReactNode }) {
  return (
    <RichTip content={tip}>
      <span className="ml-1.5 w-4 h-4 inline-flex items-center justify-center rounded-full text-[10px] font-medium text-gray-400 border border-gray-300 cursor-help hover:text-gray-600 hover:border-gray-400 transition-colors select-none">
        ?
      </span>
    </RichTip>
  );
}

// Tooltip content builders
function TipSection({
  title,
  items,
  footer,
  docLink,
}: {
  title: string;
  items: { name: string; desc: string }[];
  footer?: string;
  docLink?: { href: string; label: string };
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
        <div className="px-4 pb-1 pt-1">
          <p className="text-[11px] text-gray-400 leading-relaxed">{footer}</p>
        </div>
      )}
      {docLink && (
        <div className="px-4 pb-3.5 pt-2 border-t border-gray-100">
          <a
            href={docLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            {docLink.label}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}

function TipBody({
  title,
  body,
  sections,
}: {
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
      { name: 'v2', desc: 'Classic ES with multiple forks and legacy features support.' },
      { name: 'v2-public-preview', desc: 'Mirrors v2 but uses Unified Onboarding UI for non-forked flows.' },
      { name: 'v3', desc: 'Similar to v2 without forks. Adds app-only feature flag and removes proxy sharing.' },
      { name: 'v3-public-preview', desc: 'Reveals Unified Onboarding UI for Cloud API onboarding.' },
      { name: 'v3-alpha-1', desc: 'Alpha release with expanded Unified Onboarding for select partners/products.' },
      { name: 'v4-public-preview (Testing only)', desc: 'Preview version of v4 for testing and feedback.' },
      { name: 'v4 (Recommended for production)', desc: 'Latest major release with enhanced features.' },
    ]}
    docLink={{
      href: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/versions',
      label: 'View version documentation',
    }}
  />
);

const FEATURE_TYPE_TIP = (
  <TipSection
    title="ES Feature Type"
    items={[
      {
        name: 'whatsapp_business_app_onboarding',
        desc: 'Enables the WhatsApp Business App phone number onboarding custom flow.',
      },
      { name: 'only_waba_sharing', desc: 'Enables the WhatsApp Business App phone number onboarding custom flow.' },
      { name: 'marketing_messages_lite', desc: 'Enables the MM API for WhatsApp onboarding custom flow.' },
      { name: 'none (Default)', desc: 'Leave blank to enable the default onboarding flow.' },
    ]}
    footer="Indicates a flow or feature to enable."
    docLink={{
      href: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/versions#overview-of-feature-availability',
      label: 'View feature availability documentation',
    }}
  />
);

const FEATURES_TIP = (
  <TipSection
    title="ES Features"
    items={[
      {
        name: 'app_only_install',
        desc: 'Allows partners to access WABAs via API using a granular token (BISU), without creating a system user access token (SUAT).',
      },
      { name: 'marketing_messages_lite', desc: 'Enables the MM API for WhatsApp onboarding flow.' },
    ]}
    footer="Indicates a flow or feature to enable. Select one or more, or leave empty for default behavior."
    docLink={{
      href: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/versions#overview-of-feature-availability',
      label: 'View feature availability documentation',
    }}
  />
);

function makePayloadBuilderTip(appId: string | number) {
  const devxUrl = `https://developers.facebook.com/apps/${appId}/business-login/configurations/`;
  return (
    <div>
      <div className="px-4 pt-3.5 pb-2 border-b border-gray-100">
        <p className="text-[13px] font-bold text-gray-900">Payload Builder</p>
      </div>
      <div className="px-4 py-3">
        <p className="text-[12px] text-gray-500 leading-relaxed">
          Your Tech Provider configuration token. Each config maps to a distinct app setup in Meta&apos;s system —
          controls which app_id and permissions are used.
        </p>
      </div>
      <div className="px-4 pb-3.5 border-t border-gray-100 pt-3">
        <p className="text-[12px] font-bold text-gray-800 mb-1">Need a new config?</p>
        <a
          href={devxUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[12px] text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Create one in DevX
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </div>
  );
}

// Multi-select dropdown for Features — uses portal to escape overflow:hidden parent
function FeaturesMultiSelect({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const reposition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  };

  const handleOpen = () => {
    reposition();
    setOpen((o) => !o);
  };

  const toggle = (opt: string) => {
    const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
    onChange(next);
  };

  const displayText =
    selected.length === 0 ? (
      <span className="text-gray-300">None (default)</span>
    ) : (
      selected.map((s, i) => (
        <span key={s} className="inline-flex items-center gap-0.5">
          <span className="bg-blue-50 text-blue-700 text-[11px] font-medium px-1.5 py-0.5 rounded">{s}</span>
          {i < selected.length - 1 && <span className="mx-0.5 text-gray-300">,</span>}
        </span>
      ))
    );

  const dropdownContent = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
    >
      {options.length > 0 ? (
        options.map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-[13px] text-gray-800">{opt}</span>
          </label>
        ))
      ) : (
        <div className="px-4 py-3">
          <p className="text-[12px] text-gray-400">No feature options available for this version.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="w-full min-h-9 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors text-left flex items-center justify-between gap-2"
      >
        <span className="flex flex-wrap gap-1 items-center">{displayText}</span>
        <svg
          className={cn('w-4 h-4 text-gray-400 flex-shrink-0 transition-transform', open && 'rotate-180')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && mounted && createPortal(dropdownContent, document.body)}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  tip,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  tip: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group/toggle">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
          checked ? 'bg-[#1877F2]' : 'bg-gray-200',
        )}
      >
        <span
          className={cn(
            'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
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
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all',
                  done ? 'bg-emerald-500 text-white' : active ? 'bg-[#1877F2] text-white' : 'bg-gray-200 text-gray-400',
                )}
              >
                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
              </div>
              <div>
                <div
                  className={cn(
                    'text-[12px] font-semibold leading-tight',
                    active ? 'text-slate-700' : done ? 'text-emerald-600' : 'text-gray-400',
                  )}
                >
                  {s.label}
                </div>
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

function SectionCard({
  icon,
  title,
  subtitle,
  children,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
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

function SelectField({
  label,
  tip,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; tip: React.ReactNode }) {
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

interface ClientDashboardProps {
  appId: string;
  appName: string;
  userId: string;
  tpConfigs: { id: string; name: string }[];
  publicEsVersions: string[];
  publicEsFeatureTypes: Record<string, string[]>;
  publicEsFeatureOptions: Record<string, string[]>;
}

export default function ClientDashboard({
  appId,
  appName,
  userId,
  tpConfigs,
  publicEsVersions,
  publicEsFeatureTypes,
  publicEsFeatureOptions,
}: ClientDashboardProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const updateUrlParams = (updates: Record<string, string | string[] | null | undefined>) => {
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
    const esVersion = searchParams.get('esVersion') || publicEsVersions[publicEsVersions.length - 1];
    const esFeatureType = searchParams.get('esFeatureType') || '';
    const esFeatures = searchParams.get('esFeatures') ? searchParams.get('esFeatures')!.split(',') : [];
    const tpConfig = searchParams.get('tpConfig') || tpConfigs[0]?.id || '';
    return { esVersion, esFeatureType, esFeatures, tpConfig };
  };

  const {
    esVersion: initialEsVersion,
    esFeatureType: initialEsFeatureType,
    esFeatures: initialEsFeatures,
    tpConfig: initialTpConfig,
  } = parseUrlParams();

  const [esOptionFeatureType, setEsOptionFeatureType] = useState(initialEsFeatureType);
  const [esOptionFeatures, setEsOptionFeatures] = useState(initialEsFeatures);
  const [esOptionConfig, setEsOptionConfig] = useState(initialTpConfig);
  const [esOptionVersion, setEsOptionVersion] = useState(initialEsVersion);
  const [esOptionReg, setEsOptionReg] = useState(true);
  const [esOptionSub, setEsOptionSub] = useState(true);
  const [step, setStep] = useState<Step>(1);

  const computeEsConfig = (ft: string, cfg: string, feats: string[], ver: string) => {
    const c: Record<string, unknown> = {
      config_id: cfg,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        sessionInfoVersion: '3',
        version: ver,
        featureType: ft,
        features: feats ? feats.map((f: string) => ({ name: f })) : null,
      },
    };
    if (ft === '') delete (c.extras as Record<string, unknown>).featureType;
    return c;
  };

  const [esConfig, setEsConfig] = useState(
    JSON.stringify(computeEsConfig(esOptionFeatureType, esOptionConfig, esOptionFeatures, esOptionVersion), null, 2),
  );
  const [_bannerInfo, setBannerInfo] = useState<string>('');
  const [lastEventData, setLastEventData] = useState<unknown>(null);

  const recomputeJson = (ft: string, cfg: string, feats: string[], ver: string) => {
    setEsConfig(JSON.stringify(computeEsConfig(ft, cfg, feats, ver), null, 2));
    setStep(2);
  };

  // Only show bannerInfo when ES has actually finished (not intermediate "ES Started..." state)
  const handleBannerInfoChange = useCallback((info: string) => {
    // Suppress intermediate "ES Started..." message — only surface final outcomes
    if (info === 'ES Started...') return;
    setBannerInfo(info);
  }, []);
  const handleLastEventDataChange = useCallback((data: unknown) => setLastEventData(data), []);

  const handleSaveToken = useCallback(
    async (code: string, sessionInfo: SessionInfo) => {
      setBannerInfo('Setting up WABA...');
      const {
        waba_id: wabaId,
        business_id: businessId,
        phone_number_id: phoneNumberId,
        page_ids: pageIds,
        ad_account_ids: adAccountIds,
        catalog_ids: catalogIds,
        dataset_ids: datasetIds,
        instagram_account_ids: instagramAccountIds,
      } = sessionInfo.data;
      const filterIds = (ids: string[] | undefined) => (ids || []).filter((id) => id && id.trim() !== '');
      try {
        const d = await feGraphApiPostWrapper('/api/token', {
          code,
          app_id: appId,
          waba_id: wabaId,
          waba_ids: wabaId ? [wabaId] : [],
          business_id: businessId,
          phone_number_id: phoneNumberId,
          page_ids: pageIds || [],
          ad_account_ids: adAccountIds || [],
          dataset_ids: filterIds(datasetIds),
          catalog_ids: filterIds(catalogIds),
          instagram_account_ids: filterIds(instagramAccountIds),
          es_option_reg: esOptionReg,
          es_option_sub: esOptionSub,
          user_id: userId,
        });
        setBannerInfo('WABA Setup Finished\n' + formatErrors(d) + '\n');
      } catch (err) {
        console.error('WABA setup failed:', err);
        setBannerInfo('WABA Setup Failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    },
    [appId, esOptionReg, esOptionSub, userId],
  );

  const handleClickFbl4b = useCallback(() => {
    setStep(3);
  }, []);

  const setFt = (v: string) => {
    if (v === 'only_waba_sharing') setEsOptionReg(false);
    setEsOptionFeatureType(v);
    updateUrlParams({ esFeatureType: v });
    recomputeJson(v, esOptionConfig, esOptionFeatures, esOptionVersion);
  };
  const setCfg = (v: string) => {
    setEsOptionConfig(v);
    updateUrlParams({ tpConfig: v });
    recomputeJson(esOptionFeatureType, v, esOptionFeatures, esOptionVersion);
  };
  const setReg = (v: boolean) => {
    if (v && esOptionFeatureType === 'only_waba_sharing') setFt('');
    setEsOptionReg(v);
  };
  const setVer = (v: string) => {
    setEsOptionVersion(v);
    updateUrlParams({ esVersion: v });
    recomputeJson(esOptionFeatureType, esOptionConfig, esOptionFeatures, v);
  };
  const setFeats = (f: string[]) => {
    setEsOptionFeatures(f);
    updateUrlParams({ esFeatures: f });
    recomputeJson(esOptionFeatureType, esOptionConfig, f, esOptionVersion);
  };

  const highlightJson = (json: string) => {
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'text-amber-700';
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'text-blue-700' : 'text-emerald-700';
        } else if (/true|false/.test(match)) cls = 'text-violet-700';
        else if (/null/.test(match)) cls = 'text-red-500';
        return `<span class="${cls}">${match}</span>`;
      },
    );
  };

  return (
    <div className="p-6 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-4">
        <a
          target="_blank"
          href={`https://developers.facebook.com/apps/${appId}`}
          className="hover:text-gray-700 transition-colors font-mono"
        >
          App {appId}
        </a>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600">Configuration</span>
      </div>

      {/* Page title */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-700">Payload Builder</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          Build your Embedded Signup payload. The JSON updates live as you adjust options.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Main grid */}
      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Left column */}
        <div className="space-y-5">
          {/* Payload Builder card */}
          <SectionCard
            icon={<Settings2 className="w-4 h-4" />}
            title="Payload Builder"
            subtitle="Select a configuration and set parameters"
          >
            <div className="space-y-5">
              <SelectField
                label="Config"
                tip={makePayloadBuilderTip(appId)}
                value={esOptionConfig}
                onChange={(e) => setCfg(e.target.value)}
              >
                {tpConfigs.map((config: { id: string; name: string }, i: number) => (
                  <option key={`${config.id}-${i}`} value={config.id}>
                    {config.name} ({config.id})
                  </option>
                ))}
              </SelectField>

              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  label="Version"
                  tip={VERSION_TIP}
                  value={esOptionVersion}
                  onChange={(e) => setVer(e.target.value)}
                >
                  {publicEsVersions
                    .filter((v) => !['v3-alpha-1', 'v4-public-preview'].includes(v))
                    .map((v: string) => (
                      <option key={v} value={v}>
                        {v === 'v4' ? 'v4 (Recommended for production)' : v}
                      </option>
                    ))}
                </SelectField>
                <SelectField
                  label="Feature Type"
                  tip={FEATURE_TYPE_TIP}
                  value={esOptionFeatureType}
                  onChange={(e) => setFt(e.target.value)}
                >
                  <option key="" value="">
                    None
                  </option>
                  {publicEsFeatureTypes[esOptionVersion]?.map((ft: string) => (
                    <option key={ft} value={ft}>
                      {ft}
                    </option>
                  ))}
                </SelectField>
              </div>

              <div>
                <label className="flex items-center text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Features <HelpDot tip={FEATURES_TIP} />
                </label>
                <FeaturesMultiSelect
                  options={publicEsFeatureOptions?.[esOptionVersion] ?? []}
                  selected={esOptionFeatures}
                  onChange={setFeats}
                />
              </div>
            </div>
          </SectionCard>

          {/* Generated Payload card */}
          <SectionCard
            icon={<Code2 className="w-4 h-4" />}
            title="Generated Payload"
            subtitle="Passed to FB.login(callback, payload) · updates live"
          >
            <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">JSON</span>
                <a
                  href="https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/implementation#step-3-add-embedded-signup-to-your-website"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-blue-600 transition-colors font-mono"
                >
                  FB.login(callback, payload) <ExternalLink className="w-2.5 h-2.5" />
                </a>
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

          {/* Server Actions After Signup — moved to bottom */}
          <SectionCard
            icon={<Server className="w-4 h-4" />}
            title="Post-Signup Server Actions"
            subtitle="Automatic server-side calls triggered on a successful embedded signup"
          >
            <div className="space-y-3">
              <Toggle
                checked={esOptionReg}
                onChange={setReg}
                label="Register number"
                tip={
                  <TipBody
                    title="Register number"
                    body="Calls the register phone number API automatically after a successful signup. Required before sending messages. Disable if you want to register manually."
                  />
                }
              />
              <Toggle
                checked={esOptionSub}
                onChange={setEsOptionSub}
                label="Subscribe webhooks"
                tip={
                  <TipBody
                    title="Subscribe webhooks"
                    body="Subscribes the WABA to your app's webhooks automatically after signup. Disable if you manage webhook subscriptions separately."
                  />
                }
              />
            </div>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <div className="sticky top-20 space-y-5">
            <SectionCard icon={<Rocket className="w-4 h-4" />} title="Launch" subtitle="Start the Embedded Signup flow">
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-4 space-y-1.5">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Current Config
                </div>
                {[
                  { label: 'Config ID', value: esOptionConfig },
                  { label: 'Version', value: esOptionVersion },
                  { label: 'Feature Type', value: esOptionFeatureType || 'None' },
                  { label: 'Register number', value: esOptionReg ? 'On' : 'Off' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-800 font-mono text-[11px] truncate max-w-[140px]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <FBL4BLauncher
                appId={appId}
                appName={appName}
                esConfig={esConfig}
                onClickFbl4b={handleClickFbl4b}
                onBannerInfoChange={handleBannerInfoChange}
                onLastEventDataChange={handleLastEventDataChange}
                onSaveToken={handleSaveToken}
                onQuickLaunch={undefined}
              />
              {/* Facebook Login for Business settings reminder */}
              <p className="mt-2 text-[11px] text-gray-400 leading-relaxed">
                <span className="text-gray-500">Before launching, add your domain in </span>
                <a
                  href={`https://developers.facebook.com/apps/${appId}/business-login/settings/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-500 transition-colors"
                >
                  Facebook Login for Business → Settings
                </a>
                {' '}
                <RichTip content={
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-[12px] font-semibold text-gray-800">What to add in Settings</p>
                    <p className="text-[11px] text-gray-500"><span className="font-medium text-gray-700">Valid OAuth Redirect URIs</span> &mdash; your app&apos;s domain</p>
                    <p className="text-[11px] text-gray-500"><span className="font-medium text-gray-700">Allowed Domains for the JavaScript SDK</span> &mdash; your app&apos;s domain</p>
                  </div>
                }>
                  <HelpCircle className="inline w-3 h-3 text-gray-400 cursor-help" />
                </RichTip>
              </p>
            </SectionCard>

            <SectionCard icon={<Code2 className="w-4 h-4" />} title="Response" subtitle="Results from the signup flow">
              {lastEventData ? (
                <div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Session Event
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 overflow-auto max-h-48 border border-gray-200">
                    <pre className="text-[11px] text-gray-700 font-mono whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(lastEventData, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-gray-200 rounded-xl py-8 text-center">
                  <Circle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-[13px] text-gray-400 font-medium">No response yet</p>
                  <p className="text-[11px] text-gray-300 mt-0.5">Results appear here after launching</p>
                </div>
              )}
              <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
                <a
                  href="https://developers.facebook.com/docs/whatsapp/embedded-signup/implementation#session-logging-message-event-listener"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-600 transition-colors"
                >
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
