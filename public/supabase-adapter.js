(function () {
  const config = window.MOURAGRID_SUPABASE_CONFIG || {};
  const originalFetch = window.fetch.bind(window);
  const isConfigured = config.url && config.anonKey && !config.url.includes('COLE_AQUI') && !config.anonKey.includes('COLE_AQUI');

  if (!window.supabase || !isConfigured) {
    window.fetch = async function (input, options = {}) {
      const url = typeof input === 'string' ? input : input.url;
      if (url === '/api/state' || url.endsWith('/api/state')) {
        return jsonResponse({
          clients: [],
          selectedClientId: null,
          updatedAt: new Date().toISOString(),
          error: 'Configure o Supabase em supabase-config.js para carregar os dados online.'
        }, 500);
      }
      return originalFetch(input, options);
    };
    return;
  }

  const client = window.supabase.createClient(config.url, config.anonKey);

  window.fetch = async function (input, options = {}) {
    const url = typeof input === 'string' ? input : input.url;
    if (url !== '/api/state' && !url.endsWith('/api/state')) {
      return originalFetch(input, options);
    }

    try {
      if ((options.method || 'GET').toUpperCase() === 'POST') {
        const state = JSON.parse(options.body || '{}');
        await saveState(state);
      }

      const state = await loadState();
      return jsonResponse(state, 200);
    } catch (error) {
      return jsonResponse({ error: error.message || 'Falha ao acessar o Supabase.' }, 500);
    }
  };

  async function loadState() {
    const { data: clients, error } = await client
      .from('clients')
      .select('*, services(*)')
      .order('name', { ascending: true });

    if (error) throw error;

    const mappedClients = (clients || []).map(row => ({
      id: row.id,
      name: row.name,
      hours: Number(row.hours || 0),
      contactName: row.contact_name || '',
      contactEmail: row.contact_email || '',
      contactPhone: row.contact_phone || '',
      contractType: row.contract_type || 'Suporte',
      notes: row.notes || '',
      updatedAt: row.updated_at || '',
      services: (row.services || [])
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
        .map(service => ({
          id: service.id,
          date: service.date,
          hours: Number(service.hours || 0),
          agent: service.agent || '',
          category: service.category || 'Suporte',
          description: service.description || '',
          updatedAt: service.updated_at || ''
        }))
    }));

    const updatedAt = maxDate([
      ...mappedClients.map(clientItem => clientItem.updatedAt),
      ...mappedClients.flatMap(clientItem => clientItem.services.map(service => service.updatedAt))
    ]);

    return {
      clients: mappedClients,
      selectedClientId: mappedClients[0]?.id || null,
      updatedAt
    };
  }

  async function saveState(state) {
    const clients = Array.isArray(state.clients) ? state.clients : [];
    const clientRows = clients.map(clientItem => ({
      id: clientItem.id,
      name: clientItem.name,
      hours: Number(clientItem.hours || 0),
      contact_name: clientItem.contactName || '',
      contact_email: clientItem.contactEmail || '',
      contact_phone: clientItem.contactPhone || '',
      contract_type: clientItem.contractType || 'Suporte',
      notes: clientItem.notes || ''
    }));

    if (clientRows.length) {
      const { error } = await client.from('clients').upsert(clientRows, { onConflict: 'id' });
      if (error) throw error;
    }

    const serviceRows = clients.flatMap(clientItem => (clientItem.services || []).map(service => ({
      id: service.id,
      client_id: clientItem.id,
      date: service.date,
      hours: Number(service.hours || 0),
      agent: service.agent || '',
      category: service.category || 'Suporte',
      description: service.description || ''
    })));

    if (serviceRows.length) {
      const { error } = await client.from('services').upsert(serviceRows, { onConflict: 'id' });
      if (error) throw error;
    }
  }

  function jsonResponse(payload, status) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  function maxDate(values) {
    const valid = values.filter(Boolean).sort();
    return valid[valid.length - 1] || new Date(0).toISOString();
  }
})();
