/* tabs/areaEstudo.js - study area tab. */
window.PPP = window.PPP || {};
(function (P) {
  var MAP_URL = 'data/mapas/Mapa_Localiza%C3%A7%C3%A3o.pdf';

  function mount(el) {
    el.innerHTML =
      '<section class="study-shell">' +
      '  <div class="panel study-map-panel">' +
      '    <div class="head"><div><h2 data-i18n="study.title">Área de estudo</h2></div></div>' +
      '    <div class="study-map-frame">' +
      '      <object data="' + MAP_URL + '#toolbar=0&navpanes=0&scrollbar=0" type="application/pdf">' +
      '        <iframe src="' + MAP_URL + '#toolbar=0&navpanes=0&scrollbar=0" title="Mapa de localização do PNB" data-i18n-attr="title:study.mapTitle"></iframe>' +
      '        <a href="' + MAP_URL + '" target="_blank" rel="noopener" data-i18n="study.openMap">Abrir mapa de localização</a>' +
      '      </object>' +
      '    </div>' +
      '  </div>' +
      '  <aside class="panel study-info">' +
      '    <div class="study-eyebrow" data-i18n="study.eyebrow">Parque Nacional de Brasília</div>' +
      '    <h2 data-i18n="study.name">PNB</h2>' +
      '    <div class="study-facts">' +
      '      <div class="study-fact"><b data-i18n="study.area.value">~42,4 mil ha</b><span data-i18n="study.area.note">área protegida de Cerrado</span></div>' +
      '      <div class="study-fact"><b data-i18n="study.border.value">DF e Goiás</b><span data-i18n="study.border.note">na fronteira entre as unidades federativas</span></div>' +
      '      <div class="study-fact"><b data-i18n="study.distance.value">~10 km</b><span data-i18n="study.distance.note">do centro de Brasília</span></div>' +
      '    </div>' +
      '    <p data-i18n="study.description">O PNB é usado como área de estudo para avaliar o monitoramento preventivo orientado ao risco em uma paisagem extensa, heterogênea e operacionalmente relevante.</p>' +
      '  </aside>' +
      '</section>';
  }

  P.registerTab({
    id: 'area-estudo',
    label: 'Área de estudo',
    labelKey: 'tabs.study',
    soon: false,
    mount: mount
  });
})(window.PPP);
