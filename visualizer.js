// Double-integral visualizer: surface, region, sliding slice, numeric value.
const Viz = (() => {
  const $ = id => document.getElementById(id);
  const lin = (a, b, n) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));
  let lastKey = "", total = 0;

  function draw() {
    const out = $("result");
    try {
      const f = math.compile($("f").value), c1 = math.compile($("g1").value), c2 = math.compile($("g2").value);
      const a = math.evaluate($("a").value), b = math.evaluate($("b").value);
      if (!(b > a)) throw new Error("x limits must satisfy a < b");
      const F = (x, y) => f.evaluate({ x, y }), G1 = x => c1.evaluate({ x }), G2 = x => c2.evaluate({ x });
      const order = $("order").value, t = +$("t").value;

      const xs = lin(a, b, 150); let ymin = Infinity, ymax = -Infinity;
      xs.forEach(x => { ymin = Math.min(ymin, G1(x)); ymax = Math.max(ymax, G2(x)); });
      if (!isFinite(ymin) || !isFinite(ymax)) throw new Error("g1 or g2 is not a valid function of x");
      if (ymin >= ymax) throw new Error("The region is empty (g1 >= g2)");

      const inside = (x, y) => y >= G1(x) - 1e-9 && y <= G2(x) + 1e-9;
      const xInterval = y0 => {
        let lo = null, hi = null;
        lin(a, b, 300).forEach(x => { if (inside(x, y0)) { if (lo === null) lo = x; hi = x; } });
        return lo === null ? null : [lo, hi];
      };
      const integ = (fn, lo, hi, n = 100) => { const h = (hi - lo) / n; let s = 0; for (let i = 0; i < n; i++) s += fn(lo + (i + .5) * h); return s * h; };
      const innerY = x => integ(y => F(x, y), G1(x), G2(x));
      const innerX = y => { const iv = xInterval(y); return iv ? integ(x => F(x, y), iv[0], iv[1]) : 0; };

      const key = [$("f").value, $("g1").value, $("g2").value, a, b, order].join("|");
      if (key !== lastKey) {
        total = order === "dydx" ? integ(innerY, a, b, 120) : integ(innerX, ymin, ymax, 120);
        lastKey = key;
      }

      let sliceTxt, line3, line2;
      if (order === "dydx") {
        const x0 = a + t * (b - a), ys = lin(G1(x0), G2(x0), 60), A = innerY(x0);
        line3 = { x: ys.map(() => x0), y: ys, z: ys.map(y => F(x0, y)) };
        line2 = { x: [x0, x0], y: [G1(x0), G2(x0)] };
        sliceTxt = `A(x=${x0.toFixed(2)}) = ∫ f dy = <b>${A.toFixed(4)}</b>`;
      } else {
        const y0 = ymin + t * (ymax - ymin), iv = xInterval(y0) || [a, a], B = innerX(y0), xx = lin(iv[0], iv[1], 60);
        line3 = { x: xx, y: xx.map(() => y0), z: xx.map(x => F(x, y0)) };
        line2 = { x: iv, y: [y0, y0] };
        sliceTxt = `B(y=${y0.toFixed(2)}) = ∫ f dx = <b>${B.toFixed(4)}</b>`;
      }

      const X = lin(a, b, 50), Y = lin(ymin, ymax, 50);
      const Z = Y.map(y => X.map(x => inside(x, y) ? F(x, y) : null));
      const dark = matchMedia("(prefers-color-scheme: dark)").matches;
      const font = { color: dark ? "#e8ecf7" : "#1c2333" };
      Plotly.react("plot3d", [
        { type: "surface", x: X, y: Y, z: Z, colorscale: "Viridis", opacity: .9, showscale: false },
        { type: "scatter3d", mode: "lines", ...line3, line: { color: "#ef4444", width: 8 }, name: "slice" }
      ], { margin: { l: 0, r: 0, t: 0, b: 0 }, paper_bgcolor: "rgba(0,0,0,0)", font,
           scene: { xaxis: { title: "x" }, yaxis: { title: "y" }, zaxis: { title: "z" } }, showlegend: false }, { responsive: true });

      const bx = xs.concat([...xs].reverse()), by = xs.map(G2).concat([...xs].reverse().map(G1));
      Plotly.react("plot2d", [
        { x: bx, y: by, fill: "toself", mode: "lines", line: { color: "#4f46e5" }, fillcolor: "rgba(79,70,229,.25)", name: "D" },
        { ...line2, mode: "lines", line: { color: "#ef4444", width: 4 }, name: "slice" }
      ], { margin: { l: 40, r: 10, t: 10, b: 40 }, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font,
           xaxis: { title: "x" }, yaxis: { title: "y" }, showlegend: false }, { responsive: true });

      out.innerHTML = `${sliceTxt}<br>∬ f dA ≈ <b>${total.toFixed(4)}</b>`;
    } catch (e) {
      out.innerHTML = `<span style="color:var(--bad)">Error: ${e.message}</span>`;
    }
  }

  function init() {
    $("draw").onclick = draw;
    $("t").oninput = draw;
    $("order").onchange = draw;
    ["f", "a", "b", "g1", "g2"].forEach(id => $(id).addEventListener("keydown", e => e.key === "Enter" && draw()));
  }
  return { init, draw };
})();
