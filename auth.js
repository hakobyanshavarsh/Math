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

  async sendCode(email) {
    if (this.sb) {
      const { error } = await this.sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw error;
    }
  },
  async verifyCode(email, token) {
    if (this.sb) {
      const { data, error } = await this.sb.auth.verifyOtp({ email, token, type: "email" });
      if (error) throw error;
      return data.user;
    }
    if (token !== "123456") throw new Error("Demo mode: use code 123456");
    const u = { id: email, email }; localStorage.setItem("mv_user", JSON.stringify(u)); return u;
  },
  hasPassword(u) { return !!((u.user_metadata && u.user_metadata.has_password) || u.has_password); },
  async setPassword(password) {
    if (this.sb) {
      const { data, error } = await this.sb.auth.updateUser({ password, data: { has_password: true } });
      if (error) throw error;
      return data.user;
    }
    const u = JSON.parse(localStorage.getItem("mv_user")); u.has_password = true;
    localStorage.setItem("mv_user", JSON.stringify(u)); return u;
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
