/* dataLoader.js — ponte MATLAB → HTML
 *
 * Lê window.PPP_DATA (gerado por export/sc_export_web.m), valida o schema e
 * expõe CampaignModel: a campanha real reconstruída de forma INTERATIVA.
 *
 * Distribuições e mapas (por missão):
 *   - p_m (empírica) vem PRONTA do MATLAB como `postPMap` (base64 uint8), já
 *     com a regra de redundância do código ('projected_final', soma → 0,95).
 *   - d_m = [w − p_m]₊  e  r_m = d_m^α·h^β + ε  são derivados no cliente a
 *     partir de p_m (oficial), w e h — coerentes com a definição da tese.
 *   - v_m (contagem de vistorias) é acumulada dos incrementos esparsos
 *     `inc` (exato; Σ = total real de vistorias).
 * Os ESCALARES dos cartões/gráficos (déficit, TV, cobertura, massa de risco)
 * vêm prontos de `missions[*]` — números oficiais do Capítulo 4.
 *
 * Ver docs/DATA_SCHEMA.md.
 */
window.PPP = window.PPP || {};
(function (P) {

  /* decodifica base64 (uint8) — funciona via file:// */
  function b64ToBytes(s) {
    var bin = atob(s), n = bin.length, out = new Uint8Array(n);
    for (var i = 0; i < n; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function CampaignModel(data) {
    this.d = data;
    this.W = data.grid.W; this.H = data.grid.H; this.N = this.W * this.H;
    this.mask = data.grid.mask;
    this.validIdx = data.validIdx;                 // row-major 0-based (ordem dos mapas p)
    this.validList = [];
    for (var i = 0; i < this.N; i++) if (this.mask[i]) this.validList.push(i);
    this.h = data.fields.h; this.w = data.fields.w;
    this.alpha = data.meta.alpha; this.beta = data.meta.beta; this.eps = data.meta.epsilon;
    this.climP = data.clim.p;
    this.n = data.missions.length;
    this.reset();
  }

  CampaignModel.prototype.reset = function () {
    this.m = 0;
    this.v = new Float64Array(this.N); this.vTot = 0;          // contagem (incrementos)
    this.pcur = new Float64Array(this.N);                      // empírica oficial
    this.dcur = new Float64Array(this.N);
    this.rcur = new Float64Array(this.N);
    this._deriveFromP();                                       // p=0 -> d=w, r=w^a.h^b
  };

  /* d_m = [w − p_m]₊ ; r_m = d_m^α·h^β + ε  (sobre pixels válidos) */
  CampaignModel.prototype._deriveFromP = function () {
    var w = this.w, h = this.h, p = this.pcur, df = this.dcur, r = this.rcur;
    var a = this.alpha, b = this.beta, eps = this.eps;
    for (var k = 0; k < this.validList.length; k++) {
      var i = this.validList[k];
      var dd = w[i] - p[i]; if (dd < 0) dd = 0;
      df[i] = dd;
      r[i] = Math.pow(dd, a) * Math.pow(h[i], b) + eps;
    }
  };

  /* carrega a distribuição empírica oficial da missão k em pcur */
  CampaignModel.prototype._loadP = function (k) {
    var bytes = b64ToBytes(this.d.missions[k - 1].p);
    var vidx = this.validIdx, sc = this.climP / 255;
    this.pcur = new Float64Array(this.N);
    for (var j = 0; j < bytes.length; j++) this.pcur[vidx[j]] = bytes[j] * sc;
  };

  /* aplica a missão k (1..n): acumula vistorias + carrega p oficial + deriva d,r */
  CampaignModel.prototype.applyMission = function (k) {
    var mis = this.d.missions[k - 1];
    var idx = mis.inc.idx, c = mis.inc.c;
    for (var j = 0; j < idx.length; j++) { this.v[idx[j]] += c[j]; this.vTot += c[j]; }
    this._loadP(k);
    this._deriveFromP();
    this.m = k;
    return mis;
  };

  /* salta para a missão k reproduzindo a sequência (avançar/retroceder) */
  CampaignModel.prototype.goTo = function (k) {
    k = Math.max(0, Math.min(this.n, k));
    if (k < this.m) this.reset();
    for (var i = this.m + 1; i <= k; i++) this.applyMission(i);
    return this.metricsAt(k);
  };

  CampaignModel.prototype.field = function (L) {
    return L === 'h' ? this.h : L === 'r' ? this.rcur : L === 'd' ? this.dcur
      : L === 'v' ? this.v : this.pcur;
  };

  CampaignModel.prototype.metricsAt = function (k) {
    return k <= 0 ? null : this.d.missions[k - 1];
  };

  CampaignModel.prototype.initialTV = function () {
    var sum = 0;
    for (var k = 0; k < this.validList.length; k++) {
      sum += Math.abs(this.w[this.validList[k]]);
    }
    return 0.5 * sum;
  };

  CampaignModel.prototype.clim = function (L) {
    var c = this.d.clim;
    return L === 'h' ? [0, c.h || 1] : L === 'r' ? [0, c.r] : L === 'd' ? [0, c.d]
      : L === 'v' ? [0, c.v] : [0, c.p];
  };

  /* ---------- validação leve do schema ---------- */
  function validate(data) {
    if (!data) return 'PPP_DATA ausente';
    var req = ['meta', 'grid', 'fields', 'missions', 'clim', 'colormaps', 'labels', 'validIdx'];
    for (var i = 0; i < req.length; i++) if (!data[req[i]]) return 'campo ausente: ' + req[i];
    if (!data.grid.W || !data.grid.H) return 'grid sem dimensões';
    if (!data.missions.length) return 'sem missões';
    if (!data.missions[0].p) return 'missões sem mapa p (re-exporte)';
    return null;
  }

  P.dataLoader = {
    load: function () {
      var data = P.getData();
      var err = validate(data);
      if (err) return { ok: false, error: err };
      try {
        return { ok: true, model: new CampaignModel(data), data: data };
      } catch (e) {
        return { ok: false, error: String(e && e.message || e) };
      }
    }
  };
  P.CampaignModel = CampaignModel;
})(window.PPP);
