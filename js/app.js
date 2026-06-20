/* app.js - showcase boot and tab orchestration. */
(function (P) {
  'use strict';

  function buildNav(navEl, viewEl, ctx) {
    var current = null;
    var currentDef = null;

    function tabLabel(def) {
      var label = def.labelKey && P.t ? P.t(def.labelKey) : def.label;
      return label + (def.soon ? '<span class="soon">' + (P.t ? P.t('app.soon') : 'em breve') + '</span>' : '');
    }

    function refreshNavLabels() {
      navEl.querySelectorAll('button').forEach(function (b) {
        var def = P.getTab(b.dataset.id);
        if (def) b.innerHTML = tabLabel(def);
      });
    }

    function mount(def) {
      if (currentDef && currentDef.unmount) currentDef.unmount(viewEl);
      viewEl.innerHTML = '';
      currentDef = def;
      navEl.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-current', b.dataset.id === def.id ? 'true' : 'false');
      });
      def.mount(viewEl, ctx);
      if (P.applyI18n) P.applyI18n(viewEl);
      current = def.id;
    }

    P.tabs.forEach(function (def) {
      var b = document.createElement('button');
      b.dataset.id = def.id;
      b.innerHTML = tabLabel(def);
      b.addEventListener('click', function () { mount(def); });
      navEl.appendChild(b);
    });

    var first = P.tabs.filter(function (t) { return !t.soon; })[0] || P.tabs[0];
    if (first) mount(first);

    P.goTab = function (id) {
      var d = P.getTab(id);
      if (d) mount(d);
    };

    P.bus.on('i18n:change', function () {
      refreshNavLabels();
      if (currentDef) mount(currentDef);
    });

    return function () { return current; };
  }

  function setupFullscreen() {
    var btn = document.getElementById('fullscreenToggle');
    if (!btn || !document.documentElement.requestFullscreen) {
      if (btn) btn.hidden = true;
      return;
    }

    function syncLabel() {
      btn.textContent = document.fullscreenElement ?
        (P.t ? P.t('app.fullscreen.exit') : 'Sair da tela cheia') :
        (P.t ? P.t('app.fullscreen.enter') : 'Tela cheia');
    }

    btn.addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    });
    document.addEventListener('fullscreenchange', syncLabel);
    if (P.bus && P.bus.on) P.bus.on('i18n:change', syncLabel);
    syncLabel();
  }

  function setupLanguageToggle() {
    var buttons = document.querySelectorAll('[data-lang]');
    if (!buttons.length || !P.setLang) return;

    function sync() {
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.lang === P.lang ? 'true' : 'false');
      });
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        P.setLang(b.dataset.lang);
        sync();
      });
    });
    if (P.bus && P.bus.on) P.bus.on('i18n:change', sync);
    sync();
  }

  function banner(msg) {
    var b = document.createElement('div');
    b.className = 'banner';
    b.innerHTML = '<b>' + (P.t ? P.t('app.dataMissing.title') : 'Dados da campanha não carregados.') + '</b> ' + msg;
    return b;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var navEl = document.getElementById('nav');
    var viewEl = document.getElementById('view');
    var headEl = document.getElementById('dataBanner');

    var loaded = P.dataLoader.load();
    var ctx = { data: null, model: null, fmt: P.fmt };

    if (loaded.ok) {
      ctx.data = loaded.data;
      ctx.model = loaded.model;
    } else {
      headEl.appendChild(banner(P.tf ? P.tf('app.dataMissing.body', { error: loaded.error }) :
        'Execute <code>export/sc_export_web.m</code> no MATLAB para gerar ' +
        '<code>webapp/data/campanha_data.js</code>. Motivo: ' + loaded.error + '.'));
    }

    if (P.applyI18n) P.applyI18n(document);
    setupLanguageToggle();
    setupFullscreen();
    buildNav(navEl, viewEl, ctx);
  });
})(window.PPP);
