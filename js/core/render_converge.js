/* render_converge.js - vista "Conversao" da campanha
 *
 * Renderiza a conversao com dados reais ja presentes no CampaignModel.
 * A vista panoramica mostra ate 3 superficies simultaneas em paineis.
 * A vista Sobreposicao sobrepoe as superficies selecionadas sobre o
 * piso PNB em z=0. Nenhum mapa novo e inventado aqui: todos os campos vem de
 * `w`, `p_m`, `d_m`, `r_m` e `v_m` oficiais/reconstruidos por regras do modelo.
 */
window.PPP = window.PPP || {};
(function (P) {
  var S = P.style3d || {
    az: 45, el: 30, profile: { az: -89.5, el: 6 },
    height: 0.42, smooth: 2, step: 2, pad: 0.07, radius: 14
  };

  var FIELD_META = {
    w: { label: 'Alvo w_i', short: 'w_i', color: [87, 174, 255], alpha: 0.38, cmap: 'h' },
    r: { label: 'Recompensa r_m', short: 'r_m', color: [255, 0, 0], alpha: 0.42, cmap: 'r' },
    d: { label: 'Deficit d_m', short: 'd_m', color: [15, 135, 102], alpha: 0.42, cmap: 'd' },
    v: { label: 'Vistorias v_m', short: 'v_m', color: [176, 78, 255], alpha: 0.36, cmap: 'v' },
    p: { label: 'Distribuicao p_m', short: 'p_m', color: [251, 231, 37], alpha: 0.44, cmap: 'p' }
  };

  function makeCam(azDeg, elDeg) {
    var a = azDeg * Math.PI / 180, e = elDeg * Math.PI / 180;
    var ca = Math.cos(a), sa = Math.sin(a), ce = Math.cos(e), se = Math.sin(e);
    return function (x, y, z) {
      var rx = x * ca + y * sa;
      var ry = -x * sa + y * ca;
      return [rx, ry * se - z * ce, ry * ce + z * se];
    };
  }

  function norm3(v) {
    var m = Math.hypot(v[0], v[1], v[2]) || 1;
    var s = v[2] < 0 ? -1 / m : 1 / m;
    return [v[0] * s, v[1] * s, v[2] * s];
  }
  function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function quadNormal(d) {
    var ux = d[1][0] - d[0][0], uy = d[1][1] - d[0][1], uz = d[1][2] - d[0][2];
    var vx = d[3][0] - d[0][0], vy = d[3][1] - d[0][1], vz = d[3][2] - d[0][2];
    return norm3([uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]);
  }
  function rgbToRgba(rgb, alpha) {
    return 'rgba(' + (rgb[0] | 0) + ',' + (rgb[1] | 0) + ',' + (rgb[2] | 0) + ',' + alpha + ')';
  }
  function shadeRgb(rgb, sh, alpha) {
    return rgbToRgba([
      Math.max(0, Math.min(255, rgb[0] * sh)),
      Math.max(0, Math.min(255, rgb[1] * sh)),
      Math.max(0, Math.min(255, rgb[2] * sh))
    ], alpha == null ? 1 : alpha);
  }
  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function smoothField(f, mask, W, H, passes) {
    if (!passes) return f;
    var cur = Float64Array.from(f);
    for (var p = 0; p < passes; p++) {
      var nxt = Float64Array.from(cur);
      for (var y = 0; y < H; y++) {
        for (var x = 0; x < W; x++) {
          var i = y * W + x;
          if (!mask[i]) continue;
          var sum = 0, cnt = 0;
          for (var dy = -1; dy <= 1; dy++) {
            var yy = y + dy;
            if (yy < 0 || yy >= H) continue;
            for (var dx = -1; dx <= 1; dx++) {
              var xx = x + dx;
              if (xx < 0 || xx >= W) continue;
              var j = yy * W + xx;
              if (!mask[j]) continue;
              sum += cur[j];
              cnt++;
            }
          }
          nxt[i] = cnt ? sum / cnt : cur[i];
        }
      }
      cur = nxt;
    }
    return cur;
  }

  function fieldRange(field, validList) {
    var lo = Infinity, hi = -Infinity;
    for (var i = 0; i < validList.length; i++) {
      var v = field[validList[i]];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    if (!(hi > lo)) return [0, 1];
    return [lo, hi];
  }
  function fieldData(model, key) {
    return key === 'w' ? model.w : key === 'r' ? model.rcur : key === 'd' ? model.dcur
      : key === 'v' ? model.v : model.pcur;
  }
  function zeroRange(model, key) {
    var hi;
    if (key === 'w') hi = fieldRange(model.w, model.validList)[1];
    else if (key === 'r') hi = model.clim('r')[1];
    else if (key === 'd') hi = model.clim('d')[1];
    else if (key === 'v') hi = model.clim('v')[1];
    else hi = model.clim('p')[1];
    return [0, hi > 0 ? hi : 1];
  }
  function fieldKeys(fields) {
    var out = [], seen = {};
    (fields && fields.length ? fields : ['w', 'd', 'p']).forEach(function (key) {
      key = key === 'h' ? 'w' : String(key || '').toLowerCase();
      if (FIELD_META[key] && !seen[key] && out.length < 3) {
        seen[key] = true;
        out.push(key);
      }
    });
    return out.length ? out : ['w'];
  }
  function modeInfo(mode) {
    mode = String(mode || 'v2').toLowerCase();
    if (mode === '2') mode = 'v2';
    if (mode === '3') mode = 'v3';
    return mode === 'v3' ? 'v3' : 'v2';
  }
  function rampFor(cmaps, key) {
    var meta = FIELD_META[key];
    return (cmaps && cmaps[meta.cmap]) || (cmaps && cmaps.r) || function () { return meta.color; };
  }

  function surfaceQuads(model, field, cam, step, hScale, range, cw, ch) {
    var mask = model.mask, W = model.W, H = model.H;
    var f = smoothField(field, mask, W, H, (P.style3d || S).smooth);
    var lo = range[0], hi = range[1], span = (hi - lo) || 1;
    var quads = [];
    function gxy(x, y) { return [(x / (W - 1)) - 0.5, (y / (H - 1)) - 0.5]; }
    function zAt(i) {
      var z = ((f[i] - lo) / span) * hScale;
      return isFinite(z) && z > 0 ? z : 0;
    }
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
        quads.push({
          pr: pr,
          d: d,
          avg: avg,
          depth: (pr[0][2] + pr[1][2] + pr[2][2] + pr[3][2]) / 4,
          sh: 0.62 + 0.38 * Math.max(0, dot3(quadNormal(d), norm3([-0.4, -0.6, 0.7])))
        });
      }
    }
    fitQuads(quads, cw, ch, (P.style3d || S).pad || 0.07);
    return { quads: quads, range: range, field: f };
  }

  function fitQuads(quads, cw, ch, padFactor) {
    if (!quads.length) return;
    var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
    quads.forEach(function (q) {
      q.pr.forEach(function (p) {
        if (p[0] < minx) minx = p[0];
        if (p[0] > maxx) maxx = p[0];
        if (p[1] < miny) miny = p[1];
        if (p[1] > maxy) maxy = p[1];
      });
    });
    var pad = (padFactor == null ? 0.07 : padFactor) * Math.min(cw, ch);
    var sc = Math.min((cw - 2 * pad) / ((maxx - minx) || 1), (ch - 2 * pad) / ((maxy - miny) || 1));
    var offx = (cw - (maxx - minx) * sc) / 2 - minx * sc;
    var offy = (ch - (maxy - miny) * sc) / 2 - miny * sc;
    quads.forEach(function (q) {
      q.pts = q.pr.map(function (p) { return [p[0] * sc + offx, p[1] * sc + offy]; });
    });
  }

  function drawQuads(ctx, quads, fillFn, strokeStyle, lineWidth) {
    quads.sort(function (a, b) { return b.depth - a.depth; });
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth == null ? 0.4 : lineWidth;
    ctx.strokeStyle = strokeStyle || 'rgba(0,0,0,0.12)';
    for (var i = 0; i < quads.length; i++) {
      var q = quads[i], p0 = q.pts[0], p1 = q.pts[1], p2 = q.pts[2], p3 = q.pts[3];
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.lineTo(p3[0], p3[1]);
      ctx.closePath();
      ctx.fillStyle = fillFn(q);
      ctx.fill();
      ctx.stroke();
    }
  }
  function surfaceFill(ramp, q) {
    var c = ramp(q.t);
    return shadeRgb(c, q.sh, 1);
  }
  function flatFill(rgb, alpha, q) {
    return shadeRgb(rgb, q.sh, alpha);
  }
  function drawLabel(ctx, text, x, y, color) {
    ctx.save();
    ctx.font = '700 11px JetBrains Mono, monospace';
    var w = ctx.measureText(text).width + 18;
    roundedRect(ctx, x, y, w, 24, 8);
    ctx.fillStyle = 'rgba(11,14,18,.76)';
    ctx.strokeStyle = 'rgba(255,255,255,.14)';
    ctx.lineWidth = 1;
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = color || '#ece7db';
    ctx.fillText(text, x + 9, y + 16);
    ctx.restore();
  }

  function drawSurfacePanel(ctx, model, key, x, y, w, h, cmaps, S3) {
    var meta = FIELD_META[key];
    var cam = makeCam(S3.az != null ? S3.az : 45, S3.el != null ? S3.el : 30);
    var surf = surfaceQuads(model, fieldData(model, key), cam, S3.step || 2, S3.height || 0.42, zeroRange(model, key), w, h);
    var ramp = rampFor(cmaps, key);
    ctx.save();
    ctx.translate(x, y);
    if (S3.roundedClip) S3.roundedClip(ctx, w, h, S3.radius != null ? S3.radius : 14);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0b0e12';
    ctx.fillRect(0, 0, w, h);
    drawQuads(ctx, surf.quads, function (q) {
      q.t = (q.avg - surf.range[0]) / ((surf.range[1] - surf.range[0]) || 1);
      if (!isFinite(q.t)) q.t = 0;
      return surfaceFill(ramp, q);
    }, 'rgba(0,0,0,0.10)', 0.36);
    drawLabel(ctx, meta.label, 12, 12, rgbToRgba(meta.color, 1));
    ctx.restore();
  }

  function drawPanorama(ctx, model, fields, cw, ch, cmaps, S3) {
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#0b0e12';
    ctx.fillRect(0, 0, cw, ch);
    var gap = fields.length > 1 ? 12 : 0;
    var w = (cw - gap * (fields.length - 1)) / fields.length;
    for (var i = 0; i < fields.length; i++) {
      drawSurfacePanel(ctx, model, fields[i], i * (w + gap), 0, w, ch, cmaps, S3);
    }
  }

  function drawLateral(ctx, model, fields, cw, ch, S3) {
    var cam = makeCam(S3.profile ? S3.profile.az : -89.5, S3.profile ? S3.profile.el : 6);
    var step = S3.step || 2;
    var hScale = S3.height || 0.42;
    var zero = new Float64Array(model.N || (model.W * model.H));
    var floor = surfaceQuads(model, zero, cam, step, 0, [0, 1], cw, ch);
    var surfaces = [], allForFit = floor.quads.slice();

    fields.forEach(function (key) {
      var meta = FIELD_META[key];
      var surf = surfaceQuads(model, fieldData(model, key), cam, step, hScale, zeroRange(model, key), cw, ch);
      surf.quads.forEach(function (q) {
        q._fill = function () { return flatFill(meta.color, meta.alpha, q); };
        q._stroke = 'rgba(0,0,0,0.10)';
        surfaces.push(q);
        allForFit.push(q);
      });
    });
    fitQuads(allForFit, cw, ch, 0.08);

    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    if (S3.roundedClip) S3.roundedClip(ctx, cw, ch, S3.radius != null ? S3.radius : 14);
    ctx.fillStyle = '#0b0e12';
    ctx.fillRect(0, 0, cw, ch);

    floor.quads.sort(function (a, b) { return b.depth - a.depth; });
    ctx.lineJoin = 'round';
    ctx.lineWidth = 0.32;
    floor.quads.forEach(function (q) {
      ctx.beginPath();
      ctx.moveTo(q.pts[0][0], q.pts[0][1]);
      ctx.lineTo(q.pts[1][0], q.pts[1][1]);
      ctx.lineTo(q.pts[2][0], q.pts[2][1]);
      ctx.lineTo(q.pts[3][0], q.pts[3][1]);
      ctx.closePath();
      ctx.fillStyle = 'rgba(236,231,219,.12)';
      ctx.strokeStyle = 'rgba(236,231,219,.10)';
      ctx.fill(); ctx.stroke();
    });

    surfaces.sort(function (a, b) { return b.depth - a.depth; });
    surfaces.forEach(function (q) {
      ctx.beginPath();
      ctx.moveTo(q.pts[0][0], q.pts[0][1]);
      ctx.lineTo(q.pts[1][0], q.pts[1][1]);
      ctx.lineTo(q.pts[2][0], q.pts[2][1]);
      ctx.lineTo(q.pts[3][0], q.pts[3][1]);
      ctx.closePath();
      ctx.fillStyle = q._fill();
      ctx.fill();
      ctx.strokeStyle = q._stroke;
      ctx.stroke();
    });

    drawLabel(ctx, 'piso PNB = 0', 12, ch - 36, 'rgba(236,231,219,.82)');
    fields.forEach(function (key, i) {
      drawLabel(ctx, FIELD_META[key].short, 12 + i * 82, 12, rgbToRgba(FIELD_META[key].color, 1));
    });
    ctx.restore();
  }

  var RCV = {};
  RCV.draw = function (ctx, model, mode, cw, ch, cmaps) {
    var opts = typeof mode === 'object' && mode ? mode : { mode: mode };
    var view = modeInfo(opts.mode);
    var fields = fieldKeys(opts.fields);
    var S3 = P.style3d || S;
    if (view === 'v3') drawLateral(ctx, model, fields, cw, ch, S3);
    else drawPanorama(ctx, model, fields, cw, ch, cmaps, S3);
  };

  RCV.info = function (mode, fields) {
    var view = modeInfo(mode);
    var selected = fieldKeys(fields);
    return {
      title: view === 'v3' ? 'Conversao - Sobreposicao' : 'Conversao - Panoramica',
      selected: selected,
      foot: function () {
        var out = selected.map(function (key) {
          return [key, FIELD_META[key].short, rgbToRgba(FIELD_META[key].color, 1)];
        });
        if (view === 'v3') out.push(['floor', 'piso PNB = 0', 'rgba(236,231,219,.72)']);
        return out;
      }
    };
  };
  RCV.fields = FIELD_META;
  RCV.normalizeFields = fieldKeys;

  P.renderConverge = RCV;
})(window.PPP);
