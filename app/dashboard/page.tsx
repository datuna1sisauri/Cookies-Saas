'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

const DEFAULT_PRIMARY = '#2563eb';
const DEFAULT_SECONDARY = '#18181b';
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

interface DomainSettings {
  banner_text: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  button_text: string;
}

interface Domain {
  id: string;
  domain_name: string;
  settings: DomainSettings | null;
}

function normalizeSettings(settings: DomainSettings | null | undefined): DomainSettings {
  return {
    banner_text:
      settings?.banner_text ||
      'We use cookies to enhance your experience and analyze site traffic in accordance with GDPR standards.',
    primary_color: settings?.primary_color || DEFAULT_PRIMARY,
    secondary_color: settings?.secondary_color || settings?.background_color || DEFAULT_SECONDARY,
    background_color: settings?.secondary_color || settings?.background_color || DEFAULT_SECONDARY,
    button_text: settings?.button_text || 'Accept All',
  };
}

export default function DashboardPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [colorDrafts, setColorDrafts] = useState<
    Record<string, { primary_color: string; secondary_color: string }>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    checkUserAndFetchData();
  }, []);

  const checkUserAndFetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      setDomains(data);
      const drafts: Record<string, { primary_color: string; secondary_color: string }> = {};
      for (const domain of data as Domain[]) {
        const settings = normalizeSettings(domain.settings);
        drafts[domain.id] = {
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
        };
      }
      setColorDrafts(drafts);
    }
    setLoading(false);
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('domains')
      .insert([
        {
          user_id: user.id,
          domain_name: newDomain,
          settings: normalizeSettings(null),
        },
      ])
      .select();

    if (!error && data) {
      const domain = data[0] as Domain;
      const settings = normalizeSettings(domain.settings);
      setDomains([...domains, domain]);
      setColorDrafts({
        ...colorDrafts,
        [domain.id]: {
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
        },
      });
      setNewDomain('');
    }
  };

  const updateDraft = (
    domainId: string,
    field: 'primary_color' | 'secondary_color',
    value: string
  ) => {
    setColorDrafts((prev) => ({
      ...prev,
      [domainId]: {
        primary_color: prev[domainId]?.primary_color || DEFAULT_PRIMARY,
        secondary_color: prev[domainId]?.secondary_color || DEFAULT_SECONDARY,
        [field]: value,
      },
    }));
  };

  const handleSaveColors = async (domain: Domain) => {
    const draft = colorDrafts[domain.id];
    if (!draft) return;

    if (!HEX_COLOR.test(draft.primary_color) || !HEX_COLOR.test(draft.secondary_color)) {
      setSaveMessage({
        ...saveMessage,
        [domain.id]: 'Use 6-digit hex colors, e.g. #2563eb',
      });
      return;
    }

    setSavingId(domain.id);
    const nextSettings: DomainSettings = {
      ...normalizeSettings(domain.settings),
      primary_color: draft.primary_color,
      secondary_color: draft.secondary_color,
      background_color: draft.secondary_color,
    };

    const { error } = await supabase
      .from('domains')
      .update({ settings: nextSettings })
      .eq('id', domain.id);

    setSavingId(null);

    if (error) {
      setSaveMessage({ ...saveMessage, [domain.id]: error.message });
      return;
    }

    setDomains(
      domains.map((item) =>
        item.id === domain.id ? { ...item, settings: nextSettings } : item
      )
    );
    setSaveMessage({ ...saveMessage, [domain.id]: 'Colors saved' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold">Cookie Consent Dashboard</h1>
            <p className="text-zinc-400 text-sm">Manage your registered domains and embed scripts</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition"
          >
            Log Out
          </button>
        </header>

        {/* Add Domain Form */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Add a New Domain</h2>
          <form onSubmit={handleAddDomain} className="flex gap-4">
            <input
              type="text"
              placeholder="e.g. mywebsite.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              required
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 font-medium rounded-lg text-sm transition"
            >
              Add Domain
            </button>
          </form>
        </section>

        {/* Domain List */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">Your Domains</h2>
          {domains.length === 0 ? (
            <p className="text-zinc-500 text-sm">No domains added yet. Add one above to get started.</p>
          ) : (
            domains.map((domain) => {
              const draft = colorDrafts[domain.id] || {
                primary_color: DEFAULT_PRIMARY,
                secondary_color: DEFAULT_SECONDARY,
              };

              return (
                <div key={domain.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold" style={{ color: draft.primary_color }}>
                      {domain.domain_name}
                    </h3>
                    <span className="text-xs bg-zinc-800 px-3 py-1 rounded-full text-zinc-400">
                      ID: {domain.id}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 mb-2 font-mono">Embed Script Code:</p>
                  <div className="bg-zinc-950 p-4 rounded-lg font-mono text-xs border border-zinc-800 text-zinc-300 overflow-x-auto mb-6">
                    {`<script src="${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'https://cookies-saas.vercel.app' : ''}/banner.js" data-site-id="${domain.id}" defer></script>`}
                  </div>

                  <div className="border-t border-zinc-800 pt-5">
                    <h4 className="text-sm font-semibold mb-1">Banner colors</h4>
                    <p className="text-xs text-zinc-500 mb-4">
                      First color is the accept button. Secondary color is the banner background.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <label className="block">
                        <span className="block text-xs font-medium text-zinc-400 mb-2">First color</span>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={HEX_COLOR.test(draft.primary_color) ? draft.primary_color : DEFAULT_PRIMARY}
                            onChange={(e) => updateDraft(domain.id, 'primary_color', e.target.value)}
                            className="h-10 w-12 rounded border border-zinc-700 bg-zinc-800 cursor-pointer"
                            aria-label="First color"
                          />
                          <input
                            type="text"
                            value={draft.primary_color}
                            onChange={(e) => updateDraft(domain.id, 'primary_color', e.target.value)}
                            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500"
                            placeholder="#2563eb"
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="block text-xs font-medium text-zinc-400 mb-2">Secondary color</span>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={HEX_COLOR.test(draft.secondary_color) ? draft.secondary_color : DEFAULT_SECONDARY}
                            onChange={(e) => updateDraft(domain.id, 'secondary_color', e.target.value)}
                            className="h-10 w-12 rounded border border-zinc-700 bg-zinc-800 cursor-pointer"
                            aria-label="Secondary color"
                          />
                          <input
                            type="text"
                            value={draft.secondary_color}
                            onChange={(e) => updateDraft(domain.id, 'secondary_color', e.target.value)}
                            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500"
                            placeholder="#18181b"
                          />
                        </div>
                      </label>
                    </div>

                    <div
                      className="rounded-xl p-4 mb-4 max-w-md"
                      style={{ backgroundColor: HEX_COLOR.test(draft.secondary_color) ? draft.secondary_color : DEFAULT_SECONDARY }}
                    >
                      <p className="text-sm text-zinc-300 mb-3">
                        We use cookies to enhance your experience and analyze site traffic in accordance with GDPR standards.
                      </p>
                      <div className="flex gap-2">
                        <span className="flex-1 text-center text-xs font-semibold py-2 rounded-lg border text-zinc-100" style={{ borderColor: draft.primary_color }}>
                          Reject All
                        </span>
                        <span
                          className="flex-1 text-center text-xs font-semibold py-2 rounded-lg text-white"
                          style={{ backgroundColor: HEX_COLOR.test(draft.primary_color) ? draft.primary_color : DEFAULT_PRIMARY }}
                        >
                          Accept All
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleSaveColors(domain)}
                        disabled={savingId === domain.id}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 font-medium rounded-lg text-sm transition"
                      >
                        {savingId === domain.id ? 'Saving...' : 'Save colors'}
                      </button>
                      {saveMessage[domain.id] && (
                        <p className="text-xs text-zinc-400">{saveMessage[domain.id]}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
