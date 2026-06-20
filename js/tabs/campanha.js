/* tabs/campanha.js — aba "Campanha global"
 *
 * Réplica do dashboard interativo original (mapa + camadas + cartões + gráficos
 * + controles ▶/+1/↺), porém alimentada por CampaignModel com DADOS REAIS.
 * Preserva-se o FORMATO e a INTERATIVIDADE; tudo o mais (mapa, colormaps,
 * cores, números) vem do código/MATLAB.
 */
window.PPP = window.PPP || {};
(function (P) {
  var R = P.render, fmt = P.fmt;
  function t(key) { return P.t ? P.t(key) : key; }
  function tf(key, vars) { return P.tf ? P.tf(key, vars) : t(key); }

  var TEMPLATE = `
    <div class="grid campaign-grid">
      <section class="panel">
        <div class="head">
          <h2 data-el="terrLabel">Território · grade do PNB</h2>
          <div class="viewtoggle" role="group" aria-label="Vista">
            <button data-view="2d" aria-pressed="true">2D</button>
            <button data-view="3d" aria-pressed="false">3D</button>
            <button data-view="conv" aria-pressed="false">Conversão</button>
          </div>
          <select data-el="convVer" hidden aria-label="Versão da conversão">
            <option value="v2">Panorâmica</option>
            <option value="v3">Sobreposição</option>
          </select>
        </div>
        <div class="tabs" role="tablist">
          <button class="tab" data-layer="h">Risco h</button>
          <button class="tab" data-layer="r" aria-pressed="true">Recompensa r<sub>m</sub></button>
          <button class="tab" data-layer="d">Déficit d<sub>m</sub></button>
          <button class="tab" data-layer="v">Vistorias v<sub>m</sub></button>
          <button class="tab" data-layer="p">Distribuição p<sub>m</sub></button>
        </div>
        <div class="maparea">
          <div class="mapbox">
            <canvas data-el="map" width="880" height="768"></canvas>
            <canvas class="overlay" data-el="overlay" width="880" height="768"></canvas>
          </div>
        </div>
        <div class="legend">
          <span class="lab" data-el="legLab"></span>
          <span data-el="legLo">0</span>
          <div class="bar" data-el="legBar"></div>
          <span data-el="legHi">1</span>
        </div>
        <div class="mapfoot" data-el="mapFoot">
          <span class="badge"><span class="sq"></span> bases operacionais</span>
          <span class="badge"><span class="dot" style="background:var(--c-route)"></span> rota da missão</span>
          <span class="badge"><span class="dot" style="background:var(--accent)"></span> UAV</span>
        </div>
        <div class="minis">
          <figure class="mini"><canvas data-el="miniD" width="264" height="230"></canvas><figcaption>déficit d<sub>m</sub></figcaption></figure>
          <figure class="mini"><canvas data-el="miniV" width="264" height="230"></canvas><figcaption>vistorias v<sub>m</sub></figcaption></figure>
          <figure class="mini"><canvas data-el="miniP" width="264" height="230"></canvas><figcaption>empírica p<sub>m</sub></figcaption></figure>
        </div>
      </section>
      <aside class="panel">
        <div class="head">
          <h2>Telemetria da campanha</h2>
          <div class="controls">
            <button class="primary" data-el="btnPlay">▶ Voar campanha</button>
            <button data-el="btnStep">+1 missão</button>
            <button data-el="btnReset">↺ Reiniciar</button>
            <select data-el="speed" aria-label="Velocidade">
              <option value="1">1× cinematográfico</option>
              <option value="2" selected>2× ágil</option>
              <option value="4">4× rápido</option>
              <option value="0">⚡ instantâneo</option>
            </select>
          </div>
        </div>
        <div class="cards">
          <div class="card hot"><div class="k">Missão</div><div class="val"><span data-el="mNow">0</span><small> / <span data-el="mMax">100</span></small></div></div>
          <div class="card"><div class="k">Custo da rota</div><div class="val"><span data-el="mCost">—</span><small> km</small></div></div>
          <div class="card"><div class="k">Déficit ‖d‖₁</div><div class="val" data-el="mDef">—</div></div>
          <div class="card"><div class="k">Dist. distributiva norm.</div><div class="val"><span data-el="mTV">—</span><small> %</small></div></div>
          <div class="card"><div class="k">Cobertura</div><div class="val"><span data-el="mCov">0,0</span><small> %</small></div></div>
          <div class="card"><div class="k">Massa de risco</div><div class="val"><span data-el="mRisk">0,0</span><small> %</small></div></div>
        </div>
        <div class="missionBar"><div class="missionFill" data-el="missionFill"></div></div>
        <div class="logline" data-el="log">Pronto. A distribuição-alvo w já está carregada; nenhum pixel foi vistoriado.</div>
        <div class="sideeq" data-el="eqstrip"></div>
        <div class="chartbox">
          <canvas data-el="chart1" width="520" height="190"></canvas>
          <div class="chartlegend">
            <span><span class="swatch" style="background:var(--c-deficit)"></span>déficit residual (%)</span>
            <span><span class="swatch" style="background:var(--c-tv)"></span>distância distributiva norm. (%)</span>
          </div>
        </div>
        <div class="chartbox">
          <canvas data-el="chart2" width="520" height="160"></canvas>
          <div class="chartlegend">
            <span><span class="swatch" style="background:var(--c-coverage)"></span>cobertura espacial</span>
            <span><span class="swatch" style="background:var(--c-empiric)"></span>massa de risco atendida</span>
          </div>
        </div>
      </aside>
    </div>
    <p class="colophon" data-el="colophon"></p>`;

  function build(el, ctx) {
    var data = ctx.data, model = ctx.model;
    el.innerHTML = TEMPLATE;
    var $ = function (k) { return el.querySelector('[data-el="' + k + '"]'); };
    var cmaps = P.colormaps.build(data);

    // dimensiona os canvas com o ASPECTO REAL da grade (células quadradas,
    // como o 'axis image' do MATLAB) — evita distorção e desalinhamento visual
    // entre o mapa e as bases/rotas.
    var aspect = model.H / model.W;
    function sizeCanvas(c, w, h) { c.width = w; c.height = h == null ? Math.round(w * aspect) : h; }
    sizeCanvas($('map'), 880); sizeCanvas($('overlay'), 880);
    sizeCanvas($('miniD'), 264); sizeCanvas($('miniV'), 264); sizeCanvas($('miniP'), 264);

    var map = $('map'), mctx = map.getContext('2d');
    var ovl = $('overlay'), octx = ovl.getContext('2d');
    var minis = { d: $('miniD').getContext('2d'), v: $('miniV').getContext('2d'), p: $('miniP').getContext('2d') };
    var legEls = { bar: $('legBar'), lo: $('legLo'), hi: $('legHi'), label: $('legLab') };
    var convVerSel = $('convVer');
    var mapFoot = $('mapFoot');

    var layer = 'r';
    var view = '2d';
    var convVer = 'v2';
    var convFields = ['w', 'd', 'p'];
    var initialTv = model.initialTV ? model.initialTV() : 0.5;
    var canvasMode = '';
    var miniH = Math.round(264 * aspect);
    var playing = false, animToken = 0;
    var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setHtml(selector, key) {
      var node = el.querySelector(selector);
      if (node) node.innerHTML = t(key);
    }
    function setText(selector, key) {
      var node = el.querySelector(selector);
      if (node) node.textContent = t(key);
    }
    function setAttr(selector, attr, key) {
      var node = el.querySelector(selector);
      if (node) node.setAttribute(attr, t(key));
    }
    function setBadge(badge, key) {
      if (!badge) return;
      var icon = badge.firstElementChild ? badge.firstElementChild.cloneNode(true) : null;
      badge.textContent = '';
      if (icon) badge.appendChild(icon);
      badge.appendChild(document.createTextNode(' ' + t(key)));
    }
    function setLegendItem(item, key) {
      if (!item) return;
      var swatch = item.querySelector('.swatch') ? item.querySelector('.swatch').cloneNode(true) : null;
      item.textContent = '';
      if (swatch) item.appendChild(swatch);
      item.appendChild(document.createTextNode(t(key)));
    }
    function setButtonStateLabel() {
      var btn = $('btnPlay');
      if (!btn) return;
      btn.textContent = playing ? t('campaign.pause') :
        (model.m >= model.n ? t('campaign.complete') : t('campaign.play'));
    }
    function territoryLabel() {
      return t('campaign.territory') + ' ' + data.grid.W + '×' + data.grid.H +
        ' · ' + fmt(data.meta.nValid, 0) + (P.lang === 'en' ? ' valid PNB pixels' : ' pixels válidos do PNB');
    }
    function translateStaticCampaign() {
      setAttr('.viewtoggle', 'aria-label', 'campaign.view.aria');
      setHtml('[data-view="2d"]', 'campaign.view.2d');
      setHtml('[data-view="3d"]', 'campaign.view.3d');
      setHtml('[data-view="conv"]', 'campaign.view.conv');
      setAttr('[data-el="convVer"]', 'aria-label', 'campaign.conv.version');
      var convOptions = el.querySelectorAll('[data-el="convVer"] option');
      if (convOptions[0]) convOptions[0].textContent = t('campaign.conv.v2');
      if (convOptions[1]) convOptions[1].textContent = t('campaign.conv.v3');
      setHtml('aside.panel .head h2', 'campaign.telemetry');
      setHtml('[data-el="btnStep"]', 'campaign.step');
      setHtml('[data-el="btnReset"]', 'campaign.reset');
      setAttr('[data-el="speed"]', 'aria-label', 'campaign.speed.aria');
      var speedOptions = el.querySelectorAll('[data-el="speed"] option');
      if (speedOptions[0]) speedOptions[0].textContent = t('campaign.speed.1');
      if (speedOptions[1]) speedOptions[1].textContent = t('campaign.speed.2');
      if (speedOptions[2]) speedOptions[2].textContent = t('campaign.speed.4');
      if (speedOptions[3]) speedOptions[3].textContent = t('campaign.speed.0');
      var cardKeys = [
        'campaign.card.mission',
        'campaign.card.cost',
        'campaign.card.deficit',
        'campaign.card.tv',
        'campaign.card.coverage',
        'campaign.card.riskMass'
      ];
      el.querySelectorAll('.cards .card .k').forEach(function (node, idx) {
        if (cardKeys[idx]) node.innerHTML = t(cardKeys[idx]);
      });
      var miniKeys = ['campaign.mini.deficit', 'campaign.mini.visits', 'campaign.mini.empirical'];
      el.querySelectorAll('.mini figcaption').forEach(function (node, idx) {
        if (miniKeys[idx]) node.innerHTML = t(miniKeys[idx]);
      });
      var legendItems = el.querySelectorAll('.chartlegend span');
      setLegendItem(legendItems[0], 'campaign.chart.deficit');
      setLegendItem(legendItems[1], 'campaign.chart.tv');
      setLegendItem(legendItems[2], 'campaign.chart.coverage');
      setLegendItem(legendItems[3], 'campaign.chart.riskMass');
      if (view !== 'conv') {
        var badges = mapFoot.querySelectorAll('.badge');
        setBadge(badges[0], 'campaign.legend.bases');
        setBadge(badges[1], 'campaign.legend.route');
        setBadge(badges[2], 'campaign.legend.uav');
      }
      setButtonStateLabel();
    }

    $('mMax').textContent = model.n;
    $('terrLabel').textContent = territoryLabel();
    buildEqStrip($('eqstrip'), data.meta);
    $('colophon').innerHTML = colophonHtml(data.meta);

    function convKeyForLayer(k) {
      return k === 'h' ? 'w' : k;
    }
    function updateLayerTabs() {
      var normal = {
        h: t('campaign.layer.h'),
        r: t('campaign.layer.r'),
        d: t('campaign.layer.d'),
        v: t('campaign.layer.v'),
        p: t('campaign.layer.p')
      };
      var conv = {
        h: t('campaign.layer.w'),
        r: t('campaign.layer.r'),
        d: t('campaign.layer.d'),
        v: t('campaign.layer.v'),
        p: t('campaign.layer.p')
      };
      el.querySelectorAll('.tab').forEach(function (b) {
        var k = b.dataset.layer;
        if (view === 'conv') {
          var ck = convKeyForLayer(k);
          b.innerHTML = conv[k];
          b.setAttribute('aria-pressed', convFields.indexOf(ck) >= 0 ? 'true' : 'false');
          b.classList.toggle('limit', convFields.length >= 3 && convFields.indexOf(ck) < 0);
        } else {
          b.innerHTML = normal[k];
          b.setAttribute('aria-pressed', k === layer ? 'true' : 'false');
          b.classList.remove('limit');
        }
      });
    }
    function convInfo() {
      return P.renderConverge && P.renderConverge.info ? P.renderConverge.info(convVer, convFields) : null;
    }
    function updateChrome() {
      var cinfo = view === 'conv' ? convInfo() : null;
      convVerSel.hidden = view !== 'conv';
      if (view === 'conv' && cinfo) {
        $('terrLabel').textContent = cinfo.title + ' · ' + data.grid.W + '×' + data.grid.H +
          ' · ' + fmt(data.meta.nValid, 0) + (P.lang === 'en' ? ' valid PNB pixels' : ' pixels válidos do PNB');
        mapFoot.innerHTML = cinfo.foot().map(function (item) {
          return '<span class="badge"><span class="dot" style="background:' + item[2] + '"></span> ' + item[1] + '</span>';
        }).join('');
      } else {
        $('terrLabel').textContent = territoryLabel();
        mapFoot.innerHTML =
          '<span class="badge"><span class="sq"></span> bases operacionais</span>' +
          '<span class="badge"><span class="dot" style="background:var(--c-route)"></span> rota da missão</span>' +
          '<span class="badge"><span class="dot" style="background:var(--accent)"></span> UAV</span>';
      }
      updateLayerTabs();
    }

    function updateCanvasMode() {
      var next = view === '2d' ? 'map' : 'panorama';
      if (next === canvasMode) return;
      canvasMode = next;
      if (next === 'map') {
        sizeCanvas(map, 880); sizeCanvas(ovl, 880);
      } else {
        sizeCanvas(map, 880, 520); sizeCanvas(ovl, 880, 520);
      }
    }

    /* ---------- render ---------- */
    function drawMain() {
      updateCanvasMode();
      if (view === 'conv') {
        octx.clearRect(0, 0, ovl.width, ovl.height);
        P.renderConverge.draw(mctx, model, { mode: convVer, fields: convFields }, map.width, map.height, cmaps);
      } else if (view === '3d') {
        octx.clearRect(0, 0, ovl.width, ovl.height);              // sem overlay 2D
        P.render3d.draw(mctx, model, layer, map.width, map.height, cmaps, model.clim(layer));
      } else {
        R.drawField(mctx, model, layer, map.width, map.height, cmaps, model.clim(layer));
        R.drawContour(mctx, model, layer, map.width, map.height); // linhas de relevo
        R.drawRoute(octx, ovl, model, model.metricsAt(model.m), 1, null);
      }
    }
    function drawAll() {
      updateChrome();
      drawMain();
      if (view === '3d') {
        P.render3d.draw(minis.d, model, 'd', 264, miniH, cmaps, model.clim('d'), { radius: 8, step: 3, height: 0.36 });
        P.render3d.draw(minis.v, model, 'v', 264, miniH, cmaps, model.clim('v'), { radius: 8, step: 3, height: 0.36 });
        P.render3d.draw(minis.p, model, 'p', 264, miniH, cmaps, model.clim('p'), { radius: 8, step: 3, height: 0.36 });
      } else {
        R.drawField(minis.d, model, 'd', 264, miniH, cmaps, model.clim('d'));
        R.drawContour(minis.d, model, 'd', 264, miniH, { levels: 6, width: 0.5, smooth: 3 });
        R.drawField(minis.v, model, 'v', 264, miniH, cmaps, model.clim('v'));
        R.drawContour(minis.v, model, 'v', 264, miniH, { levels: 6, width: 0.5, smooth: 3 });
        R.drawField(minis.p, model, 'p', 264, miniH, cmaps, model.clim('p'));
        R.drawContour(minis.p, model, 'p', 264, miniH, { levels: 6, width: 0.5, smooth: 3 });
      }
      if (view === 'conv') {
        var cinfo = convInfo();
        if (cinfo) {
          var items = cinfo.foot().filter(function (item) { return item[0] !== 'floor'; });
          var stops = [];
          items.forEach(function (item, i) {
            var a = Math.round(100 * i / items.length);
            var b = Math.round(100 * (i + 1) / items.length);
            stops.push(item[2] + ' ' + a + '%', item[2] + ' ' + b + '%');
          });
          legEls.bar.style.background = 'linear-gradient(90deg,' + stops.join(',') + ')';
          legEls.lo.textContent = '0';
          legEls.hi.textContent = 'max';
          legEls.label.textContent = convVer === 'v3' ? t('campaign.conv.v3') : t('campaign.conv.v2');
        }
      } else {
        R.styleLegend(legEls, cmaps[layer], model.clim(layer), data.labels[layer] || '', layer);
        var legendKey = layer === 'h' ? 'campaign.layer.h' :
          layer === 'r' ? 'campaign.layer.r' :
          layer === 'd' ? 'campaign.layer.d' :
          layer === 'v' ? 'campaign.layer.v' : 'campaign.layer.p';
        legEls.label.innerHTML = t(legendKey);
      }
      translateStaticCampaign();
    }

    function series(field, scale) {
      scale = scale || 1; var out = [];
      if (field === 'deficit') out.push([0, (data.meta.deficitInitial || 1) * scale]);
      if (field === 'tv') out.push([0, initialTv * scale]);
      for (var k = 0; k < model.m; k++) out.push([model.d.missions[k].m, model.d.missions[k][field] * scale]);
      return out;
    }
    function drawCharts() {
      R.lineChart($('chart1'), [
        { data: series('deficit', 100), color: getCss('--c-deficit'), marker: true },
        { data: series('tv', 200), color: getCss('--c-tv'), marker: true }
      ], { yMax: 100, xMax: model.n, xlabel: t('campaign.axis.mission'), yfmt: function (v) { return v.toFixed(0) + '%'; } });
      R.lineChart($('chart2'), [
        { data: series('coverage', 100), color: getCss('--c-coverage'), marker: true },
        { data: series('riskMass', 100), color: getCss('--c-empiric'), marker: true }
      ], { yMax: 100, xMax: model.n, yfmt: function (v) { return v.toFixed(0) + '%'; } });
    }

    function updatePanel(mt) {
      $('mNow').textContent = model.m;
      $('missionFill').style.width = (100 * model.m / model.n) + '%';
      if (mt) {
        $('mCost').textContent = fmt(mt.cost, 1);
        $('mDef').textContent = fmt(mt.deficit, 4);
        $('mTV').textContent = fmt(mt.tv * 200, 1);
        $('mCov').textContent = fmt(mt.coverage * 100, 1);
        $('mRisk').textContent = fmt(mt.riskMass * 100, 1);
        $('log').innerHTML = tf('campaign.log.mission', {
          m: model.m,
          cost: fmt(mt.cost, 1),
          budget: fmt(100 * mt.cost / data.meta.Qkm, 0),
          deficit: fmt(mt.deficit, 4),
          tv: fmt(mt.tv * 200, 1)
        });
      } else {
        $('mCost').textContent = '—';
        $('mDef').textContent = fmt(data.meta.deficitInitial || 1, 4);
        $('mTV').textContent = fmt(initialTv * 200, 1);
        $('mCov').textContent = '0,0'; $('mRisk').textContent = '0,0';
        $('log').innerHTML = tf('campaign.log.initial', { tv: fmt(initialTv * 200, 1) });
      }
    }

    /* ---------- voo de uma missão ---------- */
    function speedVal() { var s = +$('speed').value; return reduceMotion ? 0 : s; }

    function flyMission() {
      return new Promise(function (res) {
        var k = model.m + 1;
        var mis = model.d.missions[k - 1];
        var sp = speedVal();
        var W = model.W, H = model.H, SX = ovl.width / W, SY = ovl.height / H;
        var pts = (mis.route || []).map(function (q) {
          return [(q[0] - 0.5) / W * ovl.width, (q[1] - 0.5) / H * ovl.height];
        });

        function commit() {
          model.applyMission(k); drawAll();        // drawAll já desenha rota (2D/3D)
          updatePanel(mis); drawCharts(); res();
        }
        // 3D ou modo instantâneo: sem voo do UAV
        if (sp === 0 || pts.length < 2 || view === '3d' || view === 'conv') { commit(); return; }

        var seglen = [], tot = 0;
        for (var i = 1; i < pts.length; i++) {
          var l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
          seglen.push(l); tot += l;
        }
        var dur = Math.max(450, 1500 / sp), t0 = performance.now(), tok = ++animToken;
        function frame(t) {
          if (tok !== animToken) { res(); return; }
          var u = Math.min(1, (t - t0) / dur);
          var dlen = u * tot, kk = 0;
          while (kk < seglen.length && dlen > seglen[kk]) { dlen -= seglen[kk]; kk++; }
          var uav = pts[pts.length - 1];
          if (kk < seglen.length) {
            var A = pts[kk], Bp = pts[kk + 1], f = seglen[kk] ? dlen / seglen[kk] : 0;
            uav = [A[0] + (Bp[0] - A[0]) * f, A[1] + (Bp[1] - A[1]) * f];
          }
          R.drawRoute(octx, ovl, model, mis, u, uav);
          if (u < 1) requestAnimationFrame(frame); else commit();
        }
        requestAnimationFrame(frame);
      });
    }

    function playLoop() {
      if (playing) return;
      playing = true; setButtonStateLabel();
      (function next() {
        if (!playing || model.m >= model.n) {
          playing = false;
          setButtonStateLabel();
          if (model.m >= model.n) {
            var last = model.metricsAt(model.n);
            $('log').innerHTML = tf('campaign.log.finished', {
              tv: fmt(last.tv * 200, 1),
              coverage: fmt(last.coverage * 100, 2),
              riskMass: fmt(last.riskMass * 100, 2)
            });
          }
          return;
        }
        flyMission().then(function () {
          var sp = speedVal();
          if (sp === 0) setTimeout(next, 8);
          else if (view === '3d' || view === 'conv') setTimeout(next, Math.max(120, 620 / sp));
          else next();
        });
      })();
    }

    /* ---------- listeners ---------- */
    $('btnPlay').addEventListener('click', function () {
      if (playing) { playing = false; setButtonStateLabel(); }
      else playLoop();
    });
    $('btnStep').addEventListener('click', function () {
      if (!playing && model.m < model.n) flyMission();
    });
    $('btnReset').addEventListener('click', function () {
      playing = false; animToken++; model.reset();
      drawAll(); updatePanel(null); drawCharts(); setButtonStateLabel();
    });
    el.querySelectorAll('.tab').forEach(function (b) {
      b.addEventListener('click', function () {
        if (view === 'conv') {
          var ck = convKeyForLayer(b.dataset.layer);
          var pos = convFields.indexOf(ck);
          if (pos >= 0) {
            if (convFields.length > 1) convFields.splice(pos, 1);
          } else if (convFields.length < 3) {
            convFields.push(ck);
          } else {
            $('log').innerHTML = t('campaign.conv.limit');
          }
          drawAll();
          return;
        }
        layer = b.dataset.layer;
        drawAll();
      });
    });
    el.querySelectorAll('.viewtoggle button').forEach(function (b) {
      b.addEventListener('click', function () {
        if (playing) { playing = false; setButtonStateLabel(); }
        animToken++;                                    // cancela voo 2D em curso
        el.querySelectorAll('.viewtoggle button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        view = b.dataset.view;
        updateChrome();
        drawAll();
      });
    });
    convVerSel.addEventListener('change', function () {
      convVer = convVerSel.value;
      drawAll();
    });

    /* boot da aba */
    model.reset(); drawAll(); updatePanel(null); drawCharts();

    /* devolve cleanup p/ unmount */
    return function cleanup() { playing = false; animToken++; };
  }

  function getCss(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#888';
  }
  function buildEqStrip(node, meta) {
    node.innerHTML =
      '<div class="eqline"><span class="eq">r<sub>m</sub>(i) = d<sub>m</sub>(i)<sup>α</sup> · h(i)<sup>β</sup> + ε</span></div>' +
      '<div class="eqline">' +
      '  <span class="chip">α = <b>' + fmt(meta.alpha, 1) + '</b></span>' +
      '  <span class="chip">β = <b>' + fmt(meta.beta, 1) + '</b></span>' +
      '  <span class="chip">ε = <b>10⁻⁶</b></span>' +
      '  <span class="eqsep">|</span>' +
      '  <span class="chip">' + t('campaign.eq.budget') + ' = <b>' + fmt(meta.Qkm, 0) + ' km</b></span>' +
      '  <span class="chip">d<sub>m</sub> = [w − p<sub>m</sub>]₊</span>' +
      '</div>';
  }
  function colophonHtml(meta) {
    return t('campaign.reading.prefix') + ' ' + t('campaign.reading.body') + ' ' +
      tf('campaign.realData', {
        n: meta.nMissions,
        deficit: fmt(meta.finalDeficit, 4),
        coverage: fmt(meta.finalCoverage, 2),
        riskMass: fmt(meta.finalRiskMass, 2),
        cost: fmt(meta.meanCost, 2)
      });
  }

  P.registerTab({
    id: 'campanha',
    label: 'Campanha global',
    labelKey: 'tabs.campaign',
    mount: function (el, ctx) {
      if (!ctx.model) {
        el.innerHTML = '<div class="placeholder"><h3>' + t('campaign.noData.title') + '</h3>' +
          '<p>' + t('campaign.noData.body') + '</p></div>';
        return;
      }
      el._cleanup = build(el, ctx);
    },
    unmount: function (el) { if (el._cleanup) el._cleanup(); }
  });
})(window.PPP);
