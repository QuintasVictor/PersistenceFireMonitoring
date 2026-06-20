# i18n dictionary REV01

Generated from `webapp/js/core/i18n.js`. Source of truth: the JS dictionary.

| key | pt | en |
|---|---|---|
| `app.dataMissing.body` | Execute <code>export/sc_export_web.m</code> no MATLAB para gerar <code>webapp/data/campanha_data.js</code>. Motivo: {error}. | Run <code>export/sc_export_web.m</code> in MATLAB to generate <code>webapp/data/campanha_data.js</code>. Reason: {error}. |
| `app.dataMissing.title` | Dados da campanha não carregados. | Campaign data not loaded. |
| `app.documentTitle` | Monitoramento Preventivo de Incêndios Florestais com UAVs | Preventive Forest Fire Monitoring with UAVs: |
| `app.fullscreen.enter` | Tela cheia | Full screen |
| `app.fullscreen.exit` | Sair da tela cheia | Exit full screen |
| `app.lang.aria` | Idioma | Language |
| `app.nav.aria` | Módulos do showcase | Showcase modules |
| `app.soon` | em breve | soon |
| `app.subtitle` | uma arquitetura multimissão orientada ao risco | a risk-oriented multi-mission architecture |
| `app.title` | Monitoramento Preventivo de Incêndios Florestais com UAVs: | Preventive Forest Fire Monitoring with UAVs: |
| `campaign.axis.mission` | missão | mission |
| `campaign.card.cost` | Custo da rota | Route cost |
| `campaign.card.coverage` | Cobertura | Coverage |
| `campaign.card.deficit` | Déficit ‖d‖₁ | Deficit ‖d‖₁ |
| `campaign.card.mission` | Missão | Mission |
| `campaign.card.riskMass` | Massa de risco | Risk mass |
| `campaign.card.tv` | Dist. distributiva norm. | Norm. distribution dist. |
| `campaign.chart.coverage` | cobertura espacial | spatial coverage |
| `campaign.chart.deficit` | déficit residual (%) | residual deficit (%) |
| `campaign.chart.riskMass` | massa de risco atendida | served risk mass |
| `campaign.chart.tv` | distância distributiva norm. (%) | norm. distribution distance (%) |
| `campaign.complete` | ✓ Campanha completa | ✓ Campaign complete |
| `campaign.conv.limit` | Conversão: limite de <b>3 camadas simultâneas</b>. Desmarque uma camada para adicionar outra. | Conversion: limit of <b>3 simultaneous layers</b>. Unselect one layer before adding another. |
| `campaign.conv.v2` | Panorâmica | Panoramic |
| `campaign.conv.v3` | Sobreposição | Overlay |
| `campaign.conv.version` | Versão da conversão | Conversion version |
| `campaign.eq.budget` | Orçamento missão | Mission budget |
| `campaign.layer.d` | Déficit d<sub>m</sub> | Deficit d<sub>m</sub> |
| `campaign.layer.h` | Risco h | Risk h |
| `campaign.layer.p` | Distribuição p<sub>m</sub> | Distribution p<sub>m</sub> |
| `campaign.layer.r` | Recompensa r<sub>m</sub> | Reward r<sub>m</sub> |
| `campaign.layer.v` | Vistorias v<sub>m</sub> | Inspections v<sub>m</sub> |
| `campaign.layer.w` | Alvo w<sub>i</sub> | Target w<sub>i</sub> |
| `campaign.legend.bases` | bases operacionais | operational bases |
| `campaign.legend.route` | rota da missão | mission route |
| `campaign.legend.uav` | UAV | UAV |
| `campaign.log.finished` | <b>Campanha encerrada.</b> A distribuição de visitas se aproximou do alvo: distância distributiva normalizada = <b>{tv}%</b> · cobertura <b>{coverage}%</b> · massa de risco <b>{riskMass}%</b>. | <b>Campaign complete.</b> The inspection distribution approached the target: normalized distribution distance = <b>{tv}%</b> · coverage <b>{coverage}%</b> · risk mass <b>{riskMass}%</b>. |
| `campaign.log.initial` | Estado inicial <b>m=0</b>, antes da missão 1: p<sub>0</sub>=0; por isso a distância distributiva normalizada inicial é <b>{tv}%</b>. | Initial state <b>m=0</b>, before mission 1: p<sub>0</sub>=0; therefore the initial normalized distribution distance is <b>{tv}%</b>. |
| `campaign.log.mission` | Missão <b>{m}</b>: rota de <b>{cost} km</b> ({budget}% do orçamento). Déficit em <b>{deficit}</b>, distância distributiva normalizada em <b>{tv}%</b>. | Mission <b>{m}</b>: route of <b>{cost} km</b> ({budget}% of the budget). Deficit at <b>{deficit}</b>, normalized distribution distance at <b>{tv}%</b>. |
| `campaign.log.ready` | Pronto. A distribuição-alvo w já está carregada; nenhum pixel foi vistoriado. | Ready. The target distribution w is loaded; no pixel has been inspected yet. |
| `campaign.mini.deficit` | déficit d<sub>m</sub> | deficit d<sub>m</sub> |
| `campaign.mini.empirical` | empírica p<sub>m</sub> | empirical p<sub>m</sub> |
| `campaign.mini.visits` | vistorias v<sub>m</sub> | inspections v<sub>m</sub> |
| `campaign.noData.body` | Execute <code>export/sc_export_web.m</code> no MATLAB para gerar <code>webapp/data/campanha_data.js</code>. | Run <code>export/sc_export_web.m</code> in MATLAB to generate <code>webapp/data/campanha_data.js</code>. |
| `campaign.noData.title` | Dados não carregados | Data not loaded |
| `campaign.pause` | ❚❚ Pausar | ❚❚ Pause |
| `campaign.play` | ▶ Voar campanha | ▶ Fly campaign |
| `campaign.reading.body` | cada missão transforma o déficit distributivo em recompensa, envia essa recompensa ao planejador local e recebe de volta uma rota executada. A rota atualiza p<sub>m</sub>; então d<sub>m</sub> e r<sub>m</sub> são recalculados para a próxima missão. | each mission converts the distributive deficit into reward, sends this reward to the local planner, and receives an executed route. The route updates p<sub>m</sub>; then d<sub>m</sub> and r<sub>m</sub> are recalculated for the next mission. |
| `campaign.reading.prefix` | <b>Como ler:</b> | <b>How to read:</b> |
| `campaign.realData` | <b>Dados reais:</b> {n} missões · déficit final {deficit} · cobertura {coverage}% · massa de risco {riskMass}% · custo médio {cost} km. | <b>Real data:</b> {n} missions · final deficit {deficit} · coverage {coverage}% · risk mass {riskMass}% · mean cost {cost} km. |
| `campaign.reset` | ↺ Reiniciar | ↺ Reset |
| `campaign.speed.0` | instantâneo | instant |
| `campaign.speed.1` | 1× cinematográfico | 1× cinematic |
| `campaign.speed.2` | 2× ágil | 2× agile |
| `campaign.speed.4` | 4× rápido | 4× fast |
| `campaign.speed.aria` | Velocidade | Speed |
| `campaign.step` | +1 missão | +1 mission |
| `campaign.telemetry` | Telemetria da campanha | Campaign telemetry |
| `campaign.territory` | Território · grade do PNB | Territory · PNB grid |
| `campaign.view.2d` | 2D | 2D |
| `campaign.view.3d` | 3D | 3D |
| `campaign.view.aria` | Vista | View |
| `campaign.view.conv` | Conversão | Conversion |
| `local.accept` | Aceite | Accept |
| `local.alnsMissing` | Dados ALNS ausentes. Execute sc_export_local_real.m no MATLAB. | ALNS data missing. Run sc_export_local_real.m in MATLAB. |
| `local.alnsWeightsCopy` | Iteração {it}: {destroy} + {repair} \| Rbest={reward} | Iteration {it}: {destroy} + {repair} \| Rbest={reward} |
| `local.budget` | Orçamento | Budget |
| `local.calling` | chamando | calling |
| `local.callingAlns` | Chamando ALNS... | Calling ALNS... |
| `local.canvas.clusterLegend` | bolinha branca = medoide · pixels coloridos = membros | white circle = medoid · colored pixels = members |
| `local.canvas.exportMembers` | execute sc_export_local_real.m para ver pixels membros | run sc_export_local_real.m to show member pixels |
| `local.canvas.greenVisited` | verde = visitado | green = visited |
| `local.canvas.nodesLower` | nós | nodes |
| `local.canvas.rewardCollectedShort` | R coletada | Collected R |
| `local.canvas.routeReward` | R rota | Route R |
| `local.canvas.startBaseDiamond` | losango = base inicial | diamond = initial base |
| `local.clusters` | Clusters | Clusters |
| `local.currentStep` | Etapa atual | Current step |
| `local.dataMissing` | Dado ausente | Missing data |
| `local.destroy` | Destruir | Destroy |
| `local.destroyWeightsAlt` | Pesos dos operadores de destruição | Destroy operator weights |
| `local.destroyWeightsTitle` | Destruição | Destroy |
| `local.done` | concluído | done |
| `local.edges` | Arestas | Edges |
| `local.frame` | frame | frame |
| `local.frameText.accepted` | aceita | accepted |
| `local.frameText.alnsDone` | ALNS concluído: {iter} iter. R_best={reward}. | ALNS done: {iter} iter. R_best={reward}. |
| `local.frameText.alnsIter` | ALNS iter {it}/{total}: {destroy} + {repair} | ALNS iter {it}/{total}: {destroy} + {repair} |
| `local.frameText.alnsMissing` | Dados ALNS ausentes. Execute sc_export_local_real.m no MATLAB. | ALNS data missing. Run sc_export_local_real.m in MATLAB. |
| `local.frameText.alnsResult` | Resultado replan {step}: R_best={reward} custo={cost} km. | Replan {step} result: R_best={reward} cost={cost} km. |
| `local.frameText.alnsRun` | Replan {step}/{total}: rodando ALNS ({iter} iter). | Replan {step}/{total}: running ALNS ({iter} iter). |
| `local.frameText.effectiveFinal` | Rota efetiva consolidada até a base final. | Effective route consolidated to final base. |
| `local.frameText.execute` | Executa deslocamento {from} -> {to}, descarta plano restante. | Executes leg {from} -> {to}, discarding the remaining plan. |
| `local.frameText.executeShort` | Executa deslocamento {from} -> {to}. | Executes leg {from} -> {to}. |
| `local.frameText.finalRoute` | Rota final consolidada até a base de encerramento. | Final route consolidated to the closing base. |
| `local.frameText.iter` | Iteração {it}/{total}: {destroy} + {repair} · {status} | Iteration {it}/{total}: {destroy} + {repair} · {status} |
| `local.frameText.rejected` | rejeita | rejected |
| `local.frameText.replan` | Passo {step}: seleciona {n} candidatos e roda ALNS (200 iter). | Step {step}: selects {n} candidates and runs ALNS (200 iter). |
| `local.frameText.rhWindow` | RH passo {step}: janela com {n} candidatos. Chamando ALNS... | RH step {step}: window with {n} candidates. Calling ALNS... |
| `local.graphNodes` | Nós do grafo | Graph nodes |
| `local.legend.alnsRoute` | rota projetada ALNS | projected ALNS route |
| `local.legend.rhRoute` | rota efetiva RH | effective RH route |
| `local.legend.visited` | nós visitados | visited nodes |
| `local.lightbox.close` | Fechar | Close |
| `local.lightbox.closeExpansion` | Fechar ampliação | Close expanded view |
| `local.lightbox.stepAlt` | Passo ampliado | Expanded step |
| `local.localLoaderMissing` | localLoader ausente | localLoader missing |
| `local.logState` | Estado do log | Log state |
| `local.metrics` | Métricas | Metrics |
| `local.metricsMission` | Métricas da missão | Mission metrics |
| `local.metricsPlanning` | Métricas de planejamento | Planning metrics |
| `local.mission` | Missão | Mission |
| `local.mode.alns` | ALNS passo a passo | ALNS step by step |
| `local.mode.aria` | O que ver | What to show |
| `local.mode.both` | Ambos | Both |
| `local.mode.rolling` | Rolling horizon | Rolling horizon |
| `local.next` | Próximo → | Next → |
| `local.no` | não | no |
| `local.noData.body` | Execute <code>export/sc_export_local_real.m</code> no MATLAB para gerar <code>webapp/data/local_data.js</code>. | Run <code>export/sc_export_local_real.m</code> in MATLAB to generate <code>webapp/data/local_data.js</code>. |
| `local.noData.reason` | Motivo | Reason |
| `local.noData.title` | Missão local — dados ausentes | Local mission — data missing |
| `local.noDetailedAlns` | Sem log detalhado ALNS. | No detailed ALNS log. |
| `local.noWeights` | Log de pesos ausente no PPP_LOCAL. | Weight log missing in PPP_LOCAL. |
| `local.operatorWeights` | Pesos dos operadores ALNS | ALNS operator weights |
| `local.operators` | Operadores | Operators |
| `local.patrolCost` | Custo vistoria | Inspection cost |
| `local.pause` | ❚❚ Pausar | ❚❚ Pause |
| `local.phase.execute` | EXECUTAR trecho comprometido | EXECUTE committed leg |
| `local.phase.initial` | ROTA INICIAL | INITIAL ROUTE |
| `local.phase.ready` | Pronto para reproduzir. | Ready to play. |
| `local.phase.replan` | REPLANEJAR janela | REPLAN window |
| `local.pipeline.aria` | Pipeline da missão local | Local mission pipeline |
| `local.pipeline.candidates` | Candidatos top-20% | Top-20% candidates |
| `local.pipeline.candidates.desc` | Pixels com maior recompensa são selecionados como candidatos da missão. | Pixels with the highest reward are selected as mission candidates. |
| `local.pipeline.clusters` | Clusterização | Clustering |
| `local.pipeline.clusters.desc` | Pixels candidatos são agrupados em clusters espaciais. | Candidate pixels are grouped into spatial clusters. |
| `local.pipeline.graph` | Grafo de navegação | Navigation graph |
| `local.pipeline.graph.desc` | Nós representantes e bases conectados por arestas do grafo local. | Representative nodes and bases connected by local graph edges. |
| `local.pipeline.reward` | Mapa de recompensa | Reward map |
| `local.pipeline.reward.desc` | Campo r_m pré-missão calculado a partir do mapa de risco e da persistência acumulada. | Pre-mission r_m field computed from the risk map and accumulated persistence. |
| `local.pipeline.route` | Rota planejada | Planned route |
| `local.pipeline.route.desc` | Rota selecionada pelo planejador local com ALNS e horizonte rolante. | Route selected by the local planner with ALNS and rolling horizon. |
| `local.pipeline.sequence` | Sequência do pipeline | Pipeline sequence |
| `local.planning.title` | Missão local — ALNS + Rolling Horizon | Local mission — ALNS + Rolling Horizon |
| `local.play` | ▶ Reproduzir | ▶ Play |
| `local.prev` | ← Anterior | ← Previous |
| `local.repair` | Reparar | Repair |
| `local.repairWeightsAlt` | Pesos dos operadores de reconstrução | Repair operator weights |
| `local.repairWeightsTitle` | Reconstrução | Repair |
| `local.replanWaiting` | Aguardando ALNS... | Waiting for ALNS... |
| `local.representativeMission` | Missão representativa | Representative mission |
| `local.reset` | ↺ Reiniciar | ↺ Reset |
| `local.rewardAvailable` | Recompensa disponível | Available reward |
| `local.rewardCollected` | Recompensa coletada | Collected reward |
| `local.rewardUse` | Aproveit. recompensa | Reward use |
| `local.rhMission` | Missão RH | RH mission |
| `local.rhStep` | RH passo | RH step |
| `local.rollingTitle` | Rolling Horizon | Rolling Horizon |
| `local.runExporter` | Execute sc_export_local_real.m no MATLAB. | Run sc_export_local_real.m in MATLAB. |
| `local.speed.aria` | Velocidade | Speed |
| `local.speed.instant` | instantâneo | instant |
| `local.step` | passo | step |
| `local.steps.title` | Passos da Missão local | Local mission steps |
| `local.subtab.planning` | Planejamento de rota | Route planning |
| `local.subtab.steps` | Passos da Missão local | Local mission steps |
| `local.subtabs.aria` | Subabas da missão local | Local mission subtabs |
| `local.totalCost` | Custo total | Total cost |
| `local.travelCost` | Custo desloc. | Travel cost |
| `local.waitingDetailedLog` | Aguardando log detalhado. | Waiting for detailed log. |
| `local.waitingPlayback` | Aguardando reprodução. | Waiting for playback. |
| `local.yes` | sim | yes |
| `risk.assetMissing` | asset ausente | missing asset |
| `risk.frequency.short` | Frequência | Frequency |
| `risk.group.fuel` | Combustível | Fuel |
| `risk.group.meteo` | Meteorológico | Meteorological |
| `risk.group.topo` | Topográfico | Topographic |
| `risk.indicator.M1` | Precipitação | Precipitation |
| `risk.indicator.M2` | Temp. superfície | Surface temp. |
| `risk.indicator.M3` | Temp. do ar | Air temp. |
| `risk.indicator.M4` | Vento | Wind |
| `risk.indicator.M5` | Umidade relativa | Relative humidity |
| `risk.indicator.T1` | Elevação | Elevation |
| `risk.indicator.T2` | Declividade | Slope |
| `risk.indicator.T3` | Exposição | Aspect |
| `risk.indicator.T4` | Uso e cobertura | Land use and cover |
| `risk.indicator.V1` | FVC | FVC |
| `risk.indicator.V2` | NDVI | NDVI |
| `risk.indicator.V3` | Tipo de vegetação | Vegetation type |
| `risk.indicator.V4` | Altura do dossel | Canopy height |
| `risk.lightbox.close` | Fechar | Close |
| `risk.lightbox.closeExpansion` | Fechar ampliação | Close expanded view |
| `risk.lightbox.mapAlt` | Mapa ampliado | Expanded map |
| `risk.mask` | máscara | mask |
| `risk.result` | Mapa de risco | Risk map |
| `risk.result.title` | Mapa de risco MCDA | MCDA risk map |
| `risk.title` | Mapa de risco | Risk map |
| `risk.validation` | Frequência de queimadas | Burn scar frequency |
| `risk.weight` | peso | weight |
| `study.area.note` | área protegida de Cerrado | protected Cerrado area |
| `study.area.value` | ~42,4 mil ha | ~42.4 thousand ha |
| `study.border.note` | na fronteira entre as unidades federativas | on the border between the federal units |
| `study.border.value` | DF e Goiás | Federal District and Goiás |
| `study.description` | O PNB é usado como área de estudo para avaliar o monitoramento preventivo orientado ao risco em uma paisagem extensa, heterogênea e operacionalmente relevante. | PNB is used as the study area to evaluate risk-oriented preventive monitoring in an extensive, heterogeneous, and operationally relevant landscape. |
| `study.distance.note` | do centro de Brasília | from downtown Brasília |
| `study.distance.value` | ~10 km | ~10 km |
| `study.eyebrow` | Parque Nacional de Brasília | Brasília National Park |
| `study.mapTitle` | Mapa de localização do PNB | PNB location map |
| `study.name` | PNB | PNB |
| `study.openMap` | Abrir mapa de localização | Open location map |
| `study.title` | Área de estudo | Study area |
| `tabs.campaign` | Campanha global | Global campaign |
| `tabs.local` | Missão local | Local mission |
| `tabs.risk` | Mapa de risco | Risk map |
| `tabs.study` | Área de estudo | Study area |
