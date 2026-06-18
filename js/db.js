// ============================================================
// CAMADA DE DADOS — Supabase + Auth (login por e-mail)
// Sem config => modo local. Com config => exige login.
// Expõe window.Store
// ============================================================
(function () {
  const LS_KEY = "casava_fin_v2";
  const cfg = window.CASAVA_CONFIG || {};
  const hasSB = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  const sb = hasSB ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

  function seedTxs() {
    const inc = [
      ["2026-05-01", "Transferência própria (PF)", "Próprio", "proprio", 29.45],
      ["2026-05-03", "Raphael Santos Ambrosio", "Serviços", "negocio", 500],
      ["2026-05-04", "Rubenilson + João Pedro", "Serviços", "negocio", 90],
      ["2026-05-05", "Raphael Santos Ambrosio", "Serviços", "negocio", 700],
      ["2026-05-05", "Reembolsos Uber (3x)", "Reembolso", "proprio", 116.95],
      ["2026-05-07", "Resgate RDB + reembolso 99", "Resgate", "proprio", 113.10],
      ["2026-05-09", "Raphael Santos Ambrosio", "Serviços", "negocio", 500],
      ["2026-05-10", "Própria + Resgate RDB", "Resgate", "proprio", 84.73],
      ["2026-05-11", "João Pedro da Silva Tomé", "Serviços", "negocio", 50],
      ["2026-05-13", "Rubenilson", "Serviços", "negocio", 20],
      ["2026-05-14", "Transferência própria", "Próprio", "proprio", 7.62],
      ["2026-05-19", "Bernardo Cleiton", "Outros", "proprio", 2],
      ["2026-05-20", "Raphael Santos Ambrosio", "Serviços", "negocio", 1100],
      ["2026-06-01", "Transferência própria (PF)", "Próprio", "proprio", 226],
      ["2026-06-04", "NEW COMERCE LTDA", "Serviços", "negocio", 2500],
      ["2026-06-09", "Transferência própria", "Próprio", "proprio", 0.36],
      ["2026-06-10", "Jhenyffer Lemes Dina", "Serviços", "negocio", 715.38],
      ["2026-06-14", "ICE PARTS REFRIGERAÇÃO", "Serviços", "negocio", 3000],
      ["2026-06-15", "Transferência própria (PF)", "Próprio", "proprio", 100],
    ].map((r) => ({ date: r[0], description: r[1], category: r[2], side: r[3], type: "in", amount: r[4] }));
    const maite = [
      ["2026-05-03", 400], ["2026-05-06", 200], ["2026-05-09", 85], ["2026-05-20", 650],
      ["2026-06-02", 60], ["2026-06-04", 500], ["2026-06-11", 140], ["2026-06-14", 1000],
      ["2026-06-15", 150], ["2026-06-17", 150], ["2026-06-17", 189],
    ].map((r) => ({ date: r[0], description: "Pix para Maria Luiza (Maitê)", category: "Maitê", side: "maite", type: "out", amount: r[1] }));
    const eduardo = [
      ["Alimentação (resumo do período)", "Alimentação", 1993.40],
      ["Transporte por app — Uber/99 (resumo)", "Transporte app", 611.89],
      ["Marketplace / compras (resumo)", "Compras", 506.21],
      ["Combustível (resumo)", "Combustível", 107.69],
      ["Barbearia (Big Man)", "Cuidado pessoal", 160],
      ["Assinaturas (GGMAX)", "Assinaturas", 93.80],
      ["Transporte público (BRT/Bilhete)", "Transporte público", 55],
      ["Educação / material", "Educação", 65],
      ["Cigarro/Tabaco", "Outros", 30],
      ["Investimento aplicado (RDB)", "Investimento", 175],
      ["Diversos / Pix a terceiros (resumo)", "Diversos", 2533.51],
    ].map((r) => ({ date: "2026-06-18", description: r[0], category: r[1], side: "eduardo", type: "out", amount: r[2] }));
    return [...inc, ...maite, ...eduardo];
  }

  // ---------- LOCAL ----------
  function loadLocal() { try { const r = localStorage.getItem(LS_KEY); if (r) return JSON.parse(r); } catch (e) {} return null; }
  function saveLocal(s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) {} }
  function freshLocal() { return { settings: { meta: 1000, saldo_inicial: 0.13 }, txs: seedTxs().map((t) => ({ id: uid(), ...t })), savings: [] }; }

  const Store = {
    mode: hasSB ? "supabase" : "local",
    user: null,
    state: { settings: { meta: 1000, saldo_inicial: 0.13 }, txs: [], savings: [] },

    // ---------- AUTH ----------
    async getUser() {
      if (!sb) return null;
      const { data } = await sb.auth.getUser();
      this.user = data ? data.user : null;
      return this.user;
    },
    onAuthChange(cb) { if (sb) sb.auth.onAuthStateChange((_e, session) => { this.user = session ? session.user : null; cb(this.user); }); },
    async signIn(email, password) { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; },
    async signUp(email, password) { const { error } = await sb.auth.signUp({ email, password }); if (error) throw error; },
    async signOut() { if (sb) await sb.auth.signOut(); this.user = null; },

    // ---------- LOAD ----------
    async load() {
      if (this.mode === "supabase") { await this._sbLoad(); return; }
      this.state = loadLocal() || freshLocal(); saveLocal(this.state);
    },
    async _sbLoad() {
      let { data: st } = await sb.from("settings").select("*").limit(1).maybeSingle();
      if (!st) { const r = await sb.from("settings").insert({ meta: 1000, saldo_inicial: 0.13 }).select().single(); st = r.data; }
      this.state.settings = { id: st.id, meta: Number(st.meta), saldo_inicial: Number(st.saldo_inicial) };

      let { data: txs } = await sb.from("transactions").select("*").order("date", { ascending: false });
      if (!txs || txs.length === 0) {
        await sb.from("transactions").insert(seedTxs());
        ({ data: txs } = await sb.from("transactions").select("*").order("date", { ascending: false }));
      }
      this.state.txs = (txs || []).map(this._num);
      const { data: sv } = await sb.from("savings").select("*").order("date", { ascending: false });
      this.state.savings = (sv || []).map(this._num);
    },
    _num(r) { return { ...r, amount: Number(r.amount) }; },

    // ---------- MUTATIONS ----------
    async addTx(tx) {
      if (this.mode === "supabase") { const { data, error } = await sb.from("transactions").insert(tx).select().single(); if (error) throw error; this.state.txs.push(this._num(data)); }
      else { this.state.txs.push({ id: uid(), ...tx }); saveLocal(this.state); }
    },
    async delTx(id) {
      if (this.mode === "supabase") { const { error } = await sb.from("transactions").delete().eq("id", id); if (error) throw error; }
      this.state.txs = this.state.txs.filter((t) => t.id !== id);
      if (this.mode === "local") saveLocal(this.state);
    },
    async addSaving(s) {
      if (this.mode === "supabase") { const { data, error } = await sb.from("savings").insert(s).select().single(); if (error) throw error; this.state.savings.push(this._num(data)); }
      else { this.state.savings.push({ id: uid(), ...s }); saveLocal(this.state); }
    },
    async setMeta(meta) {
      if (this.mode === "supabase") { const { error } = await sb.from("settings").update({ meta, updated_at: new Date().toISOString() }).eq("id", this.state.settings.id); if (error) throw error; }
      this.state.settings.meta = meta;
      if (this.mode === "local") saveLocal(this.state);
    },
    async reset() {
      if (this.mode === "supabase") {
        await sb.from("transactions").delete().not("id", "is", null);
        await sb.from("savings").delete().not("id", "is", null);
        await sb.from("settings").update({ meta: 1000, saldo_inicial: 0.13 }).eq("id", this.state.settings.id);
        await sb.from("transactions").insert(seedTxs());
        await this._sbLoad();
      } else { this.state = freshLocal(); saveLocal(this.state); }
    },
  };

  window.Store = Store;
})();
