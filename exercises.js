// Exercises with automatic checking. num: numeric answer (±0.01), mc: multiple choice.
const EXERCISES = [
  { id: "ex1", type: "num", q: "Compute ∬(x + y) dA over D = [0,1] × [0,2].", answer: 3,
    hint: "It is a rectangle, so the limits are plain numbers. Integrate with respect to y first.", explain: "∫₀¹ (2x + 2) dx = 1 + 2 = 3." },
  { id: "ex2", type: "num", q: "Compute ∬ x·y dA over D = [0,2] × [0,3].", answer: 9,
    hint: "The integrand separates into a product: (∫x dx)(∫y dy).", explain: "2 · 4.5 = 9." },
  { id: "ex3", type: "num", q: "Compute ∫₀¹ ∫₀ˣ y dy dx (decimal, 3 digits).", answer: 1 / 6,
    hint: "The inner integral gives x²/2.", explain: "∫₀¹ x²/2 dx = 1/6 ≈ 0.167." },
  { id: "ex4", type: "num", q: "Compute ∬ x dA where D is bounded by y = x² and y = x (decimal).", answer: 1 / 12,
    hint: "x runs from 0 to 1, y from x² to x. Check it in the Visualizer.", explain: "∫₀¹ x(x − x²) dx = 1/3 − 1/4 = 1/12 ≈ 0.083." },
  { id: "ex5", type: "mc", q: "D = {0 ≤ y ≤ x ≤ 1}. What are the limits in the order dx dy?",
    options: ["y ∈ [0,1], x ∈ [y,1]", "y ∈ [0,1], x ∈ [0,y]", "y ∈ [0,x], x ∈ [0,1]", "y ∈ [0,1], x ∈ [0,1]"], answer: 0,
    hint: "Sketch the triangle and see where a line y = const enters and leaves it.", explain: "A line y = const enters at x = y and leaves at x = 1." }
];

const Exercises = (() => {
  const $ = id => document.getElementById(id);
  let user = null, state = {};

  function render() {
    $("exList").innerHTML = EXERCISES.map((e, i) => {
      const done = state[e.id] && state[e.id].correct;
      const input = e.type === "num"
        ? `<input id="in-${e.id}" placeholder="Your answer" inputmode="decimal">`
        : e.options.map((o, k) => `<label class="opt"><input type="radio" name="in-${e.id}" value="${k}">${o}</label>`).join("");
      return `<div class="ex ${done ? "done" : ""}" id="box-${e.id}">
        <b>${i + 1}.</b> ${e.q}
        <div class="${e.type === "num" ? "ans" : ""}">${input}
          ${e.type === "num" ? `<button class="primary" style="width:auto" data-check="${e.id}">Check</button>` : ""}</div>
        ${e.type === "mc" ? `<button class="primary" style="width:auto" data-check="${e.id}">Check</button>` : ""}
        <p class="fb ${done ? "ok" : ""}" id="fb-${e.id}">${done ? "✓ Correct" : ""}</p></div>`;
    }).join("");
    document.querySelectorAll("[data-check]").forEach(b => b.onclick = () => check(b.dataset.check));
  }

  async function check(id) {
    const e = EXERCISES.find(x => x.id === id), fb = $("fb-" + id);
    let ok;
    if (e.type === "num") {
      const v = parseFloat(($("in-" + id).value || "").replace(",", "."));
      if (isNaN(v)) { fb.className = "fb bad"; fb.textContent = "Enter a number."; return; }
      ok = Math.abs(v - e.answer) <= 0.01;
    } else {
      const r = document.querySelector(`input[name="in-${id}"]:checked`);
      if (!r) { fb.className = "fb bad"; fb.textContent = "Choose an option."; return; }
      ok = +r.value === e.answer;
    }
    fb.className = "fb " + (ok ? "ok" : "bad");
    fb.innerHTML = ok ? `✓ Correct. ${e.explain}` : `✗ Not quite. Hint: ${e.hint}`;
    if (ok) $("box-" + id).classList.add("done");
    await Auth.saveProgress(user, id, ok);
    const cur = state[id] || { correct: false, attempts: 0 };
    state[id] = { correct: cur.correct || ok, attempts: cur.attempts + 1 };
  }

  async function renderProgress() {
    const rows = await Auth.loadProgress(user);
    state = {}; rows.forEach(r => state[r.exercise_id] = r);
    const done = EXERCISES.filter(e => state[e.id] && state[e.id].correct).length;
    $("progBar").firstElementChild.style.width = (100 * done / EXERCISES.length) + "%";
    $("progText").textContent = `Solved ${done} of ${EXERCISES.length}`;
    $("progList").innerHTML = EXERCISES.map((e, i) => {
      const s = state[e.id];
      return `<div class="prow"><span>${i + 1}. ${e.q.slice(0, 60)}…</span>
        <span>${s ? (s.correct ? "✓" : "…") + " (" + s.attempts + (s.attempts === 1 ? " try)" : " tries)") : "—"}</span></div>`;
    }).join("");
  }

  async function init(u) { user = u; await renderProgress(); render(); }
  return { init, renderProgress };
})();
