/* render_local.js — primitivas da aba Missão Local (v3: dados reais).
 *
 * Desenha artefatos locais reais exportados por sc_export_local_real.m:
 * grafo (n?s/arestas), rota, rolling horizon, candidatos e clusters.
 * O mapa de recompensa vem de PPP_DATA via ctx.model.goTo(m-1).
 */
window.PPP = window.PPP || {};
(function (P) {
  var RL = {};
  function t(key) { return P.t ? P.t(key) : key; }
  function tf(key, vars) { return P.tf ? P.tf(key, vars) : t(key); }

  var _satImg = new Image();
  var _satLoaded = false;
  _satImg.onload = function () {
    _satLoaded = true;
    try { document.dispatchEvent(new Event('ppp:satellite-loaded')); } catch (e) {}
  };
  _satImg.src = 'data/satellite.png';
  var SAT_XMIN = 160580, SAT_YMIN = 8252860, SAT_YMAX = 8285880;
  var SAT_W_WORLD = 32740, SAT_H_WORLD = 33020;
  var SAT_XMAX = SAT_XMIN + SAT_W_WORLD;

  function drawSouthUpMap(ctx, ch, drawFn) {
    ctx.save();
    ctx.translate(0, ch);
    ctx.scale(1, -1);
    drawFn();
    ctx.restore();
  }

  function satelliteRect(localModel, cw, ch) {
    var nw = localModel.worldToCanvas(SAT_XMIN, SAT_YMAX, cw, ch);
    var se = localModel.worldToCanvas(SAT_XMAX, SAT_YMIN, cw, ch);
    return { x: nw[0], y: nw[1], w: se[0] - nw[0], h: se[1] - nw[1] };
  }

  function drawSatelliteFull(ctx, localModel, cw, ch, dim) {
    if (!_satLoaded) return;
    var r = satelliteRect(localModel, cw, ch);
    ctx.save();
    ctx.translate(r.x, r.y + r.h);
    ctx.scale(1, -1);
    ctx.drawImage(_satImg, 0, 0, r.w, r.h);
    ctx.restore();
    ctx.fillStyle = 'rgba(8,11,15,' + (dim == null ? 0.34 : dim) + ')';
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }

  function drawDiamond(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
  }

  function pathWorld(ctx, localModel, coords, cw, ch, opts) {
    opts = opts || {};
    if (!coords || coords.length < 2) return;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash(opts.dash || []);
    ctx.strokeStyle = opts.halo || 'rgba(0,0,0,.55)';
    ctx.lineWidth = (opts.width || 2.2) + 2.2;
    traceCoords(ctx, coords);
    ctx.strokeStyle = opts.color || '#1af2ff';
    ctx.lineWidth = opts.width || 2.2;
    traceCoords(ctx, coords);
    ctx.restore();
  }

  function traceCoords(ctx, coords) {
    ctx.beginPath();
    ctx.moveTo(coords[0][0], coords[0][1]);
    for (var i = 1; i < coords.length; i++) {
      ctx.lineTo(coords[i][0], coords[i][1]);
    }
    ctx.stroke();
  }

  function ring(ctx, x, y, r, color, width) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2.4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function memberList(members) {
    if (!members) return [];
    return Array.isArray(members) ? members : [members];
  }

  function nodeToCanvas(localModel, graphNodes, nodeId, cw, ch) {
    if (!graphNodes || nodeId < 1 || nodeId > graphNodes.length) return null;
    var nd = graphNodes[nodeId - 1];
    return localModel.worldToCanvas(nd.x, nd.y, cw, ch);
  }

  function seqToCanvasCoords(localModel, graphNodes, seq, cw, ch) {
    var coords = [];
    for (var i = 0; i < seq.length; i++) {
      var p = nodeToCanvas(localModel, graphNodes, seq[i], cw, ch);
      if (p) coords.push(p);
    }
    return coords;
  }

  function edgeNodeId(edge, names) {
    for (var i = 0; i < names.length; i++) {
      if (edge[names[i]] != null) return edge[names[i]];
    }
    return null;
  }

  function visibleEdges(localModel, missionId) {
    var raw = localModel.getGraphEdges(missionId) || [];
    if (raw.length) {
      return raw.map(function (e) {
        return {
          from: edgeNodeId(e, ['from', 'src', 'source', 'u', 'i', 'a']),
          to: edgeNodeId(e, ['to', 'dst', 'target', 'v', 'j', 'b'])
        };
      }).filter(function (e) { return e.from != null && e.to != null; });
    }

    var nodes = localModel.getGraphNodes(missionId) || [];
    var edges = [];
    var seen = {};
    var k = 12;
    var maxDistM = 20000;
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      var near = [];
      for (var j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        var b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d <= maxDistM) near.push({ id: b.id, d: d });
      }
      near.sort(function (p, q) { return p.d - q.d; });
      for (var n = 0; n < Math.min(k, near.length); n++) {
        var from = Math.min(a.id, near[n].id);
        var to = Math.max(a.id, near[n].id);
        var key = from + '-' + to;
        if (!seen[key]) {
          seen[key] = true;
          edges.push({ from: from, to: to });
        }
      }
    }
    return edges;
  }

  function drawNodeAura(ctx, localModel, nodes, ids, cw, ch, color) {
    if (!ids || !ids.length) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    for (var i = 0; i < ids.length; i++) {
      var p = nodeToCanvas(localModel, nodes, ids[i], cw, ch);
      if (!p) continue;
      ctx.beginPath();
      ctx.arc(p[0], p[1], 9.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- Graph rendering (real data) ---

  RL.drawGraphNodes = function (ctx, localModel, missionId, cw, ch, opts) {
    opts = opts || {};
    var nodes = localModel.getGraphNodes(missionId);
    var startNode = localModel.getStartNode(missionId);
    if (!nodes || !nodes.length) return;
    var visited = opts.visited || {};

    ctx.save();
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      var p = localModel.worldToCanvas(nd.x, nd.y, cw, ch);
      if (nd.type === 'base') {
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.4;
        if (nd.id === startNode) {
          drawDiamond(ctx, p[0], p[1], 8);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(p[0] - 6, p[1] - 6, 12, 12);
          ctx.strokeRect(p[0] - 6, p[1] - 6, 12, 12);
        }
      } else {
        var isVisited = visited[nd.id];
        ctx.fillStyle = isVisited ? '#17a640' : (opts.dimClusters ? 'rgba(255,255,255,.62)' : '#fff');
        ctx.strokeStyle = isVisited ? '#000' : '#000';
        ctx.lineWidth = isVisited ? 1.6 : 1.25;
        ctx.beginPath();
        ctx.arc(p[0], p[1], opts.nodeRadius || 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  RL.drawGraphEdges = function (ctx, localModel, missionId, cw, ch, opts) {
    opts = opts || {};
    var edges = visibleEdges(localModel, missionId);
    var nodes = localModel.getGraphNodes(missionId);
    if (!edges || !edges.length || !nodes || !nodes.length) return;

    ctx.save();
    ctx.setLineDash(opts.dash || [4, 6]);
    for (var i = 0; i < edges.length; i++) {
      var e = edges[i];
      var pa = nodeToCanvas(localModel, nodes, e.from, cw, ch);
      var pb = nodeToCanvas(localModel, nodes, e.to, cw, ch);
      if (pa && pb) {
        ctx.beginPath();
        ctx.moveTo(pa[0], pa[1]);
        ctx.lineTo(pb[0], pb[1]);
        ctx.strokeStyle = opts.halo || 'rgba(0,0,0,.72)';
        ctx.lineWidth = (opts.width || 0.9) + 1.4;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pa[0], pa[1]);
        ctx.lineTo(pb[0], pb[1]);
        ctx.strokeStyle = opts.color || 'rgba(255,255,255,.42)';
        ctx.lineWidth = opts.width || 0.9;
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  RL.drawRoute = function (ctx, localModel, missionId, cw, ch, opts) {
    opts = opts || {};
    var route = localModel.getRoute(missionId);
    var nodes = localModel.getGraphNodes(missionId);
    if (!route || !route.seqExecuted || !nodes) return;

    var coords = seqToCanvasCoords(localModel, nodes, route.seqExecuted, cw, ch);
    pathWorld(ctx, localModel, coords, cw, ch, {
      color: opts.color || '#1af2ff',
      width: opts.width || 2.8,
      dash: opts.dash
    });
  };

  RL.drawRollingFrame = function (ctx, localModel, missionId, frame, cw, ch) {
    var nodes = localModel.getGraphNodes(missionId);
    if (!nodes || !nodes.length) return;

    if (!frame.hideCandidateAura && frame.candidates && frame.candidates.length) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,177,105,.72)';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = 'rgba(255,177,105,.85)';
      ctx.shadowBlur = 8;
      for (var ci = 0; ci < frame.candidates.length; ci++) {
        var candId = typeof frame.candidates[ci] === 'number' ? frame.candidates[ci] :
          (frame.candidates[ci].id || frame.candidates[ci].node || frame.candidates[ci].nodeId);
        var candPt = nodeToCanvas(localModel, nodes, candId, cw, ch);
        if (!candPt) continue;
        ctx.beginPath();
        ctx.arc(candPt[0], candPt[1], 8.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (frame.executedSoFar && frame.executedSoFar.length > 1) {
      var execCoords = seqToCanvasCoords(localModel, nodes, frame.executedSoFar, cw, ch);
      pathWorld(ctx, localModel, execCoords, cw, ch, {
        color: 'rgba(212,163,40,.95)', width: 2.4
      });
    }

    if (!frame.hideRhPlan && frame.seqBest && frame.seqBest.length > 1) {
      var planCoords = seqToCanvasCoords(localModel, nodes, frame.seqBest, cw, ch);
      pathWorld(ctx, localModel, planCoords, cw, ch, {
        color: 'rgba(24,194,255,.96)', width: 2.2, dash: [7, 6]
      });
    }

    if (frame.committed && frame.committed.length > 1) {
      var commitCoords = seqToCanvasCoords(localModel, nodes, frame.committed, cw, ch);
      pathWorld(ctx, localModel, commitCoords, cw, ch, {
        color: 'rgba(255,200,50,.98)', width: 3.1
      });
    }

    if (frame.executedSoFar && frame.executedSoFar.length > 0) {
      ctx.save();
      var seen = {};
      for (var j = 0; j < frame.executedSoFar.length; j++) {
        var nodeId = frame.executedSoFar[j];
        if (seen[nodeId]) continue;
        seen[nodeId] = true;
        var nd = nodes[nodeId - 1];
        if (!nd || nd.type === 'base') continue;
        var pt = nodeToCanvas(localModel, nodes, nodeId, cw, ch);
        if (pt) {
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], 5, 0, 2 * Math.PI);
          ctx.fillStyle = '#17a640';
          ctx.fill();
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = '#000';
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  };

  RL.drawAlnsFrame = function (ctx, localModel, missionId, frame, cw, ch, showAura) {
    var nodes = localModel.getGraphNodes(missionId);
    if (!nodes || !nodes.length || !frame) return;
    var it = frame.alnsIter || null;
    var seq = it ? (it.seqClosed || it.seqRepaired || it.seqBest || frame.seqBest) : (frame.alnsSeq || frame.seqBest);
    if (seq && seq.length > 1) {
      var coords = seqToCanvasCoords(localModel, nodes, seq, cw, ch);
      pathWorld(ctx, localModel, coords, cw, ch, {
        color: 'rgba(24,194,255,.98)',
        width: 2.7
      });
    }
    if (showAura && it) {
      drawNodeAura(ctx, localModel, nodes, it.removed, cw, ch, 'rgba(255,74,74,.92)');
      drawNodeAura(ctx, localModel, nodes, it.added, cw, ch, 'rgba(45,220,110,.92)');
    }
  };

  // --- Full scene for the planning tab ---

  RL.drawScene = function (ctx, localModel, missionId, frame, cw, ch) {
    frame = frame || {};
    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.fillStyle = '#0b0e12';
    ctx.fillRect(0, 0, cw, ch);

    drawSouthUpMap(ctx, ch, function () {
      drawSatelliteFull(ctx, localModel, cw, ch, 0.50);
      RL.drawGraphNodes(ctx, localModel, missionId, cw, ch, { dimClusters: true });
      if (frame.alnsIter && frame.rhStep == null) {
        RL.drawAlnsFrame(ctx, localModel, missionId, frame, cw, ch, true);
      } else if (frame.alnsIter || frame.alnsSeq) {
        RL.drawRollingFrame(ctx, localModel, missionId, frame, cw, ch);
        RL.drawAlnsFrame(ctx, localModel, missionId, frame, cw, ch, false);
      } else {
        RL.drawRollingFrame(ctx, localModel, missionId, frame, cw, ch);
      }
    });
    ctx.restore();

    var route = localModel.getRoute(missionId);
    if (route) {
      var rCollected = 0;
      if (frame.executedSoFar && frame.executedSoFar.length > 0) {
        var nodes = localModel.getGraphNodes(missionId);
        var counted = {};
        for (var i = 0; i < frame.executedSoFar.length; i++) {
          var nid = frame.executedSoFar[i];
          if (counted[nid]) continue;
          counted[nid] = true;
          var nd = nodes[nid - 1];
          if (nd && nd.type !== 'base') rCollected += (nd.reward || 0);
        }
      }
      var lines = [
        t('local.canvas.rewardCollectedShort') + ' = ' + rCollected.toFixed(6),
        t('local.canvas.routeReward') + ' = ' + route.reward.toFixed(6),
        t('local.totalCost') + ' = ' + route.costTotalKm.toFixed(1) + ' km'
      ];
      if (frame.rolling) {
        lines.push('Q rem = ' + (frame.rolling.QremKm || frame.QremKm || '?') + ' km');
      }
      ctx.save();
      var lh = 18, pad = 10, bw = 300;
      var bh = lines.length * lh + pad * 2;
      var bx = cw - bw - 12, by = 12;
      ctx.fillStyle = 'rgba(11,14,18,.78)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#f4efe7';
      ctx.font = '12px JetBrains Mono, monospace';
      lines.forEach(function (l, li) {
        ctx.fillText(l, bx + pad, by + pad + (li + 1) * lh - 4);
      });
      ctx.restore();
    }
  };

  // --- Pipeline step scene (satellite + real data overlays) ---

  RL.drawPipelineScene = function (ctx, localModel, missionId, step, cw, ch) {
    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.fillStyle = '#0b0e12';
    ctx.fillRect(0, 0, cw, ch);

    drawSouthUpMap(ctx, ch, function () {
      drawSatelliteFull(ctx, localModel, cw, ch, 0.44);

      if (step >= 1) {
        RL.drawGraphNodes(ctx, localModel, missionId, cw, ch, {
          dimClusters: step < 2, nodeRadius: step < 2 ? 2.8 : 3.8
        });
      }
      if (step >= 3) {
        RL.drawGraphEdges(ctx, localModel, missionId, cw, ch);
      }
      if (step >= 4) {
        RL.drawRoute(ctx, localModel, missionId, cw, ch);
      }
    });
    ctx.restore();

    var route = localModel.getRoute(missionId);
    var pipe = localModel.getPipeline(missionId);
    ctx.save();
    ctx.fillStyle = 'rgba(11,14,18,.78)';
    ctx.fillRect(14, 14, 340, 54);
    ctx.fillStyle = '#f4efe7';
    ctx.font = '700 15px Archivo, sans-serif';
    ctx.fillText(t('local.mission') + ' ' + missionId + ' · Q = ' + (localModel.meta.Qkm || 100) + ' km', 28, 37);
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(244,239,231,.72)';
    var info = '';
    if (pipe && pipe.graph) info += t('local.graphNodes') + '=' + (pipe.graph.nodeCount || '?');
    if (pipe && pipe.graph) info += ' · ' + t('local.edges') + '=' + (pipe.graph.edgeCount || '?');
    if (route) info += ' · ' + t('local.pipeline.route') + '=' + route.seqExecuted.length + ' ' + t('local.canvas.nodesLower');
    ctx.fillText(info, 28, 56);
    ctx.restore();
  };

  // --- Cluster step: satellite + colored pixel members per cluster ---

  RL.drawClustersStep = function (ctx, localModel, missionId, cw, ch) {
    var clusters = localModel.getClusters(missionId);
    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.fillStyle = '#0b0e12';
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();

    drawSouthUpMap(ctx, ch, function () {
      drawSatelliteFull(ctx, localModel, cw, ch, 0.30);
    });

    var COLORS = ['#ffb169', '#7bd88f', '#8cc8ff', '#ff7a45', '#b99cff',
                  '#f2d65c', '#56d6c9', '#ff8fb3', '#c084fc', '#f97316'];
    var hasMemberData = false;
    if (clusters && clusters.length) {
      for (var hi = 0; hi < clusters.length; hi++) {
        if (memberList(clusters[hi].members).length) {
          hasMemberData = true;
          break;
        }
      }
    }

    if (clusters && clusters.length) {
      drawSouthUpMap(ctx, ch, function () {
        ctx.save();
        clusters.forEach(function (cl, ci) {
          var color = COLORS[ci % COLORS.length];
          var members = memberList(cl.members);
          if (members.length) {
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.68;
            for (var j = 0; j < members.length; j++) {
              var mp = localModel.worldToCanvas(members[j].x, members[j].y, cw, ch);
              ctx.beginPath();
              ctx.arc(mp[0], mp[1], 2.6, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.globalAlpha = 1;
          var cp = localModel.worldToCanvas(cl.medoidX, cl.medoidY, cw, ch);
          ctx.strokeStyle = color;
          ctx.fillStyle = '#fff';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(cp[0], cp[1], 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
        ctx.restore();
      });
    }

    ctx.save();
    ctx.fillStyle = 'rgba(11,14,18,.78)';
    ctx.fillRect(14, 14, 360, 54);
    ctx.fillStyle = '#f4efe7';
    ctx.font = '700 15px Archivo, sans-serif';
    ctx.fillText(t('local.mission') + ' ' + missionId + ' · ' + t('local.pipeline.clusters'), 28, 37);
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(244,239,231,.72)';
    var info = clusters ? (clusters.length + ' clusters') : t('local.dataMissing');
    if (!hasMemberData && clusters && clusters.length) info += ' · ' + t('local.canvas.exportMembers');
    else if (hasMemberData) info += ' · ' + t('local.canvas.clusterLegend');
    ctx.fillText(info, 28, 56);
    ctx.restore();
  };

  // --- Graph step: satellite + nodes + edges only ---

  RL.drawGraphStep = function (ctx, localModel, missionId, cw, ch) {
    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.fillStyle = '#0b0e12';
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();

    drawSouthUpMap(ctx, ch, function () {
      drawSatelliteFull(ctx, localModel, cw, ch, 0.44);
      RL.drawGraphEdges(ctx, localModel, missionId, cw, ch, {
        color: 'rgba(245,248,255,.78)',
        halo: 'rgba(0,0,0,.88)',
        width: 1.35,
        dash: []
      });
      RL.drawGraphNodes(ctx, localModel, missionId, cw, ch, {});
    });

    var pipe = localModel.getPipeline(missionId);
    ctx.save();
    ctx.fillStyle = 'rgba(11,14,18,.78)';
    ctx.fillRect(14, 14, 360, 54);
    ctx.fillStyle = '#f4efe7';
    ctx.font = '700 15px Archivo, sans-serif';
    ctx.fillText(t('local.mission') + ' ' + missionId + ' · ' + t('local.pipeline.graph'), 28, 37);
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(244,239,231,.72)';
    var info = pipe && pipe.graph ?
      (t('local.graphNodes') + '=' + (pipe.graph.nodeCount || '?') + ' · ' +
       t('local.edges') + '=' + (pipe.graph.edgeCount || '?') + ' · ' +
       t('local.canvas.startBaseDiamond')) : t('local.dataMissing');
    ctx.fillText(info, 28, 56);
    ctx.restore();
  };

  // --- Route step: satellite + graph context + visited nodes + route ---

  RL.drawRouteStep = function (ctx, localModel, missionId, cw, ch) {
    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.fillStyle = '#0b0e12';
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();

    var route = localModel.getRoute(missionId);
    var visited = {};
    if (route && route.seqExecuted) {
      for (var i = 0; i < route.seqExecuted.length; i++) visited[route.seqExecuted[i]] = true;
    }

    drawSouthUpMap(ctx, ch, function () {
      drawSatelliteFull(ctx, localModel, cw, ch, 0.40);
      RL.drawGraphEdges(ctx, localModel, missionId, cw, ch);
      RL.drawGraphNodes(ctx, localModel, missionId, cw, ch, { visited: visited });
      RL.drawRoute(ctx, localModel, missionId, cw, ch, { width: 3.0 });
    });

    ctx.save();
    ctx.fillStyle = 'rgba(11,14,18,.78)';
    ctx.fillRect(14, 14, 440, 54);
    ctx.fillStyle = '#f4efe7';
    ctx.font = '700 15px Archivo, sans-serif';
    ctx.fillText(t('local.mission') + ' ' + missionId + ' · ' + t('local.pipeline.route'), 28, 37);
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(244,239,231,.72)';
    var rinfo = route ?
      (t('local.totalCost') + '=' + route.costTotalKm.toFixed(1) + ' km · R=' + route.reward.toFixed(6) + ' · ' +
       t('local.canvas.greenVisited')) : t('local.dataMissing');
    ctx.fillText(rinfo, 28, 56);
    ctx.restore();
  };

  P.renderLocal = RL;
})(window.PPP);
