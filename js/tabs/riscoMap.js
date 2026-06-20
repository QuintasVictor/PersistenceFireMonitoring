/* tabs/riscoMap.js - aba "Mapa de risco"
 *
 * Prancha estatica do MCDA. Mostra a constelacao dos mapas auxiliares a
 * esquerda e o mapa de risco a direita, em um unico frame.
 */
window.PPP = window.PPP || {};
(function (P) {
  var fmt = P.fmt;
  function t(key) { return P.t ? P.t(key) : key; }
  function translated(key, fallback) {
    var value = t(key);
    return value === key ? fallback : value;
  }

  var GROUP_LABELS = {
    topo: 'Topogr&aacute;fico',
    meteo: 'Meteorol&oacute;gico',
    fuel: 'Combust&iacute;vel'
  };
  var LABEL_HTML = {
    T1: 'Eleva&ccedil;&atilde;o',
    T2: 'Declividade',
    T3: 'Exposi&ccedil;&atilde;o',
    T4: 'Uso e cobertura',
    M1: 'Precipita&ccedil;&atilde;o',
    M2: 'Temp. superf&iacute;cie',
    M3: 'Temp. do ar',
    M4: 'Vento',
    M5: 'Umidade relativa',
    V1: 'FVC',
    V2: 'NDVI',
    V3: 'Tipo de vegeta&ccedil;&atilde;o',
    V4: 'Altura do dossel'
  };
  var LABEL_TEXT = {
    T1: 'Elevacao',
    T2: 'Declividade',
    T3: 'Exposicao',
    T4: 'Uso e cobertura',
    M1: 'Precipitacao',
    M2: 'Temp. superficie',
    M3: 'Temp. do ar',
    M4: 'Vento',
    M5: 'Umidade relativa',
    V1: 'FVC',
    V2: 'NDVI',
    V3: 'Tipo de vegetacao',
    V4: 'Altura do dossel'
  };

  function fallbackCatalog() {
    return {
      formula: 'R(i) = &Sigma;<sub>k</sub> w<sub>k</sub> &middot; x<sub>k</sub>(i)',
      groups: [
        {
          key: 'topo',
          weight: 0.237,
          items: [
            { code: 'T1', weight: 0.138, image: 'data/mapas/topograficos/1_Elevacao_T1.png' },
            { code: 'T2', weight: 0.054, image: 'data/mapas/topograficos/2_Declividade_T2.png' },
            { code: 'T3', weight: 0.045, image: 'data/mapas/topograficos/3_Exposicao_T3.png' }
          ],
          mask: { code: 'T4', image: 'data/mapas/topograficos/4_Uso_e_cobertura_T4.png' }
        },
        {
          key: 'meteo',
          weight: 0.262,
          items: [
            { code: 'M1', weight: 0.064, image: 'data/mapas/metereologicos/5_Precipitacao_M1.png' },
            { code: 'M2', weight: 0.055, image: 'data/mapas/metereologicos/6_Temp_superficie_M2.png' },
            { code: 'M3', weight: 0.028, image: 'data/mapas/metereologicos/7_Temp_ar_M3.png' },
            { code: 'M4', weight: 0.057, image: 'data/mapas/metereologicos/8_Vento_M4.png' },
            { code: 'M5', weight: 0.058, image: 'data/mapas/metereologicos/9_Umidade_M5.png' }
          ]
        },
        {
          key: 'fuel',
          weight: 0.501,
          items: [
            { code: 'V1', weight: 0.094, image: 'data/mapas/combustivel/10_FVC_V1.png' },
            { code: 'V2', weight: 0.103, image: 'data/mapas/combustivel/11_NDVI_V2.png' },
            { code: 'V3', weight: 0.168, image: 'data/mapas/combustivel/12_Tipo_veg_V3.png' },
            { code: 'V4', weight: 0.136, image: 'data/mapas/combustivel/13_Alt_dossel_V4.png' }
          ]
        }
      ],
      result: { label: 'Mapa de risco', image: 'data/mapas/mcda.png' },
      validation: { label: 'Frequencia de queimadas', image: 'data/mapas/frequencia.png' }
    };
  }

  function getCatalog() {
    var base = window.PPP_MAPAS || fallbackCatalog();
    if (!base.groups || !base.groups.length) base = fallbackCatalog();
    if (!base.formula) base.formula = 'R(i) = &Sigma;<sub>k</sub> w<sub>k</sub> &middot; x<sub>k</sub>(i)';
    return base;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }
  function labelHtml(item) {
    return translated('risk.indicator.' + item.code, LABEL_HTML[item.code] || esc(item.label || item.code));
  }
  function labelText(item) {
    return translated('risk.indicator.' + item.code, LABEL_TEXT[item.code] || String(item.label || item.code || ''));
  }
  function groupLabel(group) {
    return translated('risk.group.' + group.key, GROUP_LABELS[group.key] || esc(group.label || group.key));
  }
  function weight(v) {
    return fmt(v, 3);
  }
  function weightLine(item) {
    return item.weight == null ? '&Omega;' : 'w=' + weight(item.weight);
  }
  function imageOf(item) {
    return item && item.image ? item.image : '';
  }

  function makeTile(item, extraClass) {
    var title = item.code + ' - ' + labelText(item) + ' - ' + (item.weight == null ? t('risk.mask') : t('risk.weight') + ' ' + weight(item.weight));
    return '' +
      '<button class="risk-visual risk-tile ' + (extraClass || '') + '" type="button" data-img="' + esc(imageOf(item)) + '" data-title="' + esc(title) + '" title="' + esc(title) + '">' +
      '  <span class="risk-media">' +
      '    <img alt="' + esc(title) + '" data-src="' + esc(imageOf(item)) + '" loading="lazy">' +
      '    <span class="risk-fallback"><b>' + esc(item.code) + '</b><small>' + t('risk.assetMissing') + '</small></span>' +
      '  </span>' +
      '  <span class="risk-caption"><b>' + esc(item.code) + '</b><span>' + labelHtml(item) + '</span><em>' + weightLine(item) + '</em></span>' +
      '</button>';
  }

  function rowHtml(items) {
    return '<div class="risk-rowline">' + items.map(function (item, idx) {
      return (idx ? '<span class="risk-plus">+</span>' : '') + makeTile(item, item.weight == null ? 'risk-tile-mask' : '');
    }).join('') + '</div>';
  }

  function makeGroup(group) {
    var items = group.items.slice();
    if (group.mask) items.push({
      code: group.mask.code,
      label: group.mask.label,
      image: group.mask.image,
      weight: null
    });
    var rows = [];
    for (var i = 0; i < items.length; i += 3) rows.push(items.slice(i, i + 3));
    return '' +
      '<section class="risk-group-block">' +
      '  <div class="risk-group-title"><b>' + groupLabel(group) + '</b><span>&Sigma;=' + weight(group.weight) + '</span></div>' +
      rows.map(rowHtml).join('') +
      '</section>';
  }

  function makeResult(catalog) {
    var result = catalog.result || fallbackCatalog().result;
    var validation = catalog.validation || fallbackCatalog().validation;
    var resultItem = { code: 'MCDA', label: t('risk.result'), image: result.image, weight: null };
    var validationItem = { code: 'VAL', label: t('risk.validation'), image: validation.image, weight: null };
    var resultTitle = t('risk.result.title');
    var validationTitle = t('risk.validation');
    return '' +
      '<aside class="risk-result-stack">' +
      '  <button class="risk-visual risk-result-card" type="button" data-img="' + esc(imageOf(resultItem)) + '" data-title="' + esc(resultTitle) + '" title="' + esc(resultTitle) + '">' +
      '    <span class="risk-result-media"><img alt="' + esc(resultTitle) + '" data-src="' + esc(imageOf(resultItem)) + '" loading="lazy"><span class="risk-fallback"><b>MCDA</b><small>' + t('risk.assetMissing') + '</small></span></span>' +
      '    <span class="risk-result-label">' + t('risk.result') + '</span>' +
      '  </button>' +
      '  <button class="risk-visual risk-validation-card" type="button" data-img="' + esc(imageOf(validationItem)) + '" data-title="' + esc(validationTitle) + '" title="' + esc(validationTitle) + '">' +
      '    <span class="risk-validation-media"><img alt="' + esc(validationTitle) + '" data-src="' + esc(imageOf(validationItem)) + '" loading="lazy"><span class="risk-fallback"><b>VAL</b><small>' + t('risk.assetMissing') + '</small></span></span>' +
      '    <span>' + t('risk.frequency.short') + '</span>' +
      '  </button>' +
      '</aside>';
  }

  function makeMainPanel(catalog) {
    return '' +
      '<div class="risk-board">' +
      '  <div class="risk-constellation">' + catalog.groups.map(makeGroup).join('') + '</div>' +
      makeResult(catalog) +
      '</div>';
  }

  function wireImages(root) {
    var imgs = root.querySelectorAll('img[data-src]');
    imgs.forEach(function (img) {
      if (img.dataset.bound === '1') return;
      img.dataset.bound = '1';
      var box = img.closest('.risk-visual');
      img.addEventListener('load', function () { if (box) box.classList.add('loaded'); });
      img.addEventListener('error', function () { if (box) box.classList.add('missing'); });
      img.src = img.dataset.src;
      if (img.complete && img.naturalWidth > 0 && box) box.classList.add('loaded');
    });
  }

  function wireLightbox(root) {
    var lightbox = root.querySelector('[data-el="lightbox"]');
    var img = root.querySelector('[data-el="lightboxImg"]');
    var cap = root.querySelector('[data-el="lightboxCap"]');
    function close() {
      lightbox.hidden = true;
      img.removeAttribute('src');
    }
    root.querySelectorAll('.risk-visual[data-img]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (!button.dataset.img) return;
        img.src = button.dataset.img;
        img.alt = button.dataset.title || t('risk.lightbox.mapAlt');
        cap.textContent = button.dataset.title || t('risk.lightbox.mapAlt');
        lightbox.hidden = false;
      });
    });
    root.querySelectorAll('[data-lightbox-close]').forEach(function (button) {
      button.addEventListener('click', close);
    });
    root.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !lightbox.hidden) close();
    });
  }

  function mount(el) {
    var catalog = getCatalog();
    el.innerHTML =
      '<section class="risk-shell panel">' +
      '  <div class="risk-topbar">' +
      '    <div><h2>' + t('risk.title') + '</h2><div class="risk-formula-line">' + catalog.formula + '</div></div>' +
      '  </div>' +
      makeMainPanel(catalog) +
      '</section>' +
      '<div class="risk-lightbox" data-el="lightbox" hidden>' +
      '  <button class="risk-lightbox-backdrop" type="button" data-lightbox-close aria-label="' + t('risk.lightbox.closeExpansion') + '"></button>' +
      '  <figure class="risk-lightbox-frame">' +
      '    <button class="risk-lightbox-close" type="button" data-lightbox-close>' + t('risk.lightbox.close') + '</button>' +
      '    <img data-el="lightboxImg" alt="' + t('risk.lightbox.mapAlt') + '">' +
      '    <figcaption data-el="lightboxCap"></figcaption>' +
      '  </figure>' +
      '</div>';

    wireImages(el);
    wireLightbox(el);
  }

  P.registerTab({
    id: 'risco',
    label: 'Mapa de risco',
    labelKey: 'tabs.risk',
    soon: false,
    mount: function (el) {
      mount(el);
    }
  });
})(window.PPP);
