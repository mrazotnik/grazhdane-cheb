(function () {
  'use strict';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var head = document.querySelector('.head'), tick = 0;
  function paintHead() {
    tick = 0;
    head.style.setProperty('--p', Math.min(1, scrollY / 120).toFixed(3));
  }
  addEventListener('scroll', function () {
    if (!tick) tick = requestAnimationFrame(paintHead);
  }, { passive: true });
  paintHead();
  var items = [].slice.call(document.querySelectorAll('[data-anim]'));
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (es, obs) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -5% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }
  (function headGate() {
    var cover = document.querySelector('.cover');
    if (!cover) { head.classList.add('head--on'); return; }
    if (!('IntersectionObserver' in window)) { head.classList.add('head--on'); return; }
    new IntersectionObserver(function (es) {
      head.classList.toggle('head--on', !es[0].isIntersecting);
    }, { threshold: 0, rootMargin: '-45% 0px 0px 0px' }).observe(cover);
  })();
  (function cardLeaves() {
    var track = document.getElementById('track');
    if (!track) return;
    var leaves = [].slice.call(track.children),
        tabs = document.getElementById('dots'),
        cur = 0;
    leaves.forEach(function (leaf, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'card__tab';
      b.textContent = leaf.getAttribute('aria-label');
      b.addEventListener('click', function () { go(i); });
      tabs.appendChild(b);
    });
    var anim;
    function fit(i) {
      var h = leaves[i].getBoundingClientRect().height;
      if (h) track.style.height = Math.round(h) + 'px';
    }
    function go(i) {
      i = Math.max(0, Math.min(leaves.length - 1, i));
      var to = leaves[i].offsetLeft - track.offsetLeft, from = track.scrollLeft;
      if (Math.abs(to - from) < 1) return;
      cancelAnimationFrame(anim);
      if (reduced) { track.scrollLeft = to; fit(i); return; }
      var t0 = performance.now(), ms = 560;
      track.style.scrollSnapType = 'none';
      (function step(now) {
        var k = Math.min(1, (now - t0) / ms);
        track.scrollLeft = from + (to - from) * (1 - Math.pow(1 - k, 3));
        if (k < 1) { anim = requestAnimationFrame(step); }
        else { track.style.scrollSnapType = ''; fit(i); }
      })(t0);
    }
    function paint() {
      var mid = track.scrollLeft + track.clientWidth / 2, best = 0, dist = Infinity;
      leaves.forEach(function (leaf, i) {
        var c = leaf.offsetLeft - track.offsetLeft + leaf.offsetWidth / 2, d = Math.abs(c - mid);
        if (d < dist) { dist = d; best = i; }
      });
      cur = best;
      [].forEach.call(tabs.children, function (t, i) {
        t.setAttribute('aria-current', i === cur ? 'true' : 'false');
      });
      var act = tabs.children[cur];               // на узком экране лента вкладок
      if (act && tabs.scrollWidth > tabs.clientWidth + 4) {
        var l = act.offsetLeft - tabs.offsetLeft, r = l + act.offsetWidth;
        if (l < tabs.scrollLeft) tabs.scrollLeft = l - 12;
        else if (r > tabs.scrollLeft + tabs.clientWidth) tabs.scrollLeft = r - tabs.clientWidth + 12;
      }
    }
    var raf = 0, rest;
    track.addEventListener('scroll', function () {
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; paint(); });
      clearTimeout(rest);
      rest = setTimeout(function () { fit(cur); }, 140);
    }, { passive: true });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
    });
    addEventListener('resize', function () { fit(cur); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit(cur); });
    [].forEach.call(track.querySelectorAll('img'), function (im) {
      if (!im.complete) im.addEventListener('load', function () { fit(cur); }, { once: true });
    });
    paint();
    fit(0);
  })();
})();
