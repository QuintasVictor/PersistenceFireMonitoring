/* colormaps.js — colormaps do ImageLab como funções RGB
 *
 * As LUTs (256×3, 0–255) são EXPORTADAS do MATLAB em PPP_DATA.colormaps,
 * garantindo correspondência exata com ilab_var_colormap:
 *   risk→turbo · reward→plasma · deficit→summer · visits→cool · empirical→viridis
 *
 * Fallback: se uma LUT faltar, usa turbo aproximado para não quebrar a UI.
 */
window.PPP = window.PPP || {};
(function (P) {
  function makeRamp(lut) {
    var n = lut.length - 1;
    return function (t) {
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      var x = t * n, i = Math.min(n - 1, x | 0), f = x - i;
      var A = lut[i], B = lut[i + 1];
      return [
        (A[0] + (B[0] - A[0]) * f) | 0,
        (A[1] + (B[1] - A[1]) * f) | 0,
        (A[2] + (B[2] - A[2]) * f) | 0
      ];
    };
  }

  /* turbo aproximado (fallback apenas) */
  var TURBO_FALLBACK = [[48, 18, 59], [70, 134, 251], [27, 229, 181],
    [165, 254, 60], [251, 154, 6], [180, 4, 38]];

  P.colormaps = {
    makeRamp: makeRamp,
    /* monta o dicionário de rampas por código de camada */
    build: function (data) {
      var cm = (data && data.colormaps) || {};
      function pick(key) { return cm[key] && cm[key].length ? makeRamp(cm[key]) : makeRamp(TURBO_FALLBACK); }
      return {
        h: pick('risk'),
        r: pick('reward'),
        d: pick('deficit'),
        v: pick('visits'),
        p: pick('empirical')
      };
    },
    /* gera string de gradiente CSS (para a barra de legenda) */
    cssGradient: function (rampFn, steps, direction) {
      steps = steps || 12;
      direction = direction || '90deg';
      var parts = [];
      for (var i = 0; i <= steps; i++) {
        var c = rampFn(i / steps);
        parts.push('rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ') ' + Math.round(100 * i / steps) + '%');
      }
      return 'linear-gradient(' + direction + ',' + parts.join(',') + ')';
    }
  };
})(window.PPP);
