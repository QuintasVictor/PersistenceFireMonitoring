/* localLoader.js — ponte PPP_LOCAL (v3) para o HTML.
 *
 * Le window.PPP_LOCAL gerado por export/sc_export_local_real.m.
 * Versao 3: dados reais por missao representativa, sem cenario didatico.
 * O mapa de recompensa vem de PPP_DATA via ctx.model.goTo(m-1).
 */
window.PPP = window.PPP || {};
(function (P) {

  function LocalModel(data) {
    this.d = data;
    this.meta = data.meta || {};
    this.selectedMissions = this.meta.selectedMissions || [];
    this.missions = data.missions || {};
    this.currentMissionId = this.selectedMissions.length > 0 ? this.selectedMissions[0] : 1;

    this._missionCache = {};

    this.satelliteBounds = data.satelliteBounds || {
      xmin: 160580,
      xmax: 193320,
      ymin: 8252860,
      ymax: 8285880
    };
  }

  LocalModel.prototype.missionKey = function (m) {
    return 'x' + m;
  };

  LocalModel.prototype.hasMission = function (m) {
    var key = this.missionKey(m);
    return this.missions.hasOwnProperty(key) && this.missions[key] != null;
  };

  LocalModel.prototype.getMission = function (m) {
    if (!m) m = this.currentMissionId;
    var key = this.missionKey(m);
    return this.missions[key] || null;
  };

  LocalModel.prototype.setMission = function (m) {
    this.currentMissionId = m;
  };

  LocalModel.prototype.getPipeline = function (m) {
    var md = this.getMission(m);
    return md ? md.pipeline : null;
  };

  LocalModel.prototype.getRolling = function (m) {
    var md = this.getMission(m);
    return md ? md.rolling : null;
  };

  LocalModel.prototype.getAlns = function (m) {
    var md = this.getMission(m);
    return md ? md.alns : null;
  };

  LocalModel.prototype.getAlnsDetailedReplan = function (m) {
    var alns = this.getAlns(m);
    if (!alns || !alns.replanSummaries) return null;
    for (var i = 0; i < alns.replanSummaries.length; i++) {
      var rs = alns.replanSummaries[i];
      if (rs && rs.hasDetailedLog && rs.iterations && rs.iterations.length) {
        return rs;
      }
    }
    return null;
  };

  LocalModel.prototype.getValidation = function (m) {
    var md = this.getMission(m);
    return md ? md.validation : null;
  };

  LocalModel.prototype.getRoute = function (m) {
    var pipe = this.getPipeline(m);
    return pipe ? pipe.route : null;
  };

  LocalModel.prototype.getStartNode = function (m) {
    var route = this.getRoute(m);
    return route ? route.startNode : null;
  };

  LocalModel.prototype.getEndNode = function (m) {
    var route = this.getRoute(m);
    return route ? route.endNode : null;
  };

  LocalModel.prototype.getGraphNodes = function (m) {
    var pipe = this.getPipeline(m);
    return pipe && pipe.graph ? pipe.graph.nodes : [];
  };

  LocalModel.prototype.getGraphEdges = function (m) {
    var pipe = this.getPipeline(m);
    return pipe && pipe.graph ? pipe.graph.edges : [];
  };

  LocalModel.prototype.getClusters = function (m) {
    var pipe = this.getPipeline(m);
    return pipe ? pipe.clusters : [];
  };

  LocalModel.prototype.getCandidates = function (m) {
    var pipe = this.getPipeline(m);
    return pipe && pipe.selection ? pipe.selection.candidatePixels : [];
  };

  LocalModel.prototype.getRollingSteps = function (m) {
    var rolling = this.getRolling(m);
    return rolling ? rolling.steps : [];
  };

  LocalModel.prototype.viewport = function (cw, ch) {
    var raw = this.satelliteBounds;
    var baseXSpan = (raw.xmax - raw.xmin) || 1;
    var baseYSpan = (raw.ymax - raw.ymin) || 1;
    var padX = baseXSpan * 0.085;
    var padY = baseYSpan * 0.085;
    var b = {
      xmin: raw.xmin - padX,
      xmax: raw.xmax + padX,
      ymin: raw.ymin - padY,
      ymax: raw.ymax + padY
    };
    var xSpan = (b.xmax - b.xmin) || 1;
    var ySpan = (b.ymax - b.ymin) || 1;
    var scale = Math.min(cw / xSpan, ch / ySpan);
    return {
      scale: scale,
      x0: (cw - xSpan * scale) / 2,
      y0: (ch - ySpan * scale) / 2,
      xSpan: xSpan,
      ySpan: ySpan,
      xmin: b.xmin,
      xmax: b.xmax,
      ymin: b.ymin,
      ymax: b.ymax
    };
  };

  LocalModel.prototype.worldToCanvas = function (wx, wy, cw, ch) {
    var v = this.viewport(cw, ch);
    var px = v.x0 + (wx - v.xmin) * v.scale;
    var py = v.y0 + (v.ymax - wy) * v.scale;
    return [px, py];
  };

  function validate(data) {
    if (!data) return 'PPP_LOCAL ausente';
    if (!data.meta) return 'meta ausente';
    if (!data.meta.selectedMissions || !data.meta.selectedMissions.length) return 'selectedMissions ausente';
    if (!data.missions) return 'missions ausente';
    var found = 0;
    for (var i = 0; i < data.meta.selectedMissions.length; i++) {
      var key = 'x' + data.meta.selectedMissions[i];
      if (data.missions[key]) found++;
    }
    if (found === 0) return 'nenhuma missao exportada encontrada';
    if (!data.meta.Qkm || data.meta.Qkm !== 100) return 'Qkm deve ser 100 (encontrado: ' + data.meta.Qkm + ')';
    return null;
  }

  P.localLoader = {
    load: function () {
      var data = window.PPP_LOCAL;
      var err = validate(data);
      if (err) return { ok: false, error: err };
      try {
        return { ok: true, data: data, model: new LocalModel(data) };
      } catch (e) {
        return { ok: false, error: String(e && e.message || e) };
      }
    }
  };
  P.LocalModel = LocalModel;
})(window.PPP);
