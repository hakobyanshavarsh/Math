const $ = id => document.getElementById(id);
const FIELDS = ["email", "password", "code", "newPassword"];
let mode = "code";   // "code" = email code, "pw" = password login
let step = "email";  // "email" -> "code" -> "setpw"
let pendingEmail = "", pendingUser = null;

function view() {
  const show = { email: false, password: false, code: false, newPassword: false };
  let btn = "Send code", hint = "";
  if (step === "email") {
    show.email = true;
    if (mode === "pw") { show.password = true; btn = "Log in"; }
    else hint = "No password needed. We email you a code. New here? An account is created automatically.";
  } else if (step === "code") {
    show.code = true; btn = "Verify code"; hint = `We sent a code to ${pendingEmail}.`;
  } else {
    show.newPassword = true; btn = "Save password"; hint = "Create a password so you can log in faster next time.";
  }
  FIELDS.forEach(f => $(f).hidden = !show[f]);
  $("authBtn").textContent = btn;
  $("authHint").textContent = hint;
  $("seg").hidden = step !== "email";
  $("backBtn").hidden = step !== "code";
  $("skipBtn").hidden = step !== "setpw";
  $("modeCode").classList.toggle("on", mode === "code");
  $("modePw").classList.toggle("on", mode === "pw");
  $("authMsg").textContent = "";
}

async function showApp(user) {
  $("auth").hidden = true; $("app").hidden = false;
  $("userEmail").textContent = user.email;
  await Exercises.init(user);
  Viz.init();
}

function openTab(name) {
  document.querySelectorAll(".tab").forEach(t => t.hidden = t.id !== "tab-" + name);
  document.querySelectorAll(".top nav button").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
  if (name === "viz") Viz.draw();
  if (name === "prog") Exercises.renderProgress();
}

async function submitAuth() {
  const msg = $("authMsg"); msg.className = "msg";
  try {
    if (step === "email") {
      const email = $("email").value.trim();
      if (!email.includes("@")) { msg.textContent = "Enter a valid email."; return; }
      if (mode === "pw") {
        const pw = $("password").value;
        if (pw.length < 6) { msg.textContent = "Enter your password (min. 6 characters)."; return; }
        return showApp(await Auth.signIn(email, pw));
      }
      await Auth.sendCode(email);
      pendingEmail = email; step = "code"; view();
      $("authMsg").className = "msg ok";
      $("authMsg").textContent = Auth.demo ? "Demo mode: use code 123456." : "Code sent. Check your inbox (and spam).";
    } else if (step === "code") {
      const code = $("code").value.trim();
      if (!code) { msg.textContent = "Enter the code from your email."; return; }
      const user = await Auth.verifyCode(pendingEmail, code);
      if (Auth.hasPassword(user)) return showApp(user);
      pendingUser = user; step = "setpw"; view();
    } else {
      const pw = $("newPassword").value;
      if (pw.length < 6) { msg.textContent = "Password must be at least 6 characters."; return; }
      showApp(await Auth.setPassword(pw));
    }
  } catch (e) { msg.textContent = e.message || "Something went wrong"; }
}

(async function main() {
  $("demoNote").hidden = !Auth.demo;
  $("modeCode").onclick = () => { mode = "code"; view(); };
  $("modePw").onclick = () => { mode = "pw"; view(); };
  $("authBtn").onclick = submitAuth;
  $("backBtn").onclick = () => { step = "email"; view(); };
  $("skipBtn").onclick = () => showApp(pendingUser);
  FIELDS.forEach(f => $(f).addEventListener("keydown", e => e.key === "Enter" && submitAuth()));
  $("logout").onclick = async () => { await Auth.signOut(); location.reload(); };
  document.querySelectorAll(".top nav button").forEach(b => b.onclick = () => openTab(b.dataset.tab));
  view();
  const user = await Auth.user();
  if (user) showApp(user);
})();
