// Auth + progress. Works in demo mode (localStorage) until Supabase is configured.
const Auth = {
  sb: (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY && window.supabase)
    ? supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY) : null,
  get demo() { return !this.sb; },

  async user() {
    if (this.sb) { const { data } = await this.sb.auth.getSession(); return data.session ? data.session.user : null; }
    return JSON.parse(localStorage.getItem("mv_user") || "null");
  },
  async signUp(email, password) {
    if (this.sb) {
      const { data, error } = await this.sb.auth.signUp({ email, password });
      if (error) throw error;
      return data.session ? data.user : null; // null -> email confirmation required
    }
    const u = { id: email, email }; localStorage.setItem("mv_user", JSON.stringify(u)); return u;
  },
  async signIn(email, password) {
    if (this.sb) {
      const { data, error } = await this.sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    }
    const u = { id: email, email }; localStorage.setItem("mv_user", JSON.stringify(u)); return u;
  },
  async signOut() {
    if (this.sb) await this.sb.auth.signOut(); else localStorage.removeItem("mv_user");
  },

  async resetPassword(email) {
    if (!this.sb) throw new Error("Password reset needs Supabase (not available in demo mode).");
    const { error } = await this.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    if (error) throw error;
  },
  async updatePassword(password) {
    const { data, error } = await this.sb.auth.updateUser({ password });
    if (error) throw error;
    return data.user;
  },

  async saveProgress(user, exerciseId, correct) {
    if (this.sb) {
      const { data } = await this.sb.from("progress").select("attempts,correct").eq("exercise_id", exerciseId).maybeSingle();
      const { error } = await this.sb.from("progress").upsert({
        user_id: user.id, exercise_id: exerciseId,
        correct: correct || (data && data.correct) || false,
        attempts: ((data && data.attempts) || 0) + 1,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,exercise_id" });
      if (error) console.error(error);
      return;
    }
    const key = "mv_progress_" + user.id;
    const all = JSON.parse(localStorage.getItem(key) || "{}");
    const cur = all[exerciseId] || { correct: false, attempts: 0 };
    all[exerciseId] = { correct: cur.correct || correct, attempts: cur.attempts + 1 };
    localStorage.setItem(key, JSON.stringify(all));
  },
  async loadProgress(user) {
    if (this.sb) {
      const { data } = await this.sb.from("progress").select("exercise_id,correct,attempts");
      return data || [];
    }
    const all = JSON.parse(localStorage.getItem("mv_progress_" + user.id) || "{}");
    return Object.entries(all).map(([exercise_id, v]) => ({ exercise_id, ...v }));
  }
};
