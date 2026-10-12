'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

interface Domain {
  id: string;
  domain_name: string;
  settings: {
    banner_text: string;
    primary_color: string;
    background_color: string;
    button_text: string;
  };
}

export default function DashboardPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
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
        },
      ])
      .select();

    if (!error && data) {
      setDomains([...domains, data[0]]);
      setNewDomain('');
    }
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
            domains.map((domain) => (
              <div key={domain.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-blue-400">{domain.domain_name}</h3>
                  <span className="text-xs bg-zinc-800 px-3 py-1 rounded-full text-zinc-400">
                    ID: {domain.id}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 mb-2 font-mono">Embed Script Code:</p>
                <div className="bg-zinc-950 p-4 rounded-lg font-mono text-xs border border-zinc-800 text-zinc-300 overflow-x-auto">
                  {`<script src="${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'http://localhost:3000' : ''}/banner.js" data-site-id="${domain.id}" defer></script>`}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}