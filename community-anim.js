/* community-anim.js — animaciones de entrada al hacer scroll */
(function () {
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
 
  // [selector, animación, retraso entre elementos (s)]
  var map = [
    ['.tribe .lbl',      'rv-left',  0],
    ['.tribe h1',        'rv-left',  .1],
    ['.tribe .d',        'rv-blur',  .25],
    ['.tribe .cta',      'rv-up',    .35],
    ['.tribe .stats',    'rv-right', .45],
 
    ['.teams .lbl',      'rv-left',  0],
    ['.teams h2',        'rv-left',  .1],
    ['.teams .sub',      'rv-right', .2],
    ['.tf-pills button', 'rv-pop',   .07],
    ['.tg .tm',          'rv-up',    .1],
 
    ['.ath .lbl',        'rv-right', 0],
    ['.ath h2',          'rv-right', .1],
    ['.ath .sub',        'rv-left',  .2],
    ['.ag .at',          'alt',      .12],   // alterna: izquierda / giro 3D / derecha
 
    ['.ct h2',           'rv-zoom',  0],
    ['.ct .q',           'rv-rotate',.1]
  ];
 
  var all = [];
 
  map.forEach(function (m) {
    document.querySelectorAll(m[0]).forEach(function (el, i) {
      var cls = m[1];
      if (cls === 'alt') cls = ['rv-left', 'rv-flip', 'rv-right'][i % 3];
      el.classList.add(cls);
      el.dataset.rv = cls;
      el.style.setProperty('--d', (i * m[2]) + 's');
      all.push(el);
    });
  });
 
  var dash = document.querySelector('.dash');
  if (dash) all.push(dash);
 
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('is-in');
      io.unobserve(el);
 
      // Al terminar la entrada, se quita la clase rv-* para que
      // vuelvan los efectos hover normales (tarjetas, pills).
      if (el.dataset.rv) {
        var delay = parseFloat(el.style.getPropertyValue('--d')) || 0;
        setTimeout(function () {
          el.classList.remove(el.dataset.rv, 'is-in');
        }, (delay + .8) * 1000 + 120);
      }
    });
  }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
 
  all.forEach(function (el) { io.observe(el); });
})();