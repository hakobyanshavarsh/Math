// Extra pages: Polar coordinates, Riemann sums, Graph algorithms, Geometry.
const $$ = id => document.getElementById(id);
const fontColor = () => ({ color: matchMedia("(prefers-color-scheme: dark)").matches ? "#e8ecf7" : "#1c2333" });
const layout = (xt, yt, eq) => ({ margin: { l: 45, r: 10, t: 10, b: 40 }, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
  font: fontColor(), xaxis: { title: xt }, yaxis: Object.assign({ title: yt }, eq ? { scaleanchor: "x" } : {}), showlegend: false });
const midpoint = (fn, lo, hi, n) => { const h = (hi - lo) / n; let s = 0; for (let i = 0; i < n; i++) s += fn(lo + (i + .5) * h); return s * h; };
const show = (id, html, err) => { $$(id).innerHTML = err ? `<span style="color:var(--bad)">Error: ${html}</span>` : html; };

const Riemann = (() => {
  function draw() {
    try {
      const f = math.compile($$("rf").value), a = math.evaluate($$("ra").value), b = math.evaluate($$("rb").value);
      const n = +$$("rn").value, m = $$("rm").value;
      if (!(b > a)) throw new Error("Need a < b");
      const F = x => f.evaluate({ x }), h = (b - a) / n, xs = [], ys = []; let s = 0;
      for (let i = 0; i < n; i++) {
        const x0 = a + i * h, y = F(m === "left" ? x0 : m === "right" ? x0 + h : x0 + h / 2);
        s += y * h; xs.push(x0, x0, x0 + h, x0 + h, null); ys.push(0, y, y, 0, null);
      }
      const ex = midpoint(F, a, b, 2000), cx = Array.from({ length: 200 }, (_, i) => a + (b - a) * i / 199);
      Plotly.react("plotR", [
        { x: xs, y: ys, fill: "toself", mode: "lines", line: { color: "#4f46e5", width: 1 }, fillcolor: "rgba(79,70,229,.3)" },
        { x: cx, y: cx.map(F), mode: "lines", line: { color: "#ef4444", width: 3 } }], layout("x", "y"), { responsive: true });
      $$("rn_val").textContent = n;
      show("resR", `Riemann sum: <b>${s.toFixed(5)}</b><br>Exact ≈ <b>${ex.toFixed(5)}</b><br>Error: ${Math.abs(s - ex).toExponential(2)}`);
    } catch (e) { show("resR", e.message, 1); }
  }
  ["rf", "ra", "rb", "rm", "rn"].forEach(id => $$(id).addEventListener("input", draw));
  return { draw };
})();

const Polar = (() => {
  function draw() {
    try {
      const f = math.compile($$("pf").value), c1 = math.compile($$("pr1").value), c2 = math.compile($$("pr2").value);
      const a = math.evaluate($$("pa").value), b = math.evaluate($$("pb").value), k = +$$("pt").value;
      if (!(b > a)) throw new Error("Need θ from < θ to");
      const R1 = t => c1.evaluate({ t }), R2 = t => c2.evaluate({ t }), F = (x, y) => f.evaluate({ x, y });
      const inner = t => midpoint(r => F(r * Math.cos(t), r * Math.sin(t)) * r, R1(t), R2(t), 80);
      const total = midpoint(inner, a, b, 160), t0 = a + k * (b - a);
      const ts = Array.from({ length: 300 }, (_, i) => a + (b - a) * i / 299), rv = [...ts].reverse();
      const px = ts.map(t => R2(t) * Math.cos(t)).concat(rv.map(t => R1(t) * Math.cos(t)));
      const py = ts.map(t => R2(t) * Math.sin(t)).concat(rv.map(t => R1(t) * Math.sin(t)));
      Plotly.react("plotP", [
        { x: px, y: py, fill: "toself", mode: "lines", line: { color: "#4f46e5" }, fillcolor: "rgba(79,70,229,.25)" },
        { x: [R1(t0) * Math.cos(t0), R2(t0) * Math.cos(t0)], y: [R1(t0) * Math.sin(t0), R2(t0) * Math.sin(t0)],
          mode: "lines", line: { color: "#ef4444", width: 4 } }], layout("x", "y", 1), { responsive: true });
      show("resP", `Ray θ=${t0.toFixed(2)}: ∫ f·r dr = <b>${inner(t0).toFixed(4)}</b><br>∬ f dA = ∫∫ f·<b>r</b> dr dθ ≈ <b>${total.toFixed(4)}</b>`);
    } catch (e) { show("resP", e.message, 1); }
  }
  $$("pdraw").onclick = draw; $$("pt").addEventListener("input", draw);
  ["pf", "pa", "pb", "pr1", "pr2"].forEach(id => $$(id).addEventListener("keydown", e => e.key === "Enter" && draw()));
  return { draw };
})();

