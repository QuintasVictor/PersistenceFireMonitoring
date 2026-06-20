/* tabs/missaoLocal.js — aba "Missão local" (v3: dados reais da campanha)
 *
 * Pipeline 1-5: mapa de recompensa, candidatos, clusters, grafo, rota.
 * Planejamento: ALNS passo a passo com pesos, Rolling Horizon e Ambos.
 * Fonte: PPP_LOCAL exportado por sc_export_local_real.m.
 * Mapa de recompensa usa PPP_DATA via ctx.model.goTo(m-1).
 */
window.PPP = window.PPP || {};
(function (P) {
  var fmt = P.fmt;
  function t(key) { return P.t ? P.t(key) : key; }
  function tf(key, vars) { return P.tf ? P.tf(key, vars) : t(key); }

  var PHASES = {
    initial: { labelKey: 'local.phase.initial', color: 'var(--c-route)' },
    replan:  { labelKey: 'local.phase.replan', color: 'var(--accent2)' },
    execute: { labelKey: 'local.phase.execute', color: 'var(--c-route)' }
  };

  var PIPELINE_STEPS = [
    { labelKey: 'local.pipeline.reward', key: 'reward',
      descKey: 'local.pipeline.reward.desc' },
    { labelKey: 'local.pipeline.candidates', key: 'candidates',
      descKey: 'local.pipeline.candidates.desc' },
    { labelKey: 'local.pipeline.clusters', key: 'clusters',
      descKey: 'local.pipeline.clusters.desc' },
    { labelKey: 'local.pipeline.graph', key: 'graph',
      descKey: 'local.pipeline.graph.desc' },
    { labelKey: 'local.pipeline.route', key: 'route',
      descKey: 'local.pipeline.route.desc' }
  ];

  var TEMPLATE =
    '<div class="local-page">' +
    '  <div class="local-subtabs" role="tablist" aria-label="Subabas da missão local">' +
    '    <button data-subtab="passos" aria-pressed="true">Passos da Missão local</button>' +
    '    <button data-subtab="planejamento" aria-pressed="false">Planejamento de rota</button>' +
    '  </div>' +
    '  <div class="local-steps" data-panel="passos">' +
    '    <section class="panel local-main local-steps-main">' +
    '      <div class="head">' +
    '        <div>' +
    '          <h2>Passos da Missão local</h2>' +
    '        </div>' +
    '        <div class="controls">' +
    '          <label>Missão: <select data-el="missionSelect" aria-label="Missão representativa"></select></label>' +
    '          <button data-el="stepPrev" disabled>&#8592; Anterior</button>' +
    '          <button class="primary" data-el="stepNext">Próximo &#8594;</button>' +
    '        </div>' +
    '      </div>' +
    '      <div class="local-step-gallery">' +
    '        <canvas data-el="stepCanvas" width="1080" height="1080" aria-label="Pipeline da missão local"></canvas>' +
    '      </div>' +
    '      <div class="local-stepflow local-stepflow-nav" aria-label="Sequência do pipeline">' +
    '      </div>' +
    '    </section>' +
    '    <aside class="panel local-side">' +
    '      <div class="head"><h2>Etapa atual</h2></div>' +
    '      <div class="local-card">' +
    '        <h3 data-el="stepTitle">—</h3>' +
    '        <p data-el="stepDesc">—</p>' +
    '      </div>' +
    '      <div class="local-card" data-el="stepMetrics"></div>' +
    '    </aside>' +
    '  </div>' +
    '  <div class="risk-lightbox" data-el="stepsLightbox" hidden>' +
    '    <button class="risk-lightbox-backdrop" type="button" data-lightbox-close aria-label="Fechar ampliação"></button>' +
    '    <figure class="risk-lightbox-frame">' +
    '      <button class="risk-lightbox-close" type="button" data-lightbox-close>Fechar</button>' +
    '      <img data-el="stepsLightboxImg" alt="Passo ampliado">' +
    '      <figcaption data-el="stepsLightboxCap"></figcaption>' +
    '    </figure>' +
    '  </div>' +
    '  <div class="local-shell" data-panel="planejamento" hidden>' +
    '  <section class="panel local-main">' +
    '    <div class="head">' +
    '      <div>' +
    '        <h2>Missão local — ALNS + Rolling Horizon</h2>' +
    '      </div>' +
    '      <div class="controls">' +
    '        <label>Missão: <select data-el="planMissionSelect" aria-label="Missão RH"></select></label>' +
    '        <select data-el="mode" aria-label="O que ver">' +
    '          <option value="alns">ALNS passo a passo</option>' +
    '          <option value="rolling">Rolling horizon</option>' +
    '          <option value="both" selected>Ambos</option>' +
    '        </select>' +
    '        <select data-el="speed" aria-label="Velocidade">' +
    '          <option value="0.5">0.5x</option>' +
    '          <option value="1" selected>1x</option>' +
    '          <option value="2">2x</option>' +
    '          <option value="4">4x</option>' +
    '          <option value="0">instantâneo</option>' +
    '        </select>' +
    '        <button class="primary" data-el="play">&#9654; Reproduzir</button>' +
    '        <button data-el="reset">&#8634; Reiniciar</button>' +
    '      </div>' +
    '    </div>' +
    '    <div class="localstage local-plan-stage" data-el="stageBox">' +
    '      <div class="localphase">' +
    '        <span class="localphase-chip" data-el="phaseChip">ROTA INICIAL</span>' +
    '        <span class="localphase-copy" data-el="phaseCopy">Pronto para reproduzir.</span>' +
    '      </div>' +
    '      <canvas data-el="scene" width="760" height="760"></canvas>' +
    '    </div>' +
    '    <div class="locallegend">' +
    '      <span><i style="background:#d4a320"></i> rota efetiva RH</span>' +
    '      <span><i style="background:rgba(24,194,255,.96)"></i> rota projetada ALNS</span>' +
    '      <span><i style="background:#17a640"></i> nós visitados</span>' +
    '    </div>' +
    '  </section>' +
    '  <aside class="panel local-side">' +
    '    <div class="head"><h2>Estado do log</h2><span class="local-status" data-el="status">frame 1</span></div>' +
    '    <div class="local-card" data-el="planMetrics"></div>' +
    '    <div class="local-card">' +
    '      <h3 data-el="opTitle">Operadores</h3>' +
    '      <p data-el="opCopy">Aguardando reprodução.</p>' +
    '    </div>' +
    '    <div class="local-card" data-el="weightsCard" hidden>' +
    '      <h3>Pesos dos operadores ALNS</h3>' +
    '      <canvas data-el="destroyWeightsCanvas" width="640" height="150" aria-label="Pesos dos operadores de destruição"></canvas>' +
    '      <canvas data-el="repairWeightsCanvas" width="640" height="150" aria-label="Pesos dos operadores de reconstrução"></canvas>' +
    '      <p data-el="alnsWeightsCopy">Aguardando log detalhado.</p>' +
    '    </div>' +
    '  </aside>' +
    '</div>' +
    '</div>';

  function rollingFrames(steps, route) {
    var frames = [];
    if (!steps || !steps.length) return frames;
    for (var i = 0; i < steps.length; i++) {
      var st = steps[i];
      frames.push({
        phase: 'replan', step: st.step,
        executedSoFar: st.executedSoFar, seqBest: st.seqBest,
        candidates: st.candidates, QremKm: st.QremKm, rolling: st,
        text: tf('local.frameText.replan', { step: st.step, n: st.candidates ? st.candidates.length : '?' })
      });
      frames.push({
        phase: 'execute', step: st.step,
        executedSoFar: st.executedSoFar,
        committed: [st.currentNode, st.nextNode],
        QremKm: st.QremKm, rolling: st,
        text: tf('local.frameText.execute', { from: st.currentNode, to: st.nextNode })
      });
    }
    if (route && route.seqExecuted && route.seqExecuted.length > 1) {
      frames.push({
        phase: 'execute',
        step: steps.length + 1,
        executedSoFar: route.seqExecuted,
        committed: route.seqExecuted.slice(-2),
        finalRoute: true,
        text: t('local.frameText.finalRoute')
      });
    }
    return frames;
  }

  function alnsFrames(alns, steps) {
    if (!alns || !alns.replanSummaries || !alns.replanSummaries.length) {
      return [{
        phase: 'initial',
        text: t('local.frameText.alnsMissing')
      }];
    }
    var detail = null;
    for (var d = 0; d < alns.replanSummaries.length; d++) {
      var cand = alns.replanSummaries[d];
      if (cand && cand.hasDetailedLog && cand.iterations && cand.iterations.length) {
        detail = cand;
        break;
      }
    }
    if (detail) {
      var stDetail = steps && steps[detail.step - 1];
      return detail.iterations.map(function (it) {
        return {
          phase: 'replan',
          step: detail.step,
          executedSoFar: stDetail ? stDetail.executedSoFar : [],
          seqBest: it.seqClosed || it.seqBest || (stDetail ? stDetail.seqBest : null),
          candidates: stDetail ? stDetail.candidates : null,
          QremKm: stDetail ? stDetail.QremKm : null,
          rolling: stDetail || null,
          alnsDetail: detail,
          alnsIter: it,
          alnsStep: it.it,
          totalAlns: detail.iterations.length,
          text: tf('local.frameText.iter', {
            it: it.it,
            total: detail.iterations.length,
            destroy: it.opDName,
            repair: it.opRName,
            status: it.accept ? t('local.frameText.accepted') : t('local.frameText.rejected')
          })
        };
      });
    }
    var sums = alns.replanSummaries;
    var frames = [];
    for (var i = 0; i < sums.length; i++) {
      var rs = sums[i];
      var st = steps && steps[i];
      frames.push({
        phase: 'replan', step: rs.step,
        executedSoFar: st ? st.executedSoFar : [],
        seqBest: st ? (st.seqInit || st.seqBest) : null,
        candidates: st ? st.candidates : null,
        QremKm: st ? st.QremKm : null,
        rolling: st || null,
        alnsStep: i + 1, totalAlns: sums.length,
        text: tf('local.frameText.alnsRun', { step: rs.step, total: sums.length, iter: rs.nIterations || 200 })
      });
      frames.push({
        phase: 'execute', step: rs.step,
        executedSoFar: st ? st.executedSoFar : [],
        seqBest: st ? st.seqBest : null,
        QremKm: st ? st.QremKm : null,
        rolling: st || null,
        alnsStep: i + 1, totalAlns: sums.length, alnsResult: rs,
        text: tf('local.frameText.alnsResult', {
          step: rs.step,
          reward: rs.finalReward != null ? rs.finalReward.toFixed(6) : '?',
          cost: rs.finalCostKm != null ? rs.finalCostKm.toFixed(1) : '?'
        })
      });
    }
    return frames;
  }

  function bothFrames(steps, alns, route) {
    var frames = [];
    if (!steps || !steps.length) return frames;
    var sums = alns && alns.replanSummaries ? alns.replanSummaries : [];
    for (var i = 0; i < steps.length; i++) {
      var st = steps[i];
      var rs = sums[i] || null;
      var detailIters = (rs && rs.hasDetailedLog && rs.iterations) ? rs.iterations : [];
      frames.push({
        phase: 'replan', step: st.step,
        executedSoFar: st.executedSoFar,
        seqBest: st.seqInit || st.seqBest,
        candidates: st.candidates, QremKm: st.QremKm, rolling: st,
        rhStep: st.step, alnsStep: 0,
        hideRhPlan: true,
        hideCandidateAura: true,
        alnsSeq: st.seqInit || st.seqBest,
        text: tf('local.frameText.rhWindow', { step: st.step, n: st.candidates ? st.candidates.length : '?' })
      });
      if (detailIters.length) {
        for (var idx = 0; idx < detailIters.length; idx++) {
          var it = detailIters[idx];
          frames.push({
            phase: 'replan', step: st.step,
            executedSoFar: st.executedSoFar,
            seqBest: it.seqClosed || it.seqBest || st.seqBest,
            candidates: st.candidates, QremKm: st.QremKm, rolling: st,
            rhStep: st.step, alnsStep: it.it, alnsResult: rs,
            alnsDetail: rs, alnsIter: it,
            hideRhPlan: true,
            hideCandidateAura: true,
            text: tf('local.frameText.alnsIter', {
              it: it.it,
              total: detailIters.length,
              destroy: it.opDName,
              repair: it.opRName
            })
          });
        }
      }
      frames.push({
        phase: 'replan', step: st.step,
        executedSoFar: st.executedSoFar,
        seqBest: st.seqBest,
        candidates: st.candidates, QremKm: st.QremKm, rolling: st,
        rhStep: st.step, alnsStep: 1, alnsResult: rs,
        hideRhPlan: true,
        hideCandidateAura: true,
        alnsSeq: st.seqBest,
        text: tf('local.frameText.alnsDone', {
          iter: rs ? rs.nIterations : '?',
          reward: rs && rs.finalReward != null ? rs.finalReward.toFixed(6) : '?'
        })
      });
      frames.push({
        phase: 'execute', step: st.step,
        executedSoFar: st.executedSoFar,
        committed: [st.currentNode, st.nextNode],
        QremKm: st.QremKm, rolling: st,
        rhStep: st.step, alnsStep: 1,
        hideRhPlan: true,
        hideCandidateAura: true,
        text: tf('local.frameText.executeShort', { from: st.currentNode, to: st.nextNode })
      });
    }
    if (route && route.seqExecuted && route.seqExecuted.length > 1) {
      frames.push({
        phase: 'execute',
        step: steps.length + 1,
        executedSoFar: route.seqExecuted,
        committed: route.seqExecuted.slice(-2),
        finalRoute: true,
        hideRhPlan: true,
        hideCandidateAura: true,
        text: t('local.frameText.effectiveFinal')
      });
    }
    return frames;
  }

  function buildTimeline(local, mode, m) {
    var steps = local.getRollingSteps(m);
    var alns  = local.getAlns(m);
    var route = local.getRoute(m);
    if (mode === 'rolling') return rollingFrames(steps, route);
    if (mode === 'alns')    return alnsFrames(alns, steps);
    return bothFrames(steps, alns, route);
  }

  function populateMissionSelect(selectEl, selectedMissions) {
    selectEl.innerHTML = '';
    for (var i = 0; i < selectedMissions.length; i++) {
      var opt = document.createElement('option');
      opt.value = String(selectedMissions[i]);
      opt.textContent = (P.t ? P.t('local.mission') : 'Missão') + ' ' + selectedMissions[i];
      selectEl.appendChild(opt);
    }
  }

  function fmtKm(v) {
    return v == null || !isFinite(v) ? '—' : v.toFixed(1) + ' km';
  }

  function fmtReward(v) {
    return v == null || !isFinite(v) ? '—' : v.toFixed(6);
  }

  function tag(label, value) {
    return '<span class="chip">' + label + ' = <b>' + value + '</b></span>';
  }

  function metricRows(rows) {
    return '<div class="local-tagrows">' + rows.map(function (row) {
      return '<div class="local-tagrow">' + row.join('') + '</div>';
    }).join('') + '</div>';
  }

  function rewardMax(local, m) {
    var nodes = local.getGraphNodes(m) || [];
    var total = 0;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].type !== 'base') total += (nodes[i].reward || 0);
    }
    return total;
  }

  function rewardPct(route, rMax) {
    if (!route || !rMax) return '—';
    return (100 * route.reward / rMax).toFixed(1) + '%';
  }

  function mount(el, ctx) {
    var loaded = P.localLoader ? P.localLoader.load() : { ok: false, error: t('local.localLoaderMissing') };
    if (!loaded.ok) {
      el.innerHTML = '<div class="placeholder"><h3>' + t('local.noData.title') + '</h3>' +
        '<p>' + t('local.noData.body') + '</p>' +
        '<div class="contract">' + t('local.noData.reason') + ': ' + loaded.error + '.</div></div>';
      return;
    }

    var local = loaded.model;
    var globalModel = ctx && ctx.model ? ctx.model : null;
    var cmaps = ctx && ctx.data ? P.colormaps.build(ctx.data) : {};
    el.innerHTML = TEMPLATE;

    function $(name) { return el.querySelector('[data-el="' + name + '"]'); }
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
    function setLabelPrefix(selectName, key) {
      var select = $(selectName);
      if (!select || !select.parentNode) return;
      var label = select.parentNode;
      for (var i = 0; i < label.childNodes.length; i++) {
        if (label.childNodes[i].nodeType === 3) {
          label.childNodes[i].nodeValue = t(key) + ': ';
          return;
        }
      }
      label.insertBefore(document.createTextNode(t(key) + ': '), select);
    }
    function stepLabel(step) { return t(step.labelKey); }
    function stepDesc(step) { return t(step.descKey); }
    function missionLabel(m) { return t('local.mission') + ' ' + m; }
    function translateStaticLocal() {
      setAttr('.local-subtabs', 'aria-label', 'local.subtabs.aria');
      setHtml('[data-subtab="passos"]', 'local.subtab.steps');
      setHtml('[data-subtab="planejamento"]', 'local.subtab.planning');
      setHtml('[data-panel="passos"] .local-main .head h2', 'local.steps.title');
      setHtml('[data-panel="passos"] .local-side .head h2', 'local.currentStep');
      setLabelPrefix('missionSelect', 'local.mission');
      setLabelPrefix('planMissionSelect', 'local.mission');
      setAttr('[data-el="missionSelect"]', 'aria-label', 'local.representativeMission');
      setHtml('[data-el="stepPrev"]', 'local.prev');
      setHtml('[data-el="stepNext"]', 'local.next');
      setAttr('[data-el="stepCanvas"]', 'aria-label', 'local.pipeline.aria');
      setAttr('.local-stepflow-nav', 'aria-label', 'local.pipeline.sequence');
      setAttr('[data-lightbox-close].risk-lightbox-backdrop', 'aria-label', 'local.lightbox.closeExpansion');
      setHtml('.risk-lightbox-close', 'local.lightbox.close');
      setAttr('[data-el="stepsLightboxImg"]', 'alt', 'local.lightbox.stepAlt');
      setHtml('[data-panel="planejamento"] .local-main .head h2', 'local.planning.title');
      setAttr('[data-el="planMissionSelect"]', 'aria-label', 'local.rhMission');
      setAttr('[data-el="mode"]', 'aria-label', 'local.mode.aria');
      setAttr('[data-el="speed"]', 'aria-label', 'local.speed.aria');
      var modeOptions = el.querySelectorAll('[data-el="mode"] option');
      if (modeOptions[0]) modeOptions[0].textContent = t('local.mode.alns');
      if (modeOptions[1]) modeOptions[1].textContent = t('local.mode.rolling');
      if (modeOptions[2]) modeOptions[2].textContent = t('local.mode.both');
      var speedOptions = el.querySelectorAll('[data-el="speed"] option');
      if (speedOptions[4]) speedOptions[4].textContent = t('local.speed.instant');
      setHtml('[data-el="play"]', 'local.play');
      setHtml('[data-el="reset"]', 'local.reset');
      var legend = el.querySelectorAll('.locallegend span');
      if (legend[0]) legend[0].lastChild.textContent = ' ' + t('local.legend.rhRoute');
      if (legend[1]) legend[1].lastChild.textContent = ' ' + t('local.legend.alnsRoute');
      if (legend[2]) legend[2].lastChild.textContent = ' ' + t('local.legend.visited');
      setHtml('[data-panel="planejamento"] .local-side .head h2', 'local.logState');
      setHtml('[data-el="opTitle"]', 'local.operators');
      setHtml('[data-el="opCopy"]', 'local.waitingPlayback');
      setHtml('[data-el="weightsCard"] h3', 'local.operatorWeights');
      setAttr('[data-el="destroyWeightsCanvas"]', 'aria-label', 'local.destroyWeightsAlt');
      setAttr('[data-el="repairWeightsCanvas"]', 'aria-label', 'local.repairWeightsAlt');
      setHtml('[data-el="alnsWeightsCopy"]', 'local.waitingDetailedLog');
    }
    translateStaticLocal();

    var stepCanvas = $('stepCanvas');
    var stepCtx = stepCanvas.getContext('2d');
    var stepIdx = 0;
    var missionSelect = $('missionSelect');
    var stepflowNav = el.querySelector('.local-stepflow-nav');
    var stepsLightbox = $('stepsLightbox');

    populateMissionSelect(missionSelect, local.selectedMissions);
    populateMissionSelect($('planMissionSelect'), local.selectedMissions);

    stepflowNav.innerHTML = PIPELINE_STEPS.map(function (s, idx) {
      return '<button type="button" data-step="' + idx + '"' +
        (idx === 0 ? ' class="active"' : '') + '>' + stepLabel(s) + '</button>' +
        (idx < PIPELINE_STEPS.length - 1 ? '<i></i>' : '');
    }).join('');
    var stepBtns = stepflowNav.querySelectorAll('[data-step]');

    function currentMission() {
      return parseInt(missionSelect.value, 10) || local.selectedMissions[0] || 1;
    }

    function drawMissingOverlay(msg) {
      var cw = stepCanvas.width, ch = stepCanvas.height;
      stepCtx.save();
      stepCtx.fillStyle = 'rgba(11,14,18,.82)';
      stepCtx.fillRect(0, 0, cw, ch);
      stepCtx.fillStyle = '#f4efe7';
      stepCtx.font = '700 22px Archivo, sans-serif';
      stepCtx.fillText(t('local.dataMissing'), 44, 60);
      stepCtx.font = '14px JetBrains Mono, monospace';
      stepCtx.fillStyle = 'rgba(244,239,231,.72)';
      stepCtx.fillText(msg || t('local.runExporter'), 44, 96);
      stepCtx.restore();
    }

    function drawRewardMap(m) {
      var cw = stepCanvas.width, ch = stepCanvas.height;
      if (!globalModel) { drawMissingOverlay('globalModel — ' + t('local.dataMissing')); return; }
      globalModel.goTo(m - 1);
      stepCtx.clearRect(0, 0, cw, ch);
      P.render.drawField(stepCtx, globalModel, 'r', cw, ch, cmaps, globalModel.clim('r'));
      P.render.drawContour(stepCtx, globalModel, 'r', cw, ch, { levels: 8, width: 0.6 });
      if (ctx.data && ctx.data.bases) {
        stepCtx.save();
        ctx.data.bases.forEach(function (b) {
          var px = (b.ci - 0.5) / globalModel.W * cw;
          var py = (b.ri - 0.5) / globalModel.H * ch;
          stepCtx.fillStyle = '#fff';
          stepCtx.strokeStyle = '#000';
          stepCtx.lineWidth = 1.2;
          stepCtx.fillRect(px - 4.5, py - 4.5, 9, 9);
          stepCtx.strokeRect(px - 4.5, py - 4.5, 9, 9);
        });
        stepCtx.restore();
      }
      stepCtx.save();
      stepCtx.fillStyle = 'rgba(11,14,18,.78)';
      stepCtx.fillRect(14, 14, 380, 54);
      stepCtx.fillStyle = '#f4efe7';
      stepCtx.font = '700 15px Archivo, sans-serif';
      stepCtx.fillText(missionLabel(m) + ' · ' + t('local.pipeline.reward') + ' r_m', 28, 37);
      stepCtx.font = '11px monospace';
      stepCtx.fillStyle = 'rgba(244,239,231,.72)';
      stepCtx.fillText('ctx.model.goTo(' + (m - 1) + ') — ' + t('local.pipeline.reward.desc'), 28, 56);
      stepCtx.restore();
    }

    function drawCandidatesStep(m) {
      var cw = stepCanvas.width, ch = stepCanvas.height;
      if (globalModel) {
        globalModel.goTo(m - 1);
        stepCtx.clearRect(0, 0, cw, ch);
        P.render.drawField(stepCtx, globalModel, 'r', cw, ch, cmaps, globalModel.clim('r'));
        P.render.drawContour(stepCtx, globalModel, 'r', cw, ch, { levels: 8, width: 0.6 });
        stepCtx.fillStyle = 'rgba(18,20,30,.60)';
        stepCtx.fillRect(0, 0, cw, ch);
      } else {
        stepCtx.clearRect(0, 0, cw, ch);
        stepCtx.fillStyle = '#111';
        stepCtx.fillRect(0, 0, cw, ch);
      }
      var candidates = local.getCandidates(m);
      if (!candidates || !candidates.length) {
        drawMissingOverlay('candidatePixels — ' + t('local.runExporter'));
        return;
      }
      var W = local.meta.gridCols || 164;
      var H = local.meta.gridRows || 163;
      var maxR = 0;
      for (var i = 0; i < candidates.length; i++) if (candidates[i].reward > maxR) maxR = candidates[i].reward;
      if (maxR === 0) maxR = 1;
      stepCtx.save();
      for (var j = 0; j < candidates.length; j++) {
        var c = candidates[j];
        var px = (c.col - 0.5) / W * cw;
        var py = (c.row - 0.5) / H * ch;
        var t = c.reward / maxR;
        var red = 255;
        var green = Math.round(255 * (1 - t * 0.72));
        var blue = Math.round(40 * (1 - t));
        stepCtx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',0.88)';
        stepCtx.beginPath();
        stepCtx.arc(px, py, 2.2, 0, Math.PI * 2);
        stepCtx.fill();
      }
      stepCtx.restore();
      stepCtx.save();
      stepCtx.fillStyle = 'rgba(11,14,18,.78)';
      stepCtx.fillRect(14, 14, 360, 54);
      stepCtx.fillStyle = '#f4efe7';
      stepCtx.font = '700 15px Archivo, sans-serif';
      stepCtx.fillText(missionLabel(m) + ' · ' + t('local.pipeline.candidates'), 28, 37);
      stepCtx.font = '11px monospace';
      stepCtx.fillStyle = 'rgba(244,239,231,.72)';
      stepCtx.fillText(candidates.length + ' · ' + t('local.pipeline.candidates.desc'), 28, 56);
      stepCtx.restore();
    }

    function showPipelineStep(idx) {
      var m = currentMission();
      stepIdx = Math.max(0, Math.min(PIPELINE_STEPS.length - 1, idx));
      var s = PIPELINE_STEPS[stepIdx];
      $('stepTitle').textContent = stepLabel(s);
      $('stepDesc').textContent = stepDesc(s);
      $('stepPrev').disabled = stepIdx === 0;
      $('stepNext').disabled = stepIdx === PIPELINE_STEPS.length - 1;
      stepBtns.forEach(function (btn) {
        var si = +btn.getAttribute('data-step');
        btn.classList.toggle('active', si === stepIdx);
        btn.classList.toggle('visited', si < stepIdx);
      });

      if (stepIdx === 0) {
        drawRewardMap(m);
      } else if (stepIdx === 1) {
        drawCandidatesStep(m);
      } else if (!local.hasMission(m)) {
        stepCtx.clearRect(0, 0, stepCanvas.width, stepCanvas.height);
        stepCtx.fillStyle = '#0b0e12';
        stepCtx.fillRect(0, 0, stepCanvas.width, stepCanvas.height);
        drawMissingOverlay(missionLabel(m) + ' — ' + t('local.runExporter'));
      } else if (stepIdx === 2) {
        P.renderLocal.drawClustersStep(stepCtx, local, m, stepCanvas.width, stepCanvas.height);
      } else if (stepIdx === 3) {
        P.renderLocal.drawGraphStep(stepCtx, local, m, stepCanvas.width, stepCanvas.height);
      } else {
        P.renderLocal.drawRouteStep(stepCtx, local, m, stepCanvas.width, stepCanvas.height);
      }

      updatePipelineMetrics(m);
    }

    function updatePipelineMetrics(m) {
      var metricsEl = $('stepMetrics');
      var pipe = local.getPipeline(m);
      var route = local.getRoute(m);
      if (!pipe) { metricsEl.innerHTML = '<h3>' + t('local.metrics') + '</h3><p>' + t('local.dataMissing') + '.</p>'; return; }
      var g = pipe.graph || {};
      var rMax = rewardMax(local, m);
      metricsEl.innerHTML =
        '<h3>' + t('local.metricsMission') + ' ' + m + '</h3>' +
        metricRows([
          [
            tag(t('local.budget'), fmtKm(local.meta.Qkm || 100)),
            tag(t('local.clusters'), pipe.clusterCount != null ? pipe.clusterCount : '—'),
            tag(t('local.graphNodes'), g.nodeCount || '—'),
            tag(t('local.edges'), g.edgeCount || '—')
          ],
          [
            tag(t('local.travelCost'), route ? fmtKm(route.costTravelKm) : '—'),
            tag(t('local.patrolCost'), route ? fmtKm(route.costPatrolKm) : '—'),
            tag(t('local.totalCost'), route ? fmtKm(route.costTotalKm) : '—')
          ],
          [
            tag(t('local.rewardCollected'), route ? fmtReward(route.reward) : '—'),
            tag(t('local.rewardAvailable'), fmtReward(rMax)),
            tag(t('local.rewardUse'), rewardPct(route, rMax))
          ]
        ]);
    }

    stepBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { showPipelineStep(+btn.getAttribute('data-step')); });
    });
    $('stepPrev').addEventListener('click', function () { showPipelineStep(stepIdx - 1); });
    $('stepNext').addEventListener('click', function () { showPipelineStep(stepIdx + 1); });
    missionSelect.addEventListener('change', function () { showPipelineStep(stepIdx); });

    stepCanvas.addEventListener('click', function () {
      $('stepsLightboxImg').src = stepCanvas.toDataURL('image/png');
      $('stepsLightboxCap').textContent = missionLabel(currentMission()) + ' — ' + stepLabel(PIPELINE_STEPS[stepIdx]);
      stepsLightbox.hidden = false;
    });
    function closeLb() { stepsLightbox.hidden = true; }
    el.querySelectorAll('[data-lightbox-close]').forEach(function (b) { b.addEventListener('click', closeLb); });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !stepsLightbox.hidden) closeLb();
    });

    document.addEventListener('ppp:satellite-loaded', function () {
      if (!el.querySelector('[data-panel="passos"]').hidden) showPipelineStep(stepIdx);
    });
    showPipelineStep(0);

    var planCanvas = $('scene');
    var planCtx = planCanvas.getContext('2d');
    var timeline = [];
    var frameIdx = 0;
    var playing = false;
    var timer = null;

    function planMission() {
      return parseInt($('planMissionSelect').value, 10) || local.selectedMissions[0] || 1;
    }

    function rebuildTimeline() {
      var m = planMission();
      timeline = buildTimeline(local, $('mode').value, m);
      frameIdx = Math.min(frameIdx, Math.max(0, timeline.length - 1));
      updatePlanMetrics(m);
      if (globalModel) globalModel.goTo(m - 1);
      drawPlanFrame();
    }

    function updatePlanMetrics(m) {
      var metricsEl = $('planMetrics');
      var route = local.getRoute(m);
      var rMax = rewardMax(local, m);
      metricsEl.innerHTML =
        '<h3>' + t('local.metricsPlanning') + '</h3>' +
        metricRows([
          [
            tag(t('local.budget'), fmtKm(local.meta.Qkm || 100)),
            tag(t('local.travelCost'), route ? fmtKm(route.costTravelKm) : '—'),
            tag(t('local.patrolCost'), route ? fmtKm(route.costPatrolKm) : '—')
          ],
          [
            tag(t('local.rewardAvailable'), fmtReward(rMax)),
            tag(t('local.rewardCollected'), route ? fmtReward(route.reward) : '—'),
            tag(t('local.rewardUse'), rewardPct(route, rMax))
          ]
        ]);
    }

    function drawAlnsWeights(m, frame) {
      var destroyCanvas = $('destroyWeightsCanvas');
      var repairCanvas = $('repairWeightsCanvas');
      var copy = $('alnsWeightsCopy');
      if (!destroyCanvas || !repairCanvas) return;

      var detail = frame && frame.alnsDetail ? frame.alnsDetail : local.getAlnsDetailedReplan(m);
      if (!detail || !detail.iterations || !detail.iterations.length) {
        [destroyCanvas, repairCanvas].forEach(function (canvas) {
          var c = canvas.getContext('2d');
          c.clearRect(0, 0, canvas.width, canvas.height);
          c.fillStyle = '#0b0e12';
          c.fillRect(0, 0, canvas.width, canvas.height);
          c.fillStyle = 'rgba(244,239,231,.72)';
          c.font = '12px JetBrains Mono, monospace';
          c.fillText(t('local.noDetailedAlns'), 14, 34);
        });
        if (copy) copy.textContent = t('local.noWeights');
        return;
      }

      var iters = detail.iterations;
      var curIt = frame && frame.alnsIter ? frame.alnsIter.it : iters[iters.length - 1].it;
      var curIdx = Math.max(0, Math.min(iters.length - 1, curIt - 1));
      var dColors = ['#ff5d5d', '#ff9a58', '#f2d65c', '#d47dff'];
      var rColors = ['#56d6c9', '#8cc8ff', '#7bd88f', '#b99cff'];

      function drawOne(canvas, title, names, kind, colors) {
        var c = canvas.getContext('2d');
        var w = canvas.width, h = canvas.height;
        c.clearRect(0, 0, w, h);
        c.fillStyle = '#0b0e12';
        c.fillRect(0, 0, w, h);

        var maxW = 0;
        var nOps = names.length || ((kind === 'destroy' ? iters[0].weightsDestroyAfter : iters[0].weightsRepairAfter) || []).length;
        for (var i = 0; i < iters.length; i++) {
          var arr0 = kind === 'destroy' ? iters[i].weightsDestroyAfter : iters[i].weightsRepairAfter;
          for (var k = 0; k < nOps; k++) if (arr0 && arr0[k] > maxW) maxW = arr0[k];
        }
        if (!maxW) maxW = 1;

        var padL = 34, padR = 12, padT = 26, padB = 24;
        var plotW = w - padL - padR;
        var plotH = h - padT - padB;
        function x(i) { return padL + (iters.length <= 1 ? 0 : i / (iters.length - 1) * plotW); }
        function y(v) { return padT + plotH - (v / maxW) * plotH; }

        c.fillStyle = '#f4efe7';
        c.font = '700 12px Archivo, sans-serif';
        c.fillText(title, padL, 16);
        c.strokeStyle = 'rgba(244,239,231,.14)';
        c.lineWidth = 1;
        c.strokeRect(padL, padT, plotW, plotH);

        for (var op = 0; op < nOps; op++) {
          c.save();
          c.strokeStyle = colors[op % colors.length];
          c.lineWidth = 1.55;
          c.beginPath();
          for (var j = 0; j < iters.length; j++) {
            var arr = kind === 'destroy' ? iters[j].weightsDestroyAfter : iters[j].weightsRepairAfter;
            var v = arr && arr[op] != null ? arr[op] : 0;
            if (j === 0) c.moveTo(x(j), y(v)); else c.lineTo(x(j), y(v));
          }
          c.stroke();
          c.restore();
        }

        c.strokeStyle = 'rgba(255,255,255,.72)';
        c.setLineDash([4, 4]);
        c.beginPath();
        c.moveTo(x(curIdx), padT);
        c.lineTo(x(curIdx), padT + plotH);
        c.stroke();
        c.setLineDash([]);

        c.font = '10px JetBrains Mono, monospace';
        c.fillStyle = 'rgba(244,239,231,.68)';
        c.fillText('iter ' + curIt, padL, h - 7);

        var lx = w - 210, ly = 13;
        for (var li = 0; li < nOps; li++) {
          c.fillStyle = colors[li % colors.length];
          c.fillRect(lx, ly + li * 13 - 7, 8, 8);
          c.fillStyle = 'rgba(244,239,231,.72)';
          c.fillText((names[li] || ('op' + (li + 1))).replace(/^destroy_|^repair_/, ''), lx + 12, ly + li * 13);
        }
      }

      drawOne(destroyCanvas, t('local.destroyWeightsTitle'), detail.operatorDestroyNames || [], 'destroy', dColors);
      drawOne(repairCanvas, t('local.repairWeightsTitle'), detail.operatorRepairNames || [], 'repair', rColors);

      if (copy) {
        var current = frame && frame.alnsIter ? frame.alnsIter : iters[curIdx];
        copy.textContent = tf('local.alnsWeightsCopy', {
          it: current.it,
          destroy: current.opDName,
          repair: current.opRName,
          reward: fmtReward(current.rewardBest)
        });
      }
    }

    function drawPlanFrame() {
      var m = planMission();
      var f = timeline[frameIdx] || {};
      f.tick = performance.now();
      P.renderLocal.drawScene(planCtx, local, m, f, planCanvas.width, planCanvas.height);

      var ph = PHASES[f.phase] || PHASES.initial;
      $('stageBox').style.borderColor = ph.color;
      $('phaseChip').textContent = ph.labelKey ? t(ph.labelKey) : '';
      $('phaseChip').style.borderColor = ph.color;
      $('phaseChip').style.color = ph.color;
      $('phaseCopy').textContent = f.text || '';
      $('status').textContent = t('local.frame') + ' ' + (frameIdx + 1) + ' / ' + timeline.length;

      var mode = $('mode').value;
      var st = f.rolling;
      var rs = f.alnsResult;
      var it = f.alnsIter;
      var weightsCard = $('weightsCard');
      if (weightsCard) weightsCard.hidden = mode !== 'alns';
      if (mode === 'alns') drawAlnsWeights(m, f);

      if (mode === 'both') {
        $('opTitle').textContent = t('local.rhStep') + ' ' + (f.rhStep != null ? f.rhStep : '—') +
          (f.alnsStep != null ? ' · ALNS ' + (it ? ('iter ' + it.it) : (f.alnsStep > 0 ? t('local.done') : t('local.calling'))) : '');
        $('opCopy').innerHTML = it ?
          ('<b>' + it.opDName + '</b><br><b>' + it.opRName + '</b><br>Melhor recompensa = <b>' + fmtReward(it.rewardBest) + '</b>') :
          (rs ? ('R_best = <b>' + fmtReward(rs.finalReward) + '</b><br>' + t('local.totalCost') + ' = <b>' + fmtKm(rs.finalCostKm) + '</b>') : t('local.replanWaiting'));
      } else if (mode === 'alns') {
        $('opTitle').textContent = it ? ('ALNS iter ' + it.it + '/' + (f.totalAlns || '?')) :
          ('Replan ' + (f.alnsStep != null ? f.alnsStep : '—') + '/' + (f.totalAlns || '?'));
        $('opCopy').innerHTML = it ?
          (t('local.destroy') + ': <b>' + it.opDName + '</b><br>' + t('local.repair') + ': <b>' + it.opRName +
           '</b><br>' + t('local.accept') + ': <b>' + (it.accept ? t('local.yes') : t('local.no')) + '</b>') :
          (rs ? ('R_best = <b>' + fmtReward(rs.finalReward) + '</b><br>' + (rs.nIterations || 200) + ' iter ALNS') : t('local.callingAlns'));
      } else {
        $('opTitle').textContent = t('local.rollingTitle');
        if (st) {
          $('opCopy').innerHTML = t('local.step') + ' <b>' + st.step + '</b> · Q rem <b>' + (st.QremKm != null ? st.QremKm.toFixed(1) : '?') + ' km</b>';
        }
      }
    }

    function planDuration() {
      var s = +$('speed').value;
      if (s === 0) return 16;
      var f = timeline[frameIdx] || {};
      var isAlnsFrame = $('mode').value === 'alns' || !!f.alnsIter || !!f.alnsSeq;
      var nativeMultiplier = 1;
      if (isAlnsFrame) nativeMultiplier = $('mode').value === 'both' ? 8 : 4;
      return Math.max(16, Math.round(760 / (s * nativeMultiplier)));
    }

    function stop() {
      playing = false;
      if (timer) clearTimeout(timer);
      timer = null;
      $('play').textContent = t('local.play');
    }

    function nextFrame() {
      if (!playing) return;
      if (frameIdx >= timeline.length - 1) { stop(); return; }
      frameIdx++;
      drawPlanFrame();
      timer = setTimeout(nextFrame, planDuration());
    }

    $('play').addEventListener('click', function () {
      if (playing) { stop(); return; }
      playing = true;
      $('play').textContent = t('local.pause');
      timer = setTimeout(nextFrame, planDuration());
    });
    $('reset').addEventListener('click', function () { stop(); frameIdx = 0; drawPlanFrame(); });
    $('mode').addEventListener('change', function () { stop(); rebuildTimeline(); });
    $('speed').addEventListener('change', function () {
      if (+$('speed').value === 0 && playing) {
        while (frameIdx < timeline.length - 1) frameIdx++;
        drawPlanFrame();
        stop();
      }
    });
    $('planMissionSelect').addEventListener('change', function () {
      stop(); frameIdx = 0; rebuildTimeline();
    });

    el.querySelectorAll('[data-subtab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-subtab');
        el.querySelectorAll('[data-subtab]').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        el.querySelectorAll('[data-panel]').forEach(function (panel) {
          panel.hidden = panel.getAttribute('data-panel') !== target;
        });
        if (target === 'passos') { stop(); showPipelineStep(stepIdx); }
        if (target === 'planejamento') { rebuildTimeline(); }
      });
    });

    el._cleanup = function () { stop(); };
  }

  P.registerTab({
    id: 'local',
    label: 'Missão local',
    labelKey: 'tabs.local',
    soon: false,
    mount: mount,
    unmount: function (el) { if (el._cleanup) el._cleanup(); }
  });
})(window.PPP);
