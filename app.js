const $ = id => document.getElementById(id);
let mode = "login"; // login | signup | reset | newpw
const TITLES = { login: "Log in", signup: "Sign up", reset: "Reset password", newpw: "Set a new password" };
const BTN = { login: "Log in", signup: "Create account", reset: "Send reset link", newpw: "Save password" };

function view() {
  $("authTitle").textContent = TITLES[mode];
  $("authBtn").textContent = BTN[mode];
  $("lblEmail").hidden = mode === "newpw";
  $("lblPw").hidden = mode === "reset";
  $("lblPw2").hidden = !(mode === "signup" || mode === "newpw");
  $("tabs").hidden = mode === "newpw";
  $("tabLogin").classList.toggle("on", mode === "login");
  $("tabSignup").classList.toggle("on", mode === "signup");
  $("tabReset").classList.toggle("on", mode === "reset");
  $("password").autocomplete = mode === "login" ? "current-password" : "new-password";
  $("authMsg").textContent = "";
}

async function showApp(user) {
  $("auth").hidden = true; $("app").hidden = false;
  $("userEmail").textContent = user.email;
  await Exercises.init(user);
  Viz.init();
  openTab("home");
}

function openTab(name) {
  document.querySelectorAll(".tab").forEach(t => t.hidden = t.id !== "tab-" + name);
  document.querySelectorAll(".top nav button").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
  if (name === "viz") Viz.draw();
  if (name === "prog") Exercises.renderProgress();
  if (name === "polar") Polar.draw();
  if (name === "riemann") Riemann.draw();
  if (name === "graphs") Graphs.render();
  if (name === "geo") Geo.render();
}

async function submitAuth() {
  const msg = $("authMsg"); msg.className = "msg";
  const email = $("email").value.trim(), pw = $("password").value, pw2 = $("password2").value;
  try {
    if (mode !== "newpw" && !email.includes("@")) { msg.textContent = "Enter a valid email."; return; }
    if (mode === "reset") {
      await Auth.resetPassword(email);
      msg.className = "msg ok"; msg.textContent = "If this email has an account, a reset link is on its way.";
      return;
    }
    if (pw.length < 6) { msg.textContent = "Password must be at least 6 characters."; return; }
    if ((mode === "signup" || mode === "newpw") && pw !== pw2) { msg.textContent = "Passwords do not match."; return; }
    if (mode === "login") return showApp(await Auth.signIn(email, pw));
    if (mode === "signup") {
      const u = await Auth.signUp(email, pw);
      if (!u) { msg.className = "msg ok"; msg.textContent = "Account created. Check your email to confirm it, then log in."; return; }
      return showApp(u);
    }
    const u = await Auth.updatePassword(pw);
    history.replaceState(null, "", location.pathname);
    showApp(u);
  } catch (e) { msg.textContent = e.message || "Something went wrong"; }
}

(async function main() {
  $("demoNote").hidden = !Auth.demo;
  $("tabLogin").onclick = () => { mode = "login"; view(); };
  $("tabSignup").onclick = () => { mode = "signup"; view(); };
  $("tabReset").onclick = () => { mode = "reset"; view(); };
  $("authBtn").onclick = submitAuth;
  ["email", "password", "password2"].forEach(f => $(f).addEventListener("keydown", e => e.key === "Enter" && submitAuth()));
  $("logout").onclick = async () => { await Auth.signOut(); location.reload(); };
  document.querySelectorAll(".top nav button").forEach(b => b.onclick = () => openTab(b.dataset.tab));

  document.querySelectorAll("[data-go]").forEach(b => b.onclick = () => openTab(b.dataset.go));
  const h = new URLSearchParams(location.hash.slice(1));
  const recovering = h.get("type") === "recovery";
  if (recovering) mode = "newpw";
  view();
  if (h.get("error_description")) $("authMsg").textContent = h.get("error_description").replace(/\+/g, " ");
  if (!recovering) { const user = await Auth.user(); if (user) showApp(user); }
})();
