/* tabs/integracao.js — aba "Integração entre camadas"
 *
 * Mostra o acoplamento entre F3 (mapa de risco), F1 (controlador global) e F2
 * (planejador local), com o ciclo fechando no estado da campanha.
 * Três subabas: Ciclo operacional, Contratos, Reintegração por missão.
 */
window.PPP = window.PPP || {};
(function (P) {
  var CYCLE_HTML =
    '<div class="integ-flowmap">' +
    '  <div class="integ-flowbox" data-go="risco" role="link" tabindex="0">' +
    '    <span class="flowtag">Mapa de risco</span>' +
    '    <strong>OUT: mapa de risco</strong>' +
    '    <span class="flowsub">risco espacial h e alvo w</span>' +
    '  </div>' +
    '  <div class="integ-flowedge">→ <span>entra na campanha</span></div>' +
    '  <div class="integ-flowbox" data-go="campanha" role="link" tabindex="0">' +
    '    <span class="flowtag">Campanha</span>' +
    '    <strong>Campanha de 100 rotas</strong>' +
    '    <span class="flowsub">estado p<sub>m</sub>, d<sub>m</sub>, TV</span>' +
    '  </div>' +
    '  <div class="integ-flowedge">↓ <span>controlador global calcula &omega;</span></div>' +
    '  <div class="integ-flowbox integ-flowbox-global" data-go="campanha" role="link" tabindex="0">' +
    '    <span class="flowtag">Controlador global</span>' +
    '    <strong>Calcula &omega;, d<sub>m</sub> e r<sub>m</sub></strong>' +
    '    <span class="flowsub">or&ccedil;amento Q = 100 km</span>' +
    '  </div>' +
    '  <div class="integ-flowedge">→ <span>envia recompensa</span></div>' +
    '  <div class="integ-flowbox" data-go="local" role="link" tabindex="0">' +
    '    <span class="flowtag">Miss&atilde;o local</span>' +
    '    <strong>Planeja rota local</strong>' +
    '    <span class="flowsub">ALNS + rolling horizon</span>' +
    '  </div>' +
    '  <div class="integ-flowedge integ-flowreturn">← <span>rota executada retorna ao controlador global</span></div>' +
    '  <div class="integ-flowedge integ-flowcampaign">↑ <span>controlador global atualiza a campanha de 100 rotas</span></div>' +
    '</div>';

  var CONTRACTS_HTML =
    '<div class="integ-contracts">' +
    '  <div class="integ-contract">' +
    '    <div class="integ-contract-head"><span class="flowtag">F3</span> <strong>Mapa de risco</strong></div>' +
    '    <div class="integ-contract-row"><span class="integ-clabel">consome</span><span>dados topográficos, meteorológicos, combustível</span></div>' +
    '    <div class="integ-contract-row"><span class="integ-clabel">transforma</span><span>MCDA multicritério com 12 indicadores ponderados</span></div>' +
    '    <div class="integ-contract-row"><span class="integ-clabel">produz</span><span><code>h</code> (risco espacial) e <code>w</code> (alvo de vistoria)</span></div>' +
    '  </div>' +
    '  <div class="integ-contract">' +
    '    <div class="integ-contract-head"><span class="flowtag">F1</span> <strong>Controlador global</strong></div>' +
    '    <div class="integ-contract-row"><span class="integ-clabel">consome</span><span><code>w</code>, <code>p<sub>m</sub></code>, <code>h</code></span></div>' +
    '    <div class="integ-contract-row"><span class="integ-clabel">transforma</span><span>d<sub>m</sub> = [w − p]<sub>+</sub> ; r<sub>m</sub> = d<sup>α</sup> h<sup>β</sup> + ε</span></div>' +
    '    <div class="integ-contract-row"><span class="integ-clabel">produz</span><span><code>d<sub>m</sub></code>, <code>r<sub>m</sub></code>, Q = 100 km</span></div>' +
    '  </div>' +
    '  <div class="integ-contract">' +
    '    <div class="integ-contract-head"><span class="flowtag">F2</span> <strong>Planejador local</strong></div>' +
    '    <div class="integ-contract-row"><span class="integ-clabel">consome</span><span><code>r<sub>m</sub></code>, Q (orçamento)</span></div>' +
    '    <div class="integ-contract-row"><span class="integ-clabel">transforma</span><span>ALNS + rolling horizon sobre grafo de navegação</span></div>' +
    '    <div class="integ-contract-row"><span class="integ-clabel">produz</span><span>rota, pixels cobertos, custo em km</span></div>' +
    '  </div>' +
    '  <div class="integ-contract">' +
    '    <div class="integ-contract-head"><span class="flowtag">↺</span> <strong>Reintegração</strong></div>' +
    '    <div class="integ-contract-row"><span class="integ-clabel">consome</span><span>rota executada, pixels vistoriados</span></div>' +
    '    <div class="integ-contract-row"><span class="integ-clabel">transforma</span><span>marca pixels cobertos, recalcula persistência</span></div>' +
    '    <div class="integ-contract-row"><span class="integ-clabel">produz</span><span><code>p<sub>m</sub></code> atualizado, <code>d<sub>m</sub></code>, TV, cobertura</span></div>' +
    '  </div>' +
    '</div>';

  var REINTEG_STEPS = [
    { tag: 'm−1', label: 'Estado anterior', sub: 'p<sub>m-1</sub>, d<sub>m-1</sub>' },
    { tag: '→', label: 'Calcula déficit', sub: 'd<sub>m</sub> = [w − p]<sub>+</sub>' },
    { tag: '→', label: 'Gera recompensa', sub: 'r<sub>m</sub> = d<sup>α</sup> h<sup>β</sup>' },
    { tag: '→', label: 'Planeja rota', sub: 'ALNS + RH sob Q' },
    { tag: '→', label: 'Executa vistoria', sub: 'UAV percorre rota' },
    { tag: '→', label: 'Reintegra p<sub>m</sub>', sub: 'pixels → p<sub>m</sub>' },
    { tag: 'm', label: 'Novo estado', sub: 'próxima missão' }
  ];

  var REINTEG_HTML = (function () {
    var h = '<div class="integ-timeline">';
    REINTEG_STEPS.forEach(function (s, i) {
      if (i > 0) h += '<div class="integ-tl-arrow">→</div>';
      h += '<div class="integ-tl-step' + (i === 0 || i === REINTEG_STEPS.length - 1 ? ' integ-tl-endpoint' : '') + '">' +
        '<span class="integ-tl-tag">' + s.tag + '</span>' +
        '<strong>' + s.label + '</strong>' +
        '<span class="integ-tl-sub">' + s.sub + '</span>' +
        '</div>';
    });
    h += '</div>';
    h += '<div class="integ-tl-caption">' +
      'A saída do planejador (pixels vistoriados) atualiza <code>p<sub>m</sub></code>, ' +
      'fechando o ciclo: o déficit da próxima missão nasce da cobertura acumulada.' +
      '</div>';
    return h;
  })();

  var TEMPLATE =
    '<div class="integ-page">' +
    '  <div class="integ-subtabs" role="tablist" aria-label="Subabas da integração">' +
    '    <button data-subtab="ciclo" aria-pressed="true">Ciclo operacional</button>' +
    '    <button data-subtab="contratos" aria-pressed="false">Contratos entre camadas</button>' +
    '    <button data-subtab="reinteg" aria-pressed="false">Reintegração por missão</button>' +
    '  </div>' +
    '  <div class="integration-shell">' +
    '    <section class="panel integration-flow">' +
    '      <div class="head">' +
    '        <div>' +
    '          <h2>Integração entre camadas</h2>' +
    '          <p class="integration-kicker" data-el="kicker">Fluxo multimissão: mapa de risco, controlador global, missão local e campanha de 100 rotas</p>' +
    '        </div>' +
    '      </div>' +
    '      <div data-panel="ciclo">' + CYCLE_HTML + '</div>' +
    '      <div data-panel="contratos" hidden>' + CONTRACTS_HTML + '</div>' +
    '      <div data-panel="reinteg" hidden>' + REINTEG_HTML + '</div>' +
    '    </section>' +
    '  </div>' +
    '</div>';

  var KICKERS = {
    ciclo: 'Fluxo multimissão: mapa de risco, controlador global, missão local e campanha de 100 rotas',
    contratos: 'O que cada camada consome, transforma e produz',
    reinteg: 'Como uma missão fecha o ciclo e alimenta a próxima'
  };

  function build(el, ctx) {
    el.innerHTML = TEMPLATE;

    function $el(name) { return el.querySelector('[data-el="' + name + '"]'); }

    el.querySelectorAll('[data-go]').forEach(function (node) {
      node.addEventListener('click', function () {
        if (P.goTab) P.goTab(node.dataset.go);
      });
      node.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          if (P.goTab) P.goTab(node.dataset.go);
        }
      });
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
        $el('kicker').textContent = KICKERS[target] || '';
      });
    });
  }

  P.registerTab({
    id: 'integracao',
    label: 'Integração entre camadas',
    mount: function (el, ctx) {
      build(el, ctx || {});
    }
  });
})(window.PPP);
