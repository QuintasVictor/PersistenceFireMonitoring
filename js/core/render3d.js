/* render3d.js — vista 3D (fitness landscape) em canvas 2D, sem dependências.
 *
 * Réplica leve da superfície 3D do ImageLab (cg100_anim_engine modo '3d',
 * cg100_figs_3d): o campo da camada vira altura Z, colorido pela mesma colormap,
 * com a rota e as bases projetadas sobre a superfície. Camera ortografica usa
 * o padrao centralizado em style3d.js: view(45, 30). Algoritmo do pintor (sem WebGL).
 */
window.PPP = window.PPP || {};
(function (P) {

  function makeCam(azDeg, elDeg) {
    var a = azDeg * Math.PI / 180, e = elDeg * Math.PI / 180;
    var ca = Math.cos(a), sa = Math.sin(a), ce = Math.cos(e), se = Math.sin(e);
    return function (x, y, z) {
      var rx = x * ca + y * sa;        // azimute em torno de Z
      var ry = -x * sa + y * ca;
      return [rx, ry * se - z * ce, ry * ce + z * se]; // [sx, sy, profundidade]
    };
  }

  var R3 = {};

  R3.draw = function (ctx, model, L, cw, ch, cmaps, clim, opts) {
    opts = opts || {};
    var S = P.style3d || { az: 45, el: 30, height: 0.42, smooth: 2, step: 2, pad: 0.07, radius: 14 };
    var az = opts.az != null ? opts.az : S.az;            // regra de imagem 3D (style3d.js)
    var el = opts.el != null ? opts.el : S.el;
    var step = opts.step || S.step;
    var hScale = opts.height || S.height;
    var cam = makeCam(az, el);
    var mask = model.mask, W = model.W, H = model.H;
    // recorte de cantos arredondados (acabamento padrão das imagens 3D)
    ctx.clearRect(0, 0, cw, ch); ctx.save();
    if (S.roundedClip) S.roundedClip(ctx, cw, ch, opts.radius != null ? opts.radius : S.radius);
    // suaviza o campo para a superfície (visual de "fitness landscape" do ImageLab,
    // como fit3/converge) — os campos reais têm textura fina que vira espigões.
    var f = smoothField(model.field(L), mask, W, H, opts.smooth != null ? opts.smooth : S.smooth);
    var lo = clim[0], hi = clim[1], span = (hi - lo) || 1;
    var cm = cmaps[L] || cmaps.r;
    var sqrtC = (L === 'v');
    var light = norm3([-0.4, -0.6, 0.7]);

    // ---- coleta quads sobre Omega ----
    var quads = [];
    function gxy(x, y) { return [(x / (W - 1)) - 0.5, (y / (H - 1)) - 0.5]; }
    function zAt(i) { return ((f[i] - lo) / span) * hScale; }
    for (var y = 0; y + step < H; y += step) {
      for (var x = 0; x + step < W; x += step) {
        var i00 = y * W + x, i10 = y * W + (x + step), i11 = (y + step) * W + (x + step), i01 = (y + step) * W + x;
        if (!(mask[i00] && mask[i10] && mask[i11] && mask[i01])) continue;
        var g00 = gxy(x, y), g10 = gxy(x + step, y), g11 = gxy(x + step, y + step), g01 = gxy(x, y + step);
        var d = [
          [g00[0], g00[1], zAt(i00)], [g10[0], g10[1], zAt(i10)],
          [g11[0], g11[1], zAt(i11)], [g01[0], g01[1], zAt(i01)]
        ];
        var pr = [cam(d[0][0], d[0][1], d[0][2]), cam(d[1][0], d[1][1], d[1][2]),
          cam(d[2][0], d[2][1], d[2][2]), cam(d[3][0], d[3][1], d[3][2])];
        var avg = (f[i00] + f[i10] + f[i11] + f[i01]) / 4;
        var t = (avg - lo) / span; if (sqrtC) t = Math.sqrt(Math.max(0, t));
        // sombreamento difuso pela normal (relevo)
        var nrm = quadNormal(d);
        var sh = 0.62 + 0.38 * Math.max(0, dot3(nrm, light));
        quads.push({ pr: pr, t: t, sh: sh, depth: (pr[0][2] + pr[1][2] + pr[2][2] + pr[3][2]) / 4 });
      }
    }
    if (!quads.length) { ctx.restore(); return; }

    // ---- escala para o canvas ----
    var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
    quads.forEach(function (q) {
      q.pr.forEach(function (p) {
        if (p[0] < minx) minx = p[0]; if (p[0] > maxx) maxx = p[0];
        if (p[1] < miny) miny = p[1]; if (p[1] > maxy) maxy = p[1];
      });
    });
    var pad = (S.pad || 0.07) * Math.min(cw, ch);
    var sc = Math.min((cw - 2 * pad) / ((maxx - minx) || 1), (ch - 2 * pad) / ((maxy - miny) || 1));
    var offx = (cw - (maxx - minx) * sc) / 2 - minx * sc;
    var offy = (ch - (maxy - miny) * sc) / 2 - miny * sc;
    function toS(p) { return [p[0] * sc + offx, p[1] * sc + offy]; }

    // ---- pintor: longe primeiro ----
    quads.sort(function (a, b) { return b.depth - a.depth; });
    ctx.clearRect(0, 0, cw, ch);
    quads.forEach(function (q) {
      var c = cm(q.t);
      var p0 = toS(q.pr[0]), p1 = toS(q.pr[1]), p2 = toS(q.pr[2]), p3 = toS(q.pr[3]);
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]);
      ctx.closePath();
      ctx.fillStyle = 'rgb(' + (c[0] * q.sh | 0) + ',' + (c[1] * q.sh | 0) + ',' + (c[2] * q.sh | 0) + ')';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 0.4; ctx.stroke();
    });

    // ---- rota + bases projetadas na superfície ----
    function nodeP(ci, ri) {
      var col = Math.min(W - 1, Math.max(0, Math.round(ci - 1)));
      var row = Math.min(H - 1, Math.max(0, Math.round(ri - 1)));
      var i = row * W + col;
      var z = isFinite(f[i]) ? ((f[i] - lo) / span) * hScale : 0;
      var g = gxy(col, row);
      return toS(cam(g[0], g[1], z + 0.02));
    }
    var mis = model.metricsAt(model.m);
    if (mis && mis.route && mis.route.length > 1) {
      var pts = mis.route.map(function (q) { return nodeP(q[0], q[1]); });
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 3.4; strokePath(ctx, pts);
      ctx.strokeStyle = '#1af2ff'; ctx.lineWidth = 1.8; strokePath(ctx, pts);
    }
    (model.d.bases || []).forEach(function (b) {
      var s = nodeP(b.ci, b.ri);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.3;
      ctx.fillRect(s[0] - 4, s[1] - 4, 8, 8); ctx.strokeRect(s[0] - 4, s[1] - 4, 8, 8);
    });
    ctx.restore();                                  // encerra o recorte arredondado
  };

  /* box blur 3x3 ciente da máscara (mantém os valores fora de Omega intactos) */
  function smoothField(f, mask, W, H, passes) {
    if (!passes) return f;
    var cur = Float64Array.from(f);
    for (var p = 0; p < passes; p++) {
      var nxt = Float64Array.from(cur);
      for (var y = 0; y < H; y++) {
        for (var x = 0; x < W; x++) {
          var i = y * W + x; if (!mask[i]) continue;
          var sum = 0, cnt = 0;
          for (var dy = -1; dy <= 1; dy++) {
            var yy = y + dy; if (yy < 0 || yy >= H) continue;
            for (var dx = -1; dx <= 1; dx++) {
              var xx = x + dx; if (xx < 0 || xx >= W) continue;
              var j = yy * W + xx; if (!mask[j]) continue;
              sum += cur[j]; cnt++;
            }
          }
          nxt[i] = sum / cnt;
        }
      }
      cur = nxt;
    }
    return cur;
  }

  function strokePath(ctx, pts) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }
  function quadNormal(d) {
    var ux = d[1][0] - d[0][0], uy = d[1][1] - d[0][1], uz = d[1][2] - d[0][2];
    var vx = d[3][0] - d[0][0], vy = d[3][1] - d[0][1], vz = d[3][2] - d[0][2];
    return norm3([uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]);
  }
  function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function norm3(v) {
    var m = Math.hypot(v[0], v[1], v[2]) || 1;
    var s = v[2] < 0 ? -1 / m : 1 / m;            // normal apontando p/ cima
    return [v[0] * s, v[1] * s, v[2] * s];
  }

  P.render3d = R3;
})(window.PPP);
