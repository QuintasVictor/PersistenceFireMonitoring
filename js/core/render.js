/* render.js — primitivas de renderização (mapas, rota, bases, gráficos)
 *
 * Desenha campos do modelo em <canvas> usando as colormaps do ImageLab e o
 * sistema de coordenadas intrínsecas exportado (ci=coluna, ri=linha do raster).
 * Conversão p/ pixel de canvas:  px = (ci-0.5)/W·cw ,  py = (ri-0.5)/H·ch
 * (linha 1 = topo, igual ao YDir 'reverse' do ilab_style + putImageData).
 */
window.PPP = window.PPP || {};
(function (P) {
  function offscreen(W, H) {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(W, H);
    var c = document.createElement('canvas'); c.width = W; c.height = H; return c;
  }

  var R = {};

  /* box blur 3x3 ciente da máscara */
  function boxBlur(f, mask, W, H, passes) {
    if (!passes) return f;
    var cur = Float64Array.from(f);
    for (var p = 0; p < passes; p++) {
      var nxt = Float64Array.from(cur);
      for (var y = 0; y < H; y++) {
        for (var x = 0; x < W; x++) {
          var i = y * W + x; if (!mask[i]) continue;
          var s = 0, n = 0;
          for (var dy = -1; dy <= 1; dy++) {
            var yy = y + dy; if (yy < 0 || yy >= H) continue;
            for (var dx = -1; dx <= 1; dx++) {
              var xx = x + dx; if (xx < 0 || xx >= W) continue;
              var j = yy * W + xx; if (!mask[j]) continue;
              s += cur[j]; n++;
            }
          }
          nxt[i] = s / n;
        }
      }
      cur = nxt;
    }
    return cur;
  }
  R.boxBlur = boxBlur;

  /* ----- campo (raster) ----- */
  R.drawField = function (ctx, model, L, cw, ch, cmaps, clim) {
    var f = model.field(L), mask = model.mask, W = model.W, H = model.H, N = W * H;
    var lo = clim[0], hi = clim[1]; var span = (hi - lo) || 1;
    var sqrtScale = (L === 'v');                       // contagem: realça baixos
    var img = ctx.createImageData(W, H), dd = img.data, cm = cmaps[L] || cmaps.r;
    for (var i = 0; i < N; i++) {
      var o = i * 4;
      if (!mask[i]) { dd[o + 3] = 0; continue; }
      var t = (f[i] - lo) / span;
      if (sqrtScale) t = Math.sqrt(Math.max(0, t));
      var c = cm(t);
      dd[o] = c[0]; dd[o + 1] = c[1]; dd[o + 2] = c[2]; dd[o + 3] = 255;
    }
    var off = offscreen(W, H);
    off.getContext('2d').putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(off, 0, 0, cw, ch);
  };

  /* ----- linhas de relevo (contornos, estilo ImageLab) -----
   * Marching squares sobre a grade. Espelha ilab_style: 8 níveis, preto, fino.
   */
  R.drawContour = function (ctx, model, L, cw, ch, opts) {
    opts = opts || {};
    var levels = opts.levels || 8;
    var color = opts.color || 'rgba(0,0,0,0.40)';
    var width = opts.width || 0.7;
    var mask = model.mask, W = model.W, H = model.H;
    // suaviza para iso-linhas limpas (o campo bruto tem textura fina)
    var f = boxBlur(model.field(L), mask, W, H, opts.smooth != null ? opts.smooth : 2);
    var mn = Infinity, mx = -Infinity;
    for (var k = 0; k < model.validList.length; k++) {
      var vv = f[model.validList[k]]; if (vv < mn) mn = vv; if (vv > mx) mx = vv;
    }
    if (!(mx > mn)) return;
    // mapeia coordenada de grade fracionária -> centro de pixel no canvas
    function cx(p) { return (p + 0.5) / W * cw; }
    function cy(p) { return (p + 0.5) / H * ch; }
    // tabela de segmentos por caso (bits: tl=8,tr=4,br=2,bl=1; arestas 0=topo,1=dir,2=baixo,3=esq)
    var SEG = { 1: [[3, 2]], 2: [[2, 1]], 3: [[3, 1]], 4: [[0, 1]], 5: [[3, 0], [2, 1]],
      6: [[0, 2]], 7: [[3, 0]], 8: [[3, 0]], 9: [[0, 2]], 10: [[0, 1], [3, 2]],
      11: [[0, 1]], 12: [[3, 1]], 13: [[2, 1]], 14: [[3, 2]] };
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (var lv = 1; lv <= levels; lv++) {
      var iso = mn + (mx - mn) * lv / (levels + 1);
      for (var y = 0; y < H - 1; y++) {
        for (var x = 0; x < W - 1; x++) {
          var i00 = y * W + x, i10 = i00 + 1, i01 = i00 + W, i11 = i01 + 1;
          if (!(mask[i00] && mask[i10] && mask[i01] && mask[i11])) continue;
          var a = f[i00], b = f[i10], c = f[i11], d = f[i01];
          var idx = 0;
          if (a > iso) idx |= 8; if (b > iso) idx |= 4; if (c > iso) idx |= 2; if (d > iso) idx |= 1;
          var segs = SEG[idx]; if (!segs) continue;
          for (var s = 0; s < segs.length; s++) {
            var p0 = edgePt(segs[s][0]), p1 = edgePt(segs[s][1]);
            ctx.moveTo(cx(p0[0]), cy(p0[1])); ctx.lineTo(cx(p1[0]), cy(p1[1]));
          }
          // ponto na aresta e (0 topo,1 dir,2 baixo,3 esq)
          function edgePt(e) {
            if (e === 0) return [x + (iso - a) / (b - a), y];
            if (e === 1) return [x + 1, y + (iso - b) / (c - b)];
            if (e === 2) return [x + (iso - d) / (c - d), y + 1];
            return [x, y + (iso - a) / (d - a)];
          }
        }
      }
    }
    ctx.stroke(); ctx.restore();
  };

  /* ----- legenda/colorbar ----- */
  R.styleLegend = function (els, rampFn, clim, label, code) {
    var direction = els.bar && els.bar.dataset && els.bar.dataset.direction ? els.bar.dataset.direction : '90deg';
    els.bar.style.background = P.colormaps.cssGradient(rampFn, 12, direction);
    var lo = clim[0], hi = clim[1];
    var fmtV = (code === 'r' || code === 'd' || code === 'p' || code === 'h') ? P.fmtSci : function (x) { return P.fmt(x, code === 'v' ? 0 : 2); };
    els.lo.textContent = fmtV(lo);
    els.hi.textContent = fmtV(hi);
    if (els.label) els.label.textContent = label;
  };

  /* ----- rota + bases (overlay) ----- */
  R.drawRoute = function (octx, ovl, model, mission, prog, uav) {
    var W = model.W, H = model.H, cw = ovl.width, ch = ovl.height;
    var SX = cw / W, SY = ch / H;
    octx.clearRect(0, 0, cw, ch);

    /* bases (todas) */
    var bases = model.d.bases || [];
    for (var b = 0; b < bases.length; b++) {
      var bx = (bases[b].ci - 0.5) / W * cw, by = (bases[b].ri - 0.5) / H * ch;
      octx.fillStyle = '#fff'; octx.strokeStyle = '#000'; octx.lineWidth = 1.5;
      octx.fillRect(bx - 5, by - 5, 10, 10); octx.strokeRect(bx - 5, by - 5, 10, 10);
    }
    if (!mission || !mission.route || mission.route.length < 2) return;

    var pts = mission.route.map(function (q) {
      return [(q[0] - 0.5) / W * cw, (q[1] - 0.5) / H * ch];
    });

    /* rota fantasma (completa) */
    octx.lineWidth = 1.2; octx.strokeStyle = 'rgba(26,242,255,.25)';
    octx.beginPath(); octx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) octx.lineTo(pts[i][0], pts[i][1]);
    octx.stroke();

    /* segmento percorrido */
    var total = pts.length - 1, seg = Math.min(total, prog * total), full = seg | 0, fr = seg - full;
    octx.lineWidth = 2.4; octx.strokeStyle = 'rgba(26,242,255,.95)';
    octx.shadowColor = 'rgba(26,242,255,.8)'; octx.shadowBlur = 6;
    octx.beginPath(); octx.moveTo(pts[0][0], pts[0][1]);
    for (var k = 1; k <= full; k++) octx.lineTo(pts[k][0], pts[k][1]);
    if (full < total) {
      var A = pts[full], Bp = pts[full + 1];
      octx.lineTo(A[0] + (Bp[0] - A[0]) * fr, A[1] + (Bp[1] - A[1]) * fr);
    }
    octx.stroke(); octx.shadowBlur = 0;

    /* nós */
    octx.fillStyle = 'rgba(26,242,255,.9)';
    for (var j = 1; j < pts.length - 1; j++) {
      octx.beginPath(); octx.arc(pts[j][0], pts[j][1], 2.4, 0, 7); octx.fill();
    }

    /* UAV */
    if (uav) {
      octx.fillStyle = '#ff7a45'; octx.shadowColor = '#ff7a45'; octx.shadowBlur = 10;
      octx.beginPath(); octx.arc(uav[0], uav[1], 5, 0, 7); octx.fill(); octx.shadowBlur = 0;
      octx.strokeStyle = 'rgba(255,177,105,.8)'; octx.lineWidth = 1;
      octx.beginPath(); octx.arc(uav[0], uav[1], 9, 0, 7); octx.stroke();
    }
  };

  /* ----- gráfico de linhas genérico ----- */
  R.lineChart = function (canvas, series, opts) {
    var ctx = canvas.getContext('2d'); var cw = canvas.width, ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);
    var L = 46, Rm = 10, T = 12, B = 26, pw = cw - L - Rm, ph = ch - T - B;
    var yMax = opts.yMax, yMin = opts.yMin || 0, xMax = opts.xMax;
    ctx.strokeStyle = '#28323d'; ctx.fillStyle = '#5c6873';
    ctx.font = '10px JetBrains Mono,monospace'; ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var y = T + ph * g / 4; ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(L + pw, y); ctx.stroke();
      var val = yMax - (yMax - yMin) * g / 4;
      ctx.fillText(opts.yfmt ? opts.yfmt(val) : val.toFixed(2), 4, y + 3);
    }
    [0, 25, 50, 75, 100].forEach(function (gx) {
      var x = L + pw * gx / xMax; ctx.fillText(gx, x - 6, ch - 8);
    });
    if (opts.xlabel) ctx.fillText(opts.xlabel, L + pw / 2 - 16, ch - 8);

    series.forEach(function (s) {
      if (!s.data.length) return;
      ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.setLineDash(s.dash || []);
      ctx.beginPath();
      s.data.forEach(function (pt, i) {
        var x = L + pw * pt[0] / xMax;
        var ny = (pt[1] - yMin) / (yMax - yMin);
        var y = T + ph * (1 - Math.min(1, Math.max(0, ny)));
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.stroke(); ctx.setLineDash([]);
      /* marcador no último ponto */
      if (s.marker) {
        var lp = s.data[s.data.length - 1];
        var mx = L + pw * lp[0] / xMax;
        var my = T + ph * (1 - Math.min(1, Math.max(0, (lp[1] - yMin) / (yMax - yMin))));
        ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(mx, my, 3.2, 0, 7); ctx.fill();
      }
    });
  };

  P.render = R;
})(window.PPP);
