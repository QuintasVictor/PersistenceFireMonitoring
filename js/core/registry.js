/* registry.js — núcleo do showcase (namespace PPP)
 *
 * Módulo central mínimo: registro de abas + acesso aos dados + barramento
 * de eventos. Carregado ANTES de qualquer aba. Usa scripts clássicos (sem
 * ES modules) para funcionar via file:// sem servidor local.
 *
 * Uma aba registra-se com:
 *   PPP.registerTab({ id, label, soon?, mount(el, ctx), unmount?() })
 *     id    — slug único (rota)
 *     label — texto no menu superior
 *     soon  — true => aparece desabilitada ("em breve")
 *     mount(el, ctx) — desenha a aba dentro de `el`; ctx = { data, model, fmt }
 *     unmount() — limpeza opcional (timers, listeners)
 */
window.PPP = window.PPP || {};
(function (P) {
  P.tabs = [];
  P.registerTab = function (def) {
    if (!def || !def.id) throw new Error('registerTab: id obrigatório');
    P.tabs.push(def);
  };
  P.getTab = function (id) { return P.tabs.find(function (t) { return t.id === id; }); };

  /* dados exportados do MATLAB (window.PPP_DATA) */
  P.getData = function () { return window.PPP_DATA || null; };
  P.hasData = function () { return !!window.PPP_DATA && !!window.PPP_DATA.missions; };

  /* barramento de eventos simples */
  P.bus = {
    _l: {},
    on: function (e, f) { (this._l[e] = this._l[e] || []).push(f); },
    emit: function (e, d) { (this._l[e] || []).forEach(function (f) { f(d); }); }
  };

  /* formatação pt-BR centralizada */
  P.fmt = function (x, n) {
    if (x === null || x === undefined || !isFinite(x)) return '—';
    return x.toLocaleString('pt-BR', { minimumFractionDigits: n, maximumFractionDigits: n });
  };
  P.fmtSci = function (x) {
    if (!isFinite(x) || x === 0) return '0';
    if (x >= 1e-3) return P.fmt(x, 4);
    return x.toExponential(1).replace('e', '·10^').replace('+', '');
  };
})(window.PPP);
