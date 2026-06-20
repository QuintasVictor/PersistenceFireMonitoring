/* style3d.js - regra de imagem 3D (padrao unico para todas as vistas 3D)
 *
 * Fonte unica da angulacao e do acabamento das superficies 3D do showcase.
 * A vista principal segue a referencia visual: lateral angulada, com azimute
 * em torno de 45 graus no eixo Z e elevacao de 30 graus olhando de cima.
 *
 * Padrao principal: view(45, 30). Use estes valores para fitness landscapes,
 * mosaicos 3D e converge panoramico; nao hardcode angulos nos renderizadores.
 * Corte lateral tecnico do converge v3: view(-89.5, 6).
 */
window.PPP = window.PPP || {};
(function (P) {
  P.style3d = {
    /* vista lateral angulada padrao (fitness landscape e converge) */
    az: 45,
    el: 30,
    /* corte lateral (perfil) - usado pelo converge v3 */
    profile: { az: -89.5, el: 6 },
    /* superficie */
    height: 0.42,      // escala de Z relativa a extensao XY
    smooth: 2,         // passos de box-blur
    step: 2,           // downsample da malha
    /* acabamento de imagem */
    radius: 14,        // cantos arredondados em px
    pad: 0.07,         // margem relativa dentro do canvas

    /* aplica recorte de cantos arredondados ao contexto */
    roundedClip: function (ctx, w, h, r) {
      r = r == null ? this.radius : r;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.arcTo(w, 0, w, h, r);
      ctx.arcTo(w, h, 0, h, r);
      ctx.arcTo(0, h, 0, 0, r);
      ctx.arcTo(0, 0, w, 0, r);
      ctx.closePath();
      ctx.clip();
    }
  };
})(window.PPP);
