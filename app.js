const $ = id => document.getElementById(id);
let signup = false;

function setMode(s) {
  signup = s;
  $("modeLogin").classList.toggle("on", !s);
  $("modeSignup").classList.toggle("on", s);
  $("authBtn").textContent = s ? "Create account" : "Log in";
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
  const email = $("email").value.trim(), pw = $("password").value, msg = $("authMsg");
  msg.className = "msg";
  if (!email || pw.length < 6) { msg.textContent = "Enter an email and a password (min. 6 characters)."; return; }
  try {
    const user = signup ? await Auth.signUp(email, pw) : await Auth.signIn(email, pw);
    if (!user) { msg.className = "msg ok"; msg.textContent = "Account created. Check your email to confirm it."; return; }
    await showApp(user);
  } catch (e) { msg.textContent = e.message || "Something went wrong"; }
}

(async function main() {
  $("demoNote").hidden = !Auth.demo;
  $("modeLogin").onclick = () => setMode(false);
  $("modeSignup").onclick = () => setMode(true);
  $("authBtn").onclick = submitAuth;
  $("password").addEventListener("keydown", e => e.key === "Enter" && submitAuth());
  $("logout").onclick = async () => { await Auth.signOut(); location.reload(); };
  document.querySelectorAll(".top nav button").forEach(b => b.onclick = () => openTab(b.dataset.tab));
  const user = await Auth.user();
  if (user) showApp(user);
})();