const Graphs = (() => {
  const N = { A: [70, 60], B: [230, 40], C: [410, 70], D: [130, 180], E: [300, 170], F: [80, 290], G: [400, 270] };
  const ED = ["AB", "AD", "BC", "BE", "DE", "DF", "EG", "CG", "EF"], adj = {};
  Object.keys(N).forEach(k => adj[k] = []);
  ED.forEach(e => { adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); });
  Object.values(adj).forEach(l => l.sort());
  let seq = [], i = 0, timer = null;

  function build() {
    const bfs = $$("galg").value === "bfs", s = $$("gstart").value, vis = [], seen = new Set([s]), box = [s];
    seq = [];
    while (box.length) {
      const v = bfs ? box.shift() : box.pop();
      if (vis.includes(v)) continue;
      vis.push(v);
      if (bfs) adj[v].forEach(w => { if (!seen.has(w)) { seen.add(w); box.push(w); } });
      else [...adj[v]].reverse().forEach(w => { if (!vis.includes(w)) box.push(w); });
      seq.push({ cur: v, vis: [...vis], box: [...box] });
    }
  }
  function render() {
    const st = i ? seq[i - 1] : { cur: null, vis: [], box: [$$("gstart").value] };
    const edges = ED.map(e => `<line x1="${N[e[0]][0]}" y1="${N[e[0]][1]}" x2="${N[e[1]][0]}" y2="${N[e[1]][1]}" stroke="#9aa4c7" stroke-width="2"/>`).join("");
    const nodes = Object.keys(N).map(n => {
      const fill = n === st.cur ? "#ef4444" : st.vis.includes(n) ? "#16a34a" : st.box.includes(n) ? "#f59e0b" : "#c7d2fe";
      return `<circle cx="${N[n][0]}" cy="${N[n][1]}" r="22" fill="${fill}" stroke="#4f46e5" stroke-width="2"/>
        <text x="${N[n][0]}" y="${N[n][1] + 6}" text-anchor="middle" font-weight="700" fill="#111">${n}</text>`;
    }).join("");
    $$("graphSvg").innerHTML = edges + nodes;
    show("resGr", `${$$("galg").value === "bfs" ? "Queue" : "Stack"}: [${st.box.join(", ")}]<br>Visit order: <b>${st.vis.join(" → ") || "none yet"}</b>`);
  }
  const stop = () => { clearInterval(timer); timer = null; $$("gplay").textContent = "Play"; };
  const reset = () => { stop(); build(); i = 0; render(); };
  const step = () => { if (i < seq.length) i++; else stop(); render(); };
  $$("gstep").onclick = step; $$("greset").onclick = reset;
  $$("galg").onchange = reset; $$("gstart").onchange = reset;
  $$("gplay").onclick = () => {
    if (timer) return stop();
    if (i >= seq.length) { build(); i = 0; }
    $$("gplay").textContent = "Pause"; timer = setInterval(step, 900);
  };
  build();
  return { render };
})();

const Geo = (() => {
  const P = [[80, 260], [420, 240], [230, 60]], names = ["A", "B", "C"]; let drag = -1;
  const ang = i => {
    const A = P[i], B = P[(i + 1) % 3], C = P[(i + 2) % 3], u = [B[0] - A[0], B[1] - A[1]], v = [C[0] - A[0], C[1] - A[1]];
    return Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v))) * 180 / Math.PI;
  };
  function render() {
    const a = [0, 1, 2].map(ang);
    $$("geoSvg").innerHTML = `<polygon points="${P.map(p => p.join(",")).join(" ")}" fill="rgba(79,70,229,.2)" stroke="#4f46e5" stroke-width="2"/>` +
      P.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="10" fill="#ef4444" data-i="${i}" style="cursor:grab"/>
        <text x="${p[0] + 14}" y="${p[1] - 14}" fill="currentColor" font-weight="600">${names[i]} ${a[i].toFixed(1)}°</text>`).join("");
    show("resG", `∠A + ∠B + ∠C = <b>${(a[0] + a[1] + a[2]).toFixed(1)}°</b>`);
  }
  const svg = $$("geoSvg");
  svg.addEventListener("pointerdown", e => { if (e.target.dataset.i !== undefined) drag = +e.target.dataset.i; });
  svg.addEventListener("pointermove", e => {
    if (drag < 0) return;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM().inverse());
    P[drag] = [Math.max(10, Math.min(490, q.x)), Math.max(10, Math.min(330, q.y))]; render();
  });
  window.addEventListener("pointerup", () => drag = -1);
  return { render };
})();
