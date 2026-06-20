/* mapas_index.js — catálogo estático dos mapas do F3
 *
 * O arquivo organiza os caminhos esperados para os PNGs derivados dos PDFs dos
 * resultados. Se os arquivos não existirem localmente, a aba F3 continua útil
 * com fallback visual e mensagem de asset ausente.
 */
window.PPP = window.PPP || {};
window.PPP_MAPAS = window.PPP_MAPAS || {
  title: 'Modelagem do mapa de risco',
  subtitle: 'Grade estática 3 linhas × colunas com soma ponderada MCDA e máscara Ω.',
  formula: 'R(i) = Σ_k w_k · x_k(i)',
  source: 'Pesos renormalizados do plano F3',
  groups: [
    {
      key: 'topo',
      label: 'Topográficos',
      weight: 0.237,
      note: 'T1–T3 entram na soma ponderada; T4 define a máscara Ω.',
      items: [
        { id: 't1', code: 'T1', label: 'Elevação', weight: 0.138, image: 'data/mapas/topograficos/1_Elevacao_T1.png', pdf: '../../../figuras/RESULTADOS/mapas/topograficos/1_Mapa_Elevacao_T1_crop.pdf' },
        { id: 't2', code: 'T2', label: 'Declividade', weight: 0.054, image: 'data/mapas/topograficos/2_Declividade_T2.png', pdf: '../../../figuras/RESULTADOS/mapas/topograficos/2_Mapa_declividade_T2_crop.pdf' },
        { id: 't3', code: 'T3', label: 'Exposição', weight: 0.045, image: 'data/mapas/topograficos/3_Exposicao_T3.png', pdf: '../../../figuras/RESULTADOS/mapas/topograficos/3_Mapa_exposicao_T3_crop.pdf' }
      ],
      mask: { code: 'T4', label: 'Uso e cobertura', note: 'Máscara de domínio Ω; não entra na soma.', image: 'data/mapas/topograficos/4_Uso_e_cobertura_T4.png', pdf: '../../../figuras/RESULTADOS/mapas/topograficos/4_Mapa_uso_e_cobertura_T4_crop.pdf' }
    },
    {
      key: 'meteo',
      label: 'Meteorológicos',
      weight: 0.262,
      note: 'Conjunto climático que modula o risco com chuva, temperatura, vento e umidade.',
      items: [
        { id: 'm1', code: 'M1', label: 'Precipitação', weight: 0.064, image: 'data/mapas/metereologicos/5_Precipitacao_M1.png', pdf: '../../../figuras/RESULTADOS/mapas/metereologicos/5_Mapa_precipitacao_media_M1_crop.pdf' },
        { id: 'm2', code: 'M2', label: 'Temp. superfície', weight: 0.055, image: 'data/mapas/metereologicos/6_Temp_superficie_M2.png', pdf: '../../../figuras/RESULTADOS/mapas/metereologicos/6_temp_superf_terrestre_M2_crop.pdf' },
        { id: 'm3', code: 'M3', label: 'Temp. do ar', weight: 0.028, image: 'data/mapas/metereologicos/7_Temp_ar_M3.png', pdf: '../../../figuras/RESULTADOS/mapas/metereologicos/7_Mapa_Temp_media_ar_M3_crop.pdf' },
        { id: 'm4', code: 'M4', label: 'Vento', weight: 0.057, image: 'data/mapas/metereologicos/8_Vento_M4.png', pdf: '../../../figuras/RESULTADOS/mapas/metereologicos/8_Mapa_Vel_media_vento_M4_crop.pdf' },
        { id: 'm5', code: 'M5', label: 'Umidade relativa', weight: 0.058, image: 'data/mapas/metereologicos/9_Umidade_M5.png', pdf: '../../../figuras/RESULTADOS/mapas/metereologicos/9_Mapa_umidade_relativa_M5_crop.pdf' }
      ]
    },
    {
      key: 'fuel',
      label: 'Combustível',
      weight: 0.501,
      note: 'Indicadores de combustível e estrutura da vegetação, com maior peso no conjunto.',
      items: [
        { id: 'v1', code: 'V1', label: 'FVC', weight: 0.094, image: 'data/mapas/combustivel/10_FVC_V1.png', pdf: '../../../figuras/RESULTADOS/mapas/combustivel/10_Mapa_Cobertura_fracio_veg_V1_F1mxd_crop.pdf' },
        { id: 'v2', code: 'V2', label: 'NDVI', weight: 0.103, image: 'data/mapas/combustivel/11_NDVI_V2.png', pdf: '../../../figuras/RESULTADOS/mapas/combustivel/11_Mapa_NDVI_V2_F2mxd_crop.pdf' },
        { id: 'v3', code: 'V3', label: 'Tipo de vegetação', weight: 0.168, image: 'data/mapas/combustivel/12_Tipo_veg_V3.png', pdf: '../../../figuras/RESULTADOS/mapas/combustivel/12_Mapa_Tipo_vegetacao_V3_F3mxd_crop.pdf' },
        { id: 'v4', code: 'V4', label: 'Altura do dossel', weight: 0.136, image: 'data/mapas/combustivel/13_Alt_dossel_V4.png', pdf: '../../../figuras/RESULTADOS/mapas/combustivel/13_Mapa_Alt_media_dossel_V4_F4mxd_crop.pdf' }
      ]
    }
  ],
  result: {
    label: 'Mapa MCDA',
    image: 'data/mapas/mcda.png',
    pdf: '../../../figuras/RESULTADOS/mapas/14_Mapa_MCDA.pdf'
  },
  validation: {
    label: 'Frequência de queimadas',
    image: 'data/mapas/frequencia.png',
    pdf: '../../../figuras/RESULTADOS/mapas/15_Mapa_frequencia_queimadas_crop.pdf'
  }
};
