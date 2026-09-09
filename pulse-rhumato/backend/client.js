// Pulse Rhumato cloud client. Values are injected after backend provisioning.
window.PULSE_BACKEND = {
  url: '',
  anonKey: ''
};

window.PulseCloud = {
  client: null,
  init() {
    const cfg = window.PULSE_BACKEND;
    if (!cfg?.url || !cfg?.anonKey || !window.supabase) return false;
    this.client = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return true;
  },
  async session() {
    if (!this.client) return null;
    const { data } = await this.client.auth.getSession();
    return data.session;
  },
  async signUp(email, password) {
    if (!this.client) throw new Error('Backend non configuré');
    return this.client.auth.signUp({ email, password });
  },
  async signIn(email, password) {
    if (!this.client) throw new Error('Backend non configuré');
    return this.client.auth.signInWithPassword({ email, password });
  },
  async signOut() {
    if (this.client) await this.client.auth.signOut();
  },
  async saveProgress(questionId, payload) {
    const s = await this.session();
    if (!s) return false;
    const row = { user_id: s.user.id, question_id: questionId, ...payload, last_seen_at: new Date().toISOString() };
    const { error } = await this.client.from('question_progress').upsert(row, { onConflict: 'user_id,question_id' });
    if (error) throw error;
    return true;
  },
  async saveReview(questionId, courseId, stage, dueDate, status='scheduled') {
    const s = await this.session();
    if (!s) return false;
    const row = { user_id: s.user.id, question_id: questionId, course_id: courseId, stage, due_date: dueDate, status };
    const { error } = await this.client.from('review_schedule').upsert(row, { onConflict: 'user_id,question_id' });
    if (error) throw error;
    return true;
  },
  async loadAll() {
    const s = await this.session();
    if (!s) return null;
    const [q,r,u] = await Promise.all([
      this.client.from('question_progress').select('*'),
      this.client.from('review_schedule').select('*'),
      this.client.from('user_stats').select('*').maybeSingle()
    ]);
    if (q.error) throw q.error; if (r.error) throw r.error;
    return { questions:q.data||[], reviews:r.data||[], stats:u.data||null };
  }
};
