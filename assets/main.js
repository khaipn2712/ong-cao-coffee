(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = function () { return root.lang === 'en' ? 'en' : 'vi'; };

  /* ---------- Cuộn mượt có quán tính (học Lenis trên trang Delta) ----------
     Chỉ nhận con lăn chuột và bàn di chuột. Chạm, bàn phím, kéo thanh cuộn và liên kết neo
     vẫn dùng cuộn gốc của trình duyệt. Mọi hiệu ứng theo cuộn nhờ vậy chạy chung một nhịp êm. */
  var smooth = (function () {
    var api = { on: false, busy: function () { return false; } };
    if (reduceMotion) return api;
    var TAU = 120;                       // ms: càng lớn càng "trôi"
    var cur = window.scrollY, target = cur, lastSet = cur, raf = null, lastT = null;
    function maxY() { return document.documentElement.scrollHeight - window.innerHeight; }
    // Con trỏ đang ở trên một vùng tự cuộn được (dải kéo ngang, danh sách...) thì để vùng đó tự cuộn
    function ownScroller(el, vertical) {
      for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
        if (el.nodeType !== 1) continue;
        var cs = getComputedStyle(el);
        if (vertical ? (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1)
                     : (/(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1)) return true;
      }
      return false;
    }
    function step(t) {
      // Có nguồn khác vừa cuộn trang (neo, tự căn khung, bàn phím): nhường lại ngay
      if (Math.abs(window.scrollY - lastSet) > 2) { cur = target = lastSet = window.scrollY; raf = null; lastT = null; return; }
      var dt = lastT === null ? 16 : Math.min(t - lastT, 50); lastT = t;
      cur += (target - cur) * (1 - Math.exp(-dt / TAU));
      if (Math.abs(target - cur) < 0.4) cur = target;
      window.scrollTo({ top: cur, behavior: 'instant' });
      lastSet = cur;
      if (cur === target) { raf = null; lastT = null; } else raf = requestAnimationFrame(step);
    }
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.defaultPrevented) return;
      var dy = e.deltaY, dx = e.deltaX;
      if (e.deltaMode === 1) { dy *= 16; dx *= 16; } else if (e.deltaMode === 2) { dy *= window.innerHeight; }
      if (Math.abs(dx) > Math.abs(dy)) return;            // vuốt ngang: để trình duyệt xử lý
      if (ownScroller(e.target, true)) return;
      e.preventDefault();
      if (!raf) { cur = target = lastSet = window.scrollY; }
      target = Math.max(0, Math.min(maxY(), target + dy));
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: false });
    api.on = true;
    api.busy = function () { return !!raf; };
    return api;
  })();

  /* ---------- Ngôn ngữ VI / EN ---------- */
  var langButtons = document.querySelectorAll('[data-set-lang]');
  function setLang(next) {
    root.lang = next;
    langButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setLang === next)); });
    try { localStorage.setItem('ongcao-lang', next); } catch (e) {}
    renderSeason();
  }
  langButtons.forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.setLang); });
  });

  /* ---------- Ghi chú bản thử ---------- */
  var note = document.getElementById('draftNote');
  var draftClose = document.getElementById('draftClose');
  if (note && draftClose) draftClose.addEventListener('click', function () {
    note.hidden = true;
    try { sessionStorage.setItem('oc-draft-closed', '1'); } catch (e) {}
  });

  /* ---------- Header khi cuộn ---------- */
  var header = document.getElementById('header');
  function onScrollHeader() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- Menu điện thoại ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) { nav.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  });

  /* ---------- Hero: 3 cảnh, thanh tiến trình, giai đoạn trái cà phê ---------- */
  var hero = document.getElementById('hero');
  if (hero) {
  var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero__slide'));
  var scenes = Array.prototype.slice.call(hero.querySelectorAll('.hero__scene'));
  var thumbs = Array.prototype.slice.call(hero.querySelectorAll('#heroThumbs .thumb'));
  var fills = thumbs.map(function (t) { return t.querySelector('.thumb__fill'); });
  var stageLayers = hero.querySelectorAll('.hero__stage');
  var stageChips = hero.querySelectorAll('#heroStages li:not([role="presentation"])');
  var stageList = document.getElementById('heroStages');
  var stagePill = stageList.querySelector('.hero__stages-pill');
  var stageLeads = hero.querySelectorAll('#heroStageLead .hero__lead-item');
  // Viên sáng trượt tới đúng vị trí và độ rộng của giai đoạn đang hiện
  function placeStagePill() {
    var chip = stageChips[curStage];
    if (!chip) return;
    stagePill.style.setProperty('--pill-x', chip.offsetLeft + 'px');
    stagePill.style.setProperty('--pill-w', chip.offsetWidth + 'px');
  }
  if ('ResizeObserver' in window) new ResizeObserver(placeStagePill).observe(stageList);
  var pauseBtn = document.getElementById('heroPause');
  var STAGE_SLIDE = 1;
  var idx = 0, elapsed = 0, last = null, curStage = 0, prevStage = 0;
  var userPaused = reduceMotion, hoverPaused = false;

  function duration(i) { return Number(slides[i].dataset.duration) || 7000; }
  slides.forEach(function (s, i) { s.style.setProperty('--slide-dur', duration(i) / 1000 + 's'); });

  function setStage(n) {
    curStage = n;
    stageLayers.forEach(function (l, k) { l.classList.toggle('is-on', k === n); });
    stageChips.forEach(function (c, k) {
      c.classList.toggle('is-on', k === n);
      if (k === n) c.setAttribute('aria-current', 'step'); else c.removeAttribute('aria-current');
    });
    stageLeads.forEach(function (lead, k) {
      lead.classList.toggle('is-on', k === n);
      if (k === n) lead.removeAttribute('aria-hidden'); else lead.setAttribute('aria-hidden', 'true');
    });
    // Viên sáng nháy nhẹ khi chuyển sang mục khác (chạy lại hiệu ứng mỗi lần đổi)
    if (prevStage !== n && !reduceMotion) {
      stagePill.classList.remove('is-blink');
      void stagePill.offsetWidth;
      stagePill.classList.add('is-blink');
    }
    prevStage = n;
    placeStagePill();
  }

  function go(i) {
    idx = (i + slides.length) % slides.length;
    elapsed = 0;
    slides.forEach(function (s, k) { s.classList.toggle('is-active', k === idx); });
    scenes.forEach(function (s, k) {
      var on = k === idx;
      s.classList.toggle('is-active', on);
      s.inert = !on;
    });
    thumbs.forEach(function (t, k) {
      t.classList.toggle('is-active', k === idx);
      if (k === idx) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
      fills[k].style.transform = 'scaleX(' + (k < idx ? 1 : 0) + ')';
    });
    setStage(0);
  }

  function frame(t) {
    if (last === null) last = t;
    var dt = Math.min(t - last, 100);
    last = t;
    if (!userPaused && !hoverPaused) elapsed += dt;
    var p = Math.min(elapsed / duration(idx), 1);
    fills[idx].style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (idx === STAGE_SLIDE) {
      var n = Math.min(Math.floor(p * stageLayers.length), stageLayers.length - 1);
      if (n !== curStage) setStage(n);
    }
    if (p >= 1) go(idx + 1);
    requestAnimationFrame(frame);
  }

  var pauseWave = null; // icon sóng trên nút tạm dừng (tạo sau khi có makeWave)
  function syncPaused() {
    var paused = userPaused || hoverPaused;
    hero.classList.toggle('is-paused', paused);
    if (pauseWave) pauseWave.setLive(!paused);
  }

  var PAUSE_TEXT = { pause: { vi: 'Tạm dừng', en: 'Pause' }, play: { vi: 'Phát tiếp', en: 'Play' } };
  function renderPause() {
    var t = userPaused ? PAUSE_TEXT.play : PAUSE_TEXT.pause;
    pauseBtn.setAttribute('aria-pressed', String(userPaused));
    pauseBtn.querySelector('[lang="vi"]').textContent = t.vi;
    pauseBtn.querySelector('[lang="en"]').textContent = t.en;
  }
  pauseBtn.addEventListener('click', function () {
    userPaused = !userPaused;
    renderPause();
    syncPaused();
  });

  thumbs.forEach(function (t, k) { t.addEventListener('click', function () { go(k); }); });

  // Tạm dừng khi người xem đang rê chuột hoặc dùng bàn phím ở thẻ kính / ảnh nhỏ
  function holdWhileUsing(el) {
    el.addEventListener('mouseenter', function () { hoverPaused = true; syncPaused(); });
    el.addEventListener('mouseleave', function () { hoverPaused = false; syncPaused(); });
    el.addEventListener('focusin', function () { hoverPaused = true; syncPaused(); });
    el.addEventListener('focusout', function () { hoverPaused = false; syncPaused(); });
  }
  holdWhileUsing(document.querySelector('.hero__thumbs'));

  go(0);
  renderPause();
  pauseWave = makeWave(pauseBtn);
  syncPaused();
  requestAnimationFrame(frame);

  /* ---------- Thẻ kính: hiện lần lượt, hai ô tự đổi mặt ---------- */
  var glass = document.getElementById('glass');
  var glassHover = false;
  holdWhileUsing(glass);
  glass.addEventListener('mouseenter', function () { glassHover = true; });
  glass.addEventListener('mouseleave', function () { glassHover = false; });
  glass.addEventListener('focusin', function () { glassHover = true; });
  glass.addEventListener('focusout', function () { glassHover = false; });
  setTimeout(function () { glass.classList.add('is-in'); }, reduceMotion ? 0 : 450);

  var rotating = Array.prototype.slice.call(glass.querySelectorAll('[data-rotate]'));
  rotating.forEach(function (cell) {
    cell.querySelectorAll('.glass__face').forEach(function (f) { f.inert = !f.classList.contains('is-on'); });
  });
  function flip(cell) {
    var faces = cell.querySelectorAll('.glass__face');
    var cur = Array.prototype.findIndex.call(faces, function (f) { return f.classList.contains('is-on'); });
    var next = (cur + 1) % faces.length;
    faces.forEach(function (f, k) { f.classList.toggle('is-on', k === next); f.inert = k !== next; });
  }
  if (!reduceMotion) {
    var tick = 0;
    setInterval(function () {
      if (glassHover || userPaused || document.hidden) return;
      flip(rotating[tick % rotating.length]);
      tick += 1;
    }, 3000);
  }
  }

  /* ---------- Viền kính sáng theo con trỏ (kiểu Liquid Glass) ---------- */
  // Mỗi thẻ kính có một dải sáng chạy dọc viền. Góc của dải luôn hướng về con trỏ,
  // trượt mượt theo đường ngắn nhất; con trỏ đi nhanh thì dải dày và dài hơn rồi co lại.
  // Kiểm tra theo từng lần di chuyển (không chỉ một lần lúc tải trang): chỉ chạy với chuột hoặc bút,
  // và tắt nếu máy đang bật giảm chuyển động.
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function lightAllowed(e) { return !motionQuery.matches && (e.pointerType === 'mouse' || e.pointerType === 'pen'); }
  var LIGHT_REST = { la: 315, w: 0.5, rim: 1, arc: 30, gx: 20, gy: 0 };
  // Áp dụng cho mọi vùng có data-light (hero, dải mùa vụ...)
  function setupLight(zone) {
    var lights = [];
    // Thu mọi thẻ kính chưa có viền sáng (gọi lại được khi trang vẽ thêm thẻ kính mới)
    function collect() {
      Array.prototype.forEach.call(zone.querySelectorAll('.lg:not([data-lit])'), function (el) {
        el.setAttribute('data-lit', '');
        var rim = document.createElement('span');
        rim.className = 'lg-rim';
        rim.setAttribute('aria-hidden', 'true');
        el.appendChild(rim);
        lights.push({
          el: el, off: false,
          cur: { la: LIGHT_REST.la, w: LIGHT_REST.w, rim: LIGHT_REST.rim, arc: LIGHT_REST.arc, gx: LIGHT_REST.gx, gy: LIGHT_REST.gy },
          tgt: { la: LIGHT_REST.la, w: LIGHT_REST.w, rim: LIGHT_REST.rim, arc: LIGHT_REST.arc, gx: LIGHT_REST.gx, gy: LIGHT_REST.gy }
        });
      });
    }
    collect();
    refreshLights = collect;

    {
      var px = 0, py = 0, lastMove = 0, lastX = 0, lastY = 0, running = false, inside = false;

      function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
      function angleDiff(a, b) { return ((b - a + 540) % 360) - 180; }

      function aim(speed) {
        var vh = window.innerHeight;
        lights.forEach(function (L) {
          var r = L.el.getBoundingClientRect();
          L.off = !r.width || r.bottom < -40 || r.top > vh + 40;
          if (L.off) return;
          var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          // Góc từ tâm thẻ tới con trỏ, theo quy ước của conic-gradient (0deg = phía trên)
          var la = (Math.atan2(px - cx, -(py - cy)) * 180 / Math.PI + 360) % 360;
          var dx = Math.max(r.left - px, 0, px - r.right);
          var dy = Math.max(r.top - py, 0, py - r.bottom);
          var dist = Math.sqrt(dx * dx + dy * dy);
          L.tgt.la = la;
          L.tgt.w = clamp(1 - dist / 420, 0.55, 1);
          L.tgt.gx = clamp((px - r.left) / r.width * 100, -10, 110);
          L.tgt.gy = clamp((py - r.top) / r.height * 100, -10, 110);
          // Di chuyển nhanh: dải sáng dày và dài hơn
          L.tgt.rim = Math.max(L.tgt.rim, 1 + clamp(speed * 0.6, 0, 0.8));
          L.tgt.arc = Math.max(L.tgt.arc, 30 + clamp(speed * 22, 0, 26));
        });
      }

      // Làm mượt theo thời gian thật (không phụ thuộc số khung hình mỗi giây)
      var lastT = null;
      function ease(tau, dt) { return 1 - Math.exp(-dt / tau); }

      function step(t) {
        var dt = lastT === null ? 16 : Math.min(t - lastT, 80);
        lastT = t;
        var kAngle = ease(110, dt), kGlow = ease(160, dt), kRim = ease(70, dt), kDecay = ease(280, dt), kSheen = ease(120, dt);
        var busy = false;
        lights.forEach(function (L) {
          if (L.off) return;
          var c = L.cur, g = L.tgt;
          // Độ dày và độ dài cung tự co lại khi con trỏ chậm hoặc dừng
          g.rim += (LIGHT_REST.rim - g.rim) * kDecay;
          g.arc += (LIGHT_REST.arc - g.arc) * kDecay;
          var d = angleDiff(c.la, g.la);
          c.la = (c.la + d * kAngle + 360) % 360;
          c.w += (g.w - c.w) * kGlow;
          c.rim += (g.rim - c.rim) * kRim;
          c.arc += (g.arc - c.arc) * kRim;
          c.gx += (g.gx - c.gx) * kSheen;
          c.gy += (g.gy - c.gy) * kSheen;
          if (Math.abs(d) > 0.1 || Math.abs(g.w - c.w) > 0.003 || Math.abs(c.rim - LIGHT_REST.rim) > 0.02 ||
              Math.abs(c.arc - LIGHT_REST.arc) > 0.1 || Math.abs(g.gx - c.gx) > 0.1 || Math.abs(g.gy - c.gy) > 0.1) busy = true;
          var s = L.el.style;
          s.setProperty('--la', c.la.toFixed(1) + 'deg');
          s.setProperty('--lgw', c.w.toFixed(3));
          s.setProperty('--rimw', c.rim.toFixed(2) + 'px');
          s.setProperty('--arc', c.arc.toFixed(1) + 'deg');
          s.setProperty('--gx', c.gx.toFixed(1) + '%');
          s.setProperty('--gy', c.gy.toFixed(1) + '%');
        });
        if (busy) requestAnimationFrame(step); else { running = false; lastT = null; }
      }
      function kick() { if (!running) { running = true; requestAnimationFrame(step); } }

      zone.addEventListener('pointermove', function (e) {
        if (!lightAllowed(e)) return;
        var now = performance.now();
        var dt = Math.max(now - lastMove, 8);
        var speed = Math.sqrt(Math.pow(e.clientX - lastX, 2) + Math.pow(e.clientY - lastY, 2)) / dt; // px mỗi ms
        lastMove = now; lastX = e.clientX; lastY = e.clientY;
        px = e.clientX; py = e.clientY; inside = true;
        aim(Math.min(speed, 3));
        kick();
      });
      zone.addEventListener('pointerleave', function () {
        inside = false;
        lights.forEach(function (L) {
          L.tgt.la = LIGHT_REST.la; L.tgt.w = LIGHT_REST.w; L.tgt.gx = LIGHT_REST.gx; L.tgt.gy = LIGHT_REST.gy;
        });
        kick();
      });
      // Khi cuộn trang, vị trí thẻ đổi so với con trỏ: tính lại góc
      window.addEventListener('scroll', function () { if (inside) { aim(0); kick(); } }, { passive: true });
    }
  }
  var refreshLights = function () {};
  setupLight(document.documentElement);

  /* ---------- Dữ liệu các giai đoạn trong năm ---------- */
  // Nội dung tạm: gia đình cần xác nhận tháng, mô tả và ảnh thật cho từng giai đoạn.
  var STAGES = [
    {
      status: { vi: 'Vườn Đức An đang trắng hoa', en: 'The orchard in Đức An is white with blossom' },
      title: { vi: 'Mùa hoa nở, tháng 2–3', en: 'Blossom season, Feb–Mar' },
      lead: { vi: 'Giữa mùa khô, sau những đợt tưới cây, hoa trắng nở kín cành và thơm khắp nông trại trong vài ngày, như lời chào của mùa mới.',
              en: 'In the middle of the dry season, after the watering of the trees, white blossom covers every branch and perfumes the farm for a few days, a greeting from the new season.' },
      photos: [
        { c: 'var(--leaf-400)', vi: 'Cành trắng hoa', en: 'Branches in white' },
        { c: 'var(--sky-500)', vi: 'Tưới trước mùa hoa', en: 'Watering before the bloom' },
        { c: 'var(--leaf-300)', vi: 'Ong ghé về vườn', en: 'Bees come to the orchard' }
      ]
    },
    {
      status: { vi: 'Từng quả non đang lớn dần trên cành', en: 'Young cherries are swelling on the branches' },
      title: { vi: 'Mùa nuôi quả, tháng 4–10', en: 'Growing season, Apr–Oct' },
      lead: { vi: 'Mùa mưa, quả căng dần trên cành. Cả nhà làm cỏ, bón phân, tỉa cành để cây giữ sức, và chăm lúa, ngô, khoai bên cạnh.',
              en: 'In the rainy season the cherries fill out. The family weeds, feeds and prunes so the trees keep their strength, and tends the rice, corn and sweet potato alongside.' },
      photos: [
        { c: 'var(--leaf-700)', vi: 'Chùm quả xanh', en: 'Green cherries in clusters' },
        { c: 'var(--leaf-600)', vi: 'Làm cỏ giữa các hàng', en: 'Weeding between the rows' },
        { c: 'var(--slate-500)', vi: 'Mưa chiều phủ nông trại', en: 'Afternoon rain over the farm' }
      ]
    },
    {
      status: { vi: 'Mùa hái đang vào ở Đức An', en: 'Harvest is under way in Đức An' },
      title: { vi: 'Mùa chín và hái, tháng 11–1', en: 'Harvest season, Nov–Jan' },
      lead: { vi: 'Quả dần đổi sang đỏ thắm. Cả nhà chỉ hái quả đã chín, đi nhiều lượt trên mỗi cây, như đợi từng quả tự chín đến đúng lúc.',
              en: 'The cherries turn a deep red. The family picks only what is ripe, going over each tree several times, as if waiting for every cherry to finish ripening in its own time.' },
      photos: [
        { c: 'var(--cherry-700)', vi: 'Quả đỏ trên cành', en: 'Ripe red on the branch', date: '12/11' },
        { c: 'var(--leaf-700)', vi: 'Gùi cà phê vừa hái', en: 'A basket just picked', date: '10/11' },
        { c: 'var(--honey-400)', vi: 'Mẻ đầu trên sân phơi', en: 'The first batch on the drying yard', date: '08/11' }
      ]
    },
    {
      status: { vi: 'Sân phơi đang đầy nắng và gió', en: 'The drying yard is full of sun and wind' },
      title: { vi: 'Mùa phơi, tháng 12–2', en: 'Drying season, Dec–Feb' },
      lead: { vi: 'Quả vừa hái được trải đều trên sân phơi, dưới nắng và gió cao nguyên. Mỗi ngày được đảo bằng tay cho đến khi khô đều, không vội.',
              en: 'Freshly picked cherries are spread across the yard under the highland sun and wind, and turned by hand each day until they dry evenly, with no rush.' },
      photos: [
        { c: 'var(--honey-400)', vi: 'Sân phơi lúc bình minh', en: 'The yard at dawn' },
        { c: 'var(--sun-600)', vi: 'Đảo cà phê bằng cào', en: 'Raking the cherries' },
        { c: 'var(--sun-500)', vi: 'Thử độ khô bằng tay', en: 'Testing dryness by hand' }
      ]
    },
    {
      status: { vi: 'Xưởng nhỏ đang bốc hương', en: 'The little roastery is sending up its aroma' },
      title: { vi: 'Rang, quanh năm', en: 'Roasting, all year' },
      lead: { vi: 'Hạt khô được tách vỏ, rang từng mẻ nhỏ trong xưởng của gia đình quanh năm, rồi đóng gói khi mùi thơm vừa lên.',
              en: 'Dried beans are hulled and roasted in small batches in the family roastery all year, then packed while the aroma is at its peak.' },
      photos: [
        { c: 'var(--slate-400)', vi: 'Hạt sau khi tách vỏ', en: 'Green beans after hulling' },
        { c: 'var(--sun-600)', vi: 'Mẻ rang buổi sáng', en: 'The morning roast' },
        { c: 'var(--slate-500)', vi: 'Đóng gói ngay tại xưởng', en: 'Packing at the roastery' }
      ]
    }
  ];
  var STAGE_TEXT = {
    now: { vi: 'bây giờ', en: 'now' },
    pastSeason: { vi: 'mùa trước', en: 'last season' },
    live: { vi: 'Đang diễn ra', en: 'Live' }
  };

  // Tháng của từng giai đoạn (tạm). Giai đoạn hiện tại: giai đoạn đầu tiên khớp tháng này,
  // bỏ qua "Rang" vì diễn ra quanh năm.
  var STAGE_MONTHS = [[2, 3], [4, 5, 6, 7, 8, 9, 10], [11, 12, 1], [12, 1, 2], null];
  var month = new Date().getMonth() + 1;
  var nowIdx = STAGE_MONTHS.findIndex(function (m) { return m && m.indexOf(month) > -1; });
  if (nowIdx < 0) nowIdx = STAGE_MONTHS.length - 1;

  /* ---------- Icon sóng "đang diễn ra" ---------- */
  // Một đường sóng có đỉnh lớn ở giữa, chạy liên tục và "thở" nhẹ.
  // Khi người xem đang xem giai đoạn khác, sóng lặng dần thành đường thẳng.
  function makeWave(host) {
    var path = host.querySelector('path');
    var W = 44, H = 22, N = 44;
    var amp = 1, ampTarget = 1, phase = 0, last = null, visible = true, rafId = null;
    function draw(t) {
      var breathe = 0.82 + 0.18 * Math.sin(t / 700);
      var d = '';
      for (var i = 0; i <= N; i++) {
        var x = 2 + (W - 4) * i / N;
        var u = i / N;
        var env = Math.exp(-Math.pow((u - 0.58) / 0.16, 2)) + 0.18 * Math.exp(-Math.pow((u - 0.25) / 0.12, 2));
        var y = H / 2 - Math.sin(u * 18 - phase) * env * 8 * amp * breathe;
        d += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
      }
      path.setAttribute('d', d);
    }
    function loop(t) {
      if (last === null) last = t;
      var dt = Math.min(t - last, 80); last = t;
      phase += dt * 0.006;
      amp += (ampTarget - amp) * (1 - Math.exp(-dt / 260));
      draw(t);
      rafId = visible ? requestAnimationFrame(loop) : null;
    }
    function start() { if (!rafId && !reduceMotion) { last = null; rafId = requestAnimationFrame(loop); } }
    if (reduceMotion) { draw(0); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }).observe(host);
    } else { start(); }
    return {
      setLive: function (live) {
        ampTarget = live ? 1 : 0.06;
        host.classList.toggle('is-paused', !live);
        if (reduceMotion) { amp = ampTarget; draw(0); }
      }
    };
  }
  // Vẽ lại các phần phụ thuộc ngôn ngữ (section hành trình gắn thêm vào hàm này)
  function renderSeason() {
    var glassSeason = document.getElementById('glassSeason');
    if (glassSeason) glassSeason.textContent = STAGES[nowIdx].status[lang()];
  }
  renderSeason();

  /* ---------- Section hành trình: một năm trên đường lượn ---------- */
  (function () {
    var section = document.getElementById('hanh-trinh');
    if (!section) return;
    var btns = Array.prototype.slice.call(section.querySelectorAll('.jnode'));
    var layers = Array.prototype.slice.call(section.querySelectorAll('.journey__layer'));
    var prints = Array.prototype.slice.call(section.querySelectorAll('.print'));
    var stageEl = document.getElementById('journeyStage');
    var leadEl = document.getElementById('journeyLead');
    var kickerEl = document.getElementById('journeyKicker');
    var backBtn = document.getElementById('journeyBack');
    var track = document.getElementById('journeyTrack');
    var done = document.getElementById('journeyDone');
    var sparks = Array.prototype.slice.call(section.querySelectorAll('.journey__spark'));
    var linkPath = document.getElementById('journeyLink');
    var routePath = document.getElementById('journeyRoute');
    var etaEl = document.getElementById('journeyEta');
    var jWave = makeWave(document.getElementById('journeyWave'));
    var NODES = [[100, 300], [300, 140], [500, 300], [700, 140], [900, 300]];
    var TEXT = {
      live: { vi: 'Đang diễn ra', en: 'Happening now' },
      past: { vi: 'Xem lại giai đoạn', en: 'Another stage' },
      today: { vi: 'Hôm nay', en: 'Today' }
    };
    var today = new Date();
    var view = nowIdx;

    function todayLabel(l) {
      var d = today.getDate(), m = today.getMonth() + 1;
      if (l === 'en') {
        var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return TEXT.today.en + ', ' + MONTHS[m - 1] + ' ' + d;
      }
      return TEXT.today.vi + ', ' + (d < 10 ? '0' : '') + d + '/' + (m < 10 ? '0' : '') + m;
    }

    // Độ dài đường tính tới từng vòng tròn
    var total = track.getTotalLength();
    var nodeLen = NODES.map(function (n) {
      var best = 0, bestD = Infinity;
      for (var s = 0; s <= total; s += 2) {
        var p = track.getPointAtLength(s);
        var dd = (p.x - n[0]) * (p.x - n[0]) + (p.y - n[1]) * (p.y - n[1]);
        if (dd < bestD) { bestD = dd; best = s; }
      }
      return best;
    });
    var doneLen = nodeLen[nowIdx];
    var fromLen = nowIdx > 0 ? nodeLen[nowIdx - 1] : 0;

    // Icon vẽ dần bằng nét: đo độ dài thật của từng nét để ẩn rồi vẽ lại
    section.querySelectorAll('.jnode__ring svg path, .jnode__ring svg circle, .jnode__ring svg ellipse').forEach(function (shape) {
      var len = Math.ceil(shape.getTotalLength ? shape.getTotalLength() : 0) + 1;
      if (len > 1) { shape.style.setProperty('--len', String(len)); shape.classList.add('draw'); }
    });

    /* Mở đầu một lần: đường sáng chạy từ đầu năm tới hôm nay,
       mỗi vòng tròn và icon hiện ra đúng lúc đường chạy qua; các giai đoạn sau hiện tiếp theo. */
    var DRAW_MS = 1800;
    done.style.strokeDasharray = total + ' ' + total;
    done.style.strokeDashoffset = String(total);
    var introDone = false;
    function runIntro() {
      if (introDone) return;
      introDone = true;
      // Tiêu đề lớn hiện từng cụm từ, đi trước đường sáng một nhịp
      requestAnimationFrame(function () { section.classList.remove('title-pending'); });
      if (reduceMotion) {
        done.style.transition = 'none';
        done.style.strokeDashoffset = String(total - doneLen);
        btns.forEach(function (b) { b.classList.add('is-in'); });
        section.classList.remove('intro-pending');
        return;
      }
      done.style.transition = 'stroke-dashoffset ' + DRAW_MS + 'ms cubic-bezier(0.19, 1, 0.22, 1)';
      done.style.strokeDashoffset = String(total - doneLen);
      // Đường cong easing gần với hàm mũ: tiến độ f(t) = 1 - 2^(-10t) → t = -log2(1 - f) / 10
      btns.forEach(function (b, k) {
        var delay;
        if (k <= nowIdx) {
          var f = Math.min(nodeLen[k] / Math.max(doneLen, 1), 0.999);
          delay = (-Math.log(1 - f) / Math.LN2 / 10) * DRAW_MS;
        } else {
          delay = DRAW_MS * 0.55 + (k - nowIdx) * 140;
        }
        setTimeout(function () { b.classList.add('is-in'); }, delay);
      });
      setTimeout(function () { section.classList.remove('intro-pending'); startSpark(); }, DRAW_MS + 400);
    }
    if (!reduceMotion) { section.classList.add('intro-pending'); section.classList.add('title-pending'); }

    // Chuỗi chấm sáng chạy suốt quãng đường từ đầu năm qua từng giai đoạn tới hôm nay,
    // như dòng chảy nối các mùa với nhau
    var sparkVisible = false, sparkRaf = null, sparkStart = null;
    function sparkLoop(t) {
      if (sparkStart === null) sparkStart = t;
      var period = 4200;
      sparks.forEach(function (s, i) {
        var u = (((t - sparkStart) / period) + i / sparks.length) % 1;
        var eased = 1 - Math.pow(1 - u, 1.6);
        var p = track.getPointAtLength(doneLen * eased);
        s.setAttribute('cx', p.x.toFixed(1));
        s.setAttribute('cy', p.y.toFixed(1));
        s.style.opacity = (Math.sin(Math.PI * u) * (1 - i * 0.2)).toFixed(3);
      });
      sparkRaf = sparkVisible ? requestAnimationFrame(sparkLoop) : null;
    }
    function startSpark() {
      if (sparkVisible && !sparkRaf && !reduceMotion && doneLen > 0 && introDone) {
        sparkStart = null; sparkRaf = requestAnimationFrame(sparkLoop);
      }
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var en = entries[0];
        sparkVisible = en.isIntersecting;
        if (en.isIntersecting) { runIntro(); if (!section.classList.contains('intro-pending')) startSpark(); }
        if (!en.isIntersecting && view !== nowIdx) setView(nowIdx, true);
      }, { threshold: 0.25 }).observe(section);
    } else { runIntro(); }

    function showSegment(path, a, b, fromEnd, animate) {
      var seg = Math.max(b - a, 0);
      if (animate && !reduceMotion) {
        path.style.transition = 'none';
        path.style.strokeDasharray = '0 ' + total;
        path.style.strokeDashoffset = String(-(fromEnd ? b : a));
        void path.getBoundingClientRect();
        path.style.transition = '';
      }
      path.style.strokeDasharray = seg + ' ' + total;
      path.style.strokeDashoffset = String(-a);
    }
    var ETA = {
      soon: { vi: 'Còn khoảng {n} tháng', en: 'In about {n} months' },
      one: { vi: 'Còn khoảng 1 tháng', en: 'In about a month' },
      now: { vi: 'Đang trong mùa', en: 'In season now' },
      always: { vi: 'Quanh năm', en: 'All year' }
    };
    function etaText(k, l) {
      var m = STAGE_MONTHS[k];
      if (!m) return ETA.always[l];
      if (m.indexOf(month) > -1) return ETA.now[l];
      var diff = (m[0] - month + 12) % 12;
      return diff === 1 ? ETA.one[l] : ETA.soon[l].replace('{n}', diff);
    }
    // Xem giai đoạn khác: vẽ đường trắng từ hôm nay tới giai đoạn đó, kèm nhãn còn bao lâu
    function paintRoute() {
      if (view === nowIdx) {
        routePath.classList.remove('is-on');
        etaEl.classList.remove('is-on');
        return;
      }
      var a = Math.min(nodeLen[nowIdx], nodeLen[view]);
      var b = Math.max(nodeLen[nowIdx], nodeLen[view]);
      showSegment(routePath, a, b, view < nowIdx, true);
      routePath.classList.add('is-on');
      // Nhãn đặt ngay dưới viên đang xem
      var mapRect = etaEl.parentElement.getBoundingClientRect();
      var pill = btns[view].querySelector('.jnode__ring').getBoundingClientRect();
      etaEl.style.setProperty('--ex', (pill.left + pill.width / 2 - mapRect.left) + 'px');
      etaEl.style.setProperty('--ey', (pill.bottom - mapRect.top + 18) + 'px');
      etaEl.textContent = etaText(view, lang());
      etaEl.classList.remove('is-on');
      void etaEl.offsetWidth;
      etaEl.classList.add('is-on');
    }

    function paint() {
      var l = lang();
      var isNow = view === nowIdx;
      var st = STAGES[view];
      kickerEl.textContent = (isNow ? TEXT.live : TEXT.past)[l];
      stageEl.textContent = isNow ? STAGES[nowIdx].status[l] : st.title[l];
      leadEl.textContent = st.lead[l];
      backBtn.hidden = isNow;
      layers.forEach(function (layer, k) { layer.classList.toggle('is-on', k === view); });
      prints.forEach(function (fig, k) {
        var p = st.photos[k];
        fig.querySelector('.ph').style.setProperty('--ph', p.c);
        fig.querySelector('.ph__label').textContent = (l === 'en' ? 'Placeholder: ' : 'Ảnh tạm: ') + p[l].toLowerCase();
        var cap = fig.querySelector('figcaption');
        cap.textContent = p[l];
        var small = document.createElement('small');
        small.className = 'tam';
        small.textContent = isNow && p.date ? p.date : STAGE_TEXT.pastSeason[l];
        cap.appendChild(small);
      });
      btns.forEach(function (b, k) {
        var always = k === btns.length - 1;
        b.classList.toggle('is-now', k === nowIdx);
        b.classList.toggle('is-view', k === view && k !== nowIdx);
        b.classList.toggle('is-done', k < nowIdx);
        b.classList.toggle('is-future', k > nowIdx && !always);
        b.setAttribute('aria-selected', String(k === view));
        b.tabIndex = k === view ? 0 : -1;
        var badge = b.querySelector('.jnode__now');
        if (k === nowIdx) {
          if (!badge) { badge = document.createElement('span'); badge.className = 'jnode__now'; b.appendChild(badge); }
          badge.textContent = todayLabel(l);
        } else if (badge) { badge.remove(); }
      });
      document.getElementById('journeyDetail').setAttribute('aria-labelledby', 'jstage-' + view);
      jWave.setLive(isNow);
      paintRoute();
    }

    var timer;
    function setView(i, instant) {
      i = (i + btns.length) % btns.length;
      if (i === view) return;
      view = i;
      clearTimeout(timer);
      if (reduceMotion || instant) { paint(); return; }
      section.classList.add('is-swapping');
      timer = setTimeout(function () { paint(); section.classList.remove('is-swapping'); }, 200);
    }

    btns.forEach(function (b, k) {
      b.addEventListener('click', function () { setView(k); });
      b.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'touch') return;
        var lo = nodeLen[Math.max(k - 1, 0)], hi = nodeLen[Math.min(k + 1, btns.length - 1)];
        showSegment(linkPath, lo, hi, false, false);
        linkPath.classList.add('is-on');
        if (btns[k - 1]) btns[k - 1].classList.add('is-linked');
        if (btns[k + 1]) btns[k + 1].classList.add('is-linked');
      });
      b.addEventListener('pointerleave', function () {
        linkPath.classList.remove('is-on');
        btns.forEach(function (x) { x.classList.remove('is-linked'); });
      });
      b.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = view + 1;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = view - 1;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = btns.length - 1;
        if (next === null) return;
        e.preventDefault();
        setView(next);
        btns[(next + btns.length) % btns.length].focus();
      });
    });
    backBtn.addEventListener('click', function () { setView(nowIdx); btns[nowIdx].focus(); });

    // Ảnh nền trôi chậm hơn nội dung khi cuộn (lệch tối đa khoảng 12% chiều cao section)
    var bgEl = document.getElementById('journeyBg');
    if (bgEl && !reduceMotion) {
      var pq = false;
      var parallax = function () {
        pq = false;
        var r = section.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var progress = (window.innerHeight - r.top) / (window.innerHeight + r.height); // 0 → 1 khi section đi qua màn hình
        var shift = (progress - 0.5) * r.height * 0.16;
        bgEl.style.setProperty('--bg-shift', shift.toFixed(1) + 'px');
      };
      window.addEventListener('scroll', function () { if (!pq) { pq = true; requestAnimationFrame(parallax); } }, { passive: true });
      parallax();
    }

    paint();
    // Đổi ngôn ngữ thì vẽ lại section hành trình
    var renderSeasonBase = renderSeason;
    renderSeason = function () { renderSeasonBase(); paint(); };
  })();

  /* ---------- Dải sản phẩm: trôi chậm liên tục, cuộn trang thì đổi hướng và tăng tốc ---------- */
  // Cuộn xuống: sản phẩm chạy từ trái sang phải. Cuộn lên: chạy từ phải sang trái.
  // Sau khi ngừng cuộn, dải giữ hướng vừa cuộn và chậm dần về tốc độ trôi nền.
  (function () {
    var track = document.getElementById('pstripTrack');
    if (!track || reduceMotion) return;
    var viewport = track.parentElement;
    var originals = Array.prototype.slice.call(track.children);
    var BASE = 28;          // px mỗi giây khi không cuộn
    var MAX = 380;          // tốc độ tối đa khi cuộn mạnh
    var setW = 0, x = 0, dir = -1, speed = BASE, hover = false, visible = false, raf = null, last = null;
    var lastScroll = window.scrollY;

    // Khung sản phẩm cao bằng 1/6 hero: đo chiều cao hero thật
    var heroEl = document.getElementById('hero');
    function syncHeroHeight() {
      if (heroEl) document.documentElement.style.setProperty('--hero-h', heroEl.offsetHeight + 'px');
    }

    function build() {
      syncHeroHeight();
      Array.prototype.slice.call(track.querySelectorAll('.is-clone')).forEach(function (c) { c.remove(); });
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      setW = track.scrollWidth + gap;
      var copies = Math.ceil(viewport.clientWidth / setW) + 2;
      for (var i = 0; i < copies; i++) {
        originals.forEach(function (li) {
          var c = li.cloneNode(true);
          c.classList.add('is-clone');
          c.setAttribute('aria-hidden', 'true');
          c.querySelectorAll('a').forEach(function (a) { a.tabIndex = -1; });
          track.appendChild(c);
        });
      }
      x = -setW;
      track.style.transform = 'translate3d(' + x + 'px,0,0)';
    }

    function loop(t) {
      if (last === null) last = t;
      var dt = Math.min(t - last, 80); last = t;
      var target = hover ? 0 : BASE;
      speed += (target - speed) * (1 - Math.exp(-dt / 650));
      x += dir * speed * dt / 1000;
      while (x > 0) x -= setW;
      while (x <= -setW) x += setW;
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      raf = visible ? requestAnimationFrame(loop) : null;
    }
    function start() { if (!raf && visible) { last = null; raf = requestAnimationFrame(loop); } }

    window.addEventListener('scroll', function () {
      var y = window.scrollY, d = y - lastScroll;
      lastScroll = y;
      if (!d) return;
      dir = d > 0 ? 1 : -1;
      speed = Math.min(Math.max(speed, BASE) + Math.abs(d) * 4, MAX);
    }, { passive: true });

    viewport.addEventListener('mouseenter', function () { hover = true; });
    viewport.addEventListener('mouseleave', function () { hover = false; });
    viewport.addEventListener('focusin', function () { hover = true; });
    viewport.addEventListener('focusout', function () { hover = false; });

    build();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        start();
      }).observe(viewport);
    } else { visible = true; start(); }

    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 200); });
  })();

  /* ---------- Tự căn khung khi cuộn tới section hành trình ----------
     Khi người dùng ngừng cuộn gần một trong ba khung, trang trượt nhẹ về đúng khung đó:
     khung 1 = dải sản phẩm + tiêu đề lớn, khung 2 = tiêu đề lớn + các giai đoạn,
     khung 3 = các giai đoạn + phần chi tiết.
     Dừng xa khung thì không can thiệp, để không giành quyền cuộn của người dùng. */
  (function () {
    var section = document.getElementById('hanh-trinh');
    var map = document.getElementById('journeyMap');
    var title = document.getElementById('journeyTitle');
    if (!section || !map || !title) return;
    var HEADER = 72, GAP = 8;
    var IDLE = 320;          // chờ người dùng ngừng hẳn rồi mới căn (trước là 140ms)
    var wide = window.matchMedia('(min-width: 761px)');
    var lastInput = 0, timer = null, anim = null;

    function targets() {
      var y = window.scrollY;
      return [
        section.getBoundingClientRect().top + y - HEADER,                // khung 1: sản phẩm + tiêu đề
        title.getBoundingClientRect().top + y - HEADER - 3 * GAP,        // khung 2: tiêu đề + giai đoạn
        map.getBoundingClientRect().top + y - HEADER - GAP               // khung 3: giai đoạn + chi tiết
      ];
    }
    // Đường cong êm: tăng tốc rất nhẹ ở đầu, chậm dần thật lâu ở cuối
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function stopAnim() { if (anim) { cancelAnimationFrame(anim.raf); anim = null; } }
    function glideTo(target) {
      stopAnim();
      var from = window.scrollY, dist = target - from;
      // Quãng càng dài thì trượt càng lâu, khoảng 0,7–1,2 giây
      var dur = Math.min(1200, 700 + Math.abs(dist) * 2.2);
      var start = null;
      anim = { raf: 0 };
      function step(t) {
        if (!anim) return;
        if (start === null) start = t;
        var p = Math.min((t - start) / dur, 1);
        window.scrollTo({ top: from + dist * ease(p), behavior: 'instant' });
        if (p < 1) anim.raf = requestAnimationFrame(step); else anim = null;
      }
      anim.raf = requestAnimationFrame(step);
    }
    function settle() {
      if (anim || !wide.matches || reduceMotion) return;
      if (Date.now() - lastInput < IDLE || smooth.busy()) { schedule(); return; }   // người dùng vẫn đang cuộn
      var y = window.scrollY;
      var reach = Math.min(220, (window.innerHeight - HEADER) * 0.28);
      var best = null, bestD = Infinity;
      targets().forEach(function (t) {
        var d = Math.abs(t - y);
        if (d < bestD) { bestD = d; best = t; }
      });
      if (best !== null && bestD > 2 && bestD <= reach) glideTo(Math.round(best));
    }
    function schedule() { clearTimeout(timer); timer = setTimeout(settle, IDLE); }

    // Người dùng chạm vào cuộn là dừng trượt ngay, trả lại quyền điều khiển
    ['wheel', 'touchstart', 'touchmove', 'keydown', 'mousedown'].forEach(function (ev) {
      window.addEventListener(ev, function () { lastInput = Date.now(); stopAnim(); }, { passive: true });
    });
    window.addEventListener('scroll', function () { if (!anim) schedule(); }, { passive: true });
  })();

  /* ---------- Bộ hiệu ứng hiện khi cuộn, dùng chung cho mọi trang ----------
     data-rv: khối trồi lên; .rv-img: ảnh mở từ dưới lên rồi lùi về kích thước thật
     (cùng kiểu với khung sản phẩm); data-py: ảnh trôi chậm khi cuộn. */
  (function () {
    var items = document.querySelectorAll('[data-rv], .rv-img');
    if (!('IntersectionObserver' in window) || reduceMotion) { Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); }); }
    else {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -10% 0px' });
      Array.prototype.forEach.call(items, function (el) { io.observe(el); });
    }
    var pys = Array.prototype.slice.call(document.querySelectorAll('[data-py]'));
    if (!pys.length || reduceMotion) return;
    var q = false;
    function paint() {
      q = false;
      var vh = window.innerHeight;
      pys.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var c = (r.top + r.height / 2) / vh - 0.5;
        el.style.setProperty('--py', (-c * Number(el.dataset.py || 30)).toFixed(1) + 'px');
      });
    }
    window.addEventListener('scroll', function () { if (!q) { q = true; requestAnimationFrame(paint); } }, { passive: true });
    window.addEventListener('resize', paint);
    paint();
  })();

  /* ---------- Chuyển trang khi trình duyệt chưa có View Transitions ----------
     Trình duyệt mới dùng @view-transition trong CSS; trình duyệt cũ: trang mờ dần rồi mới chuyển. */
  (function () {
    if (reduceMotion || 'CSSViewTransitionRule' in window) return;
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
      e.preventDefault();
      root.classList.add('pt-leave');
      setTimeout(function () { location.href = url.href; }, 380);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('pt-leave'); });
  })();

  /* ---------- Hiện khi cuộn tới ---------- */
  function onceVisible(el, fn, threshold) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { fn(); io.disconnect(); } });
    }, { threshold: threshold || 0.4 });
    io.observe(el);
  }

  // Section văn hoá: nội dung và đường kẻ dọc hiện ra khi cuộn tới (một lần)
  var cultureEl = document.querySelector('.culture');
  if (cultureEl) onceVisible(cultureEl, function () { cultureEl.classList.add('is-in'); }, 0.15);

  if (cultureEl) {
    // Ảnh trôi chậm khi cuộn (lệch tối đa khoảng ±12px), giống nền section hành trình
    var placeImgs = Array.prototype.slice.call(cultureEl.querySelectorAll('.place__img .ph'));
    var pq2 = false;
    var placeParallax = function () {
      pq2 = false;
      if (reduceMotion) return;
      placeImgs.forEach(function (ph) {
        var r = ph.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var c = (r.top + r.height / 2) / window.innerHeight - 0.5;   // -0.5 → 0.5
        ph.style.setProperty('--py', (-c * 24).toFixed(1) + 'px');
      });
    };
    window.addEventListener('scroll', function () { if (!pq2) { pq2 = true; requestAnimationFrame(placeParallax); } }, { passive: true });
    placeParallax();

    // Trạng thái trực tiếp theo giờ Việt Nam: nông trại đón khách thứ Hai – thứ Sáu, 8:00 – 16:00
    var farmStatus = document.getElementById('farmStatus');
    var shopStatus = document.getElementById('shopStatus');
    var farmWave = farmStatus ? makeWave(farmStatus.querySelector('.live-wave')) : null;
    var shopWave = shopStatus ? makeWave(shopStatus.querySelector('.live-wave')) : null;
    var STATUS = {
      open: { vi: 'Đang đón khách', en: 'Open for visits now' },
      closed: { vi: 'Ngoài giờ đón khách', en: 'Closed for visits now' },
      shop: { vi: 'Sắp khai trương, giữa năm 2027', en: 'Opening mid-2027' }
    };
    var farmOpenNow = function () {
      try {
        var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(new Date());
        var wd = '', hr = 0;
        parts.forEach(function (p) { if (p.type === 'weekday') wd = p.value; if (p.type === 'hour') hr = Number(p.value); });
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(wd) > -1 && hr >= 8 && hr < 16;
      } catch (e) { return false; }
    };
    var paintStatus = function () {
      var l = lang();
      if (farmStatus) {
        var open = farmOpenNow();
        farmStatus.classList.toggle('is-open', open);
        farmStatus.querySelector('.place__status-text').textContent = (open ? STATUS.open : STATUS.closed)[l];
        farmWave.setLive(open);
      }
      if (shopStatus) {
        shopStatus.querySelector('.place__status-text').textContent = STATUS.shop[l];
        shopWave.setLive(false);
      }
    };
    paintStatus();
    setInterval(paintStatus, 60000);
    var renderSeasonPrev = renderSeason;
    renderSeason = function () { renderSeasonPrev(); paintStatus(); };
  }

  // Con số chạy lên
  document.querySelectorAll('[data-count]').forEach(function (el) {
    if (reduceMotion) return;
    var to = Number(el.dataset.count);
    var from = Number(el.dataset.from || 0);
    el.textContent = String(from);
    onceVisible(el, function () {
      var start = null, dur = 900;
      function tick(t) {
        if (start === null) start = t;
        var p = Math.min((t - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        el.textContent = String(Math.round(from + (to - from) * eased));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, 0.6);
  });

  /* ---------- Ba section cuối: hiện khi cuộn tới ---------- */
  document.querySelectorAll('[data-reveal]').forEach(function (sec) {
    onceVisible(sec, function () { sec.classList.add('is-in'); }, 0.18);
  });

  /* ---------- Từ cây đến tách: đường lượn qua bốn viên, đường sáng chạy theo nhịp cuộn ---------- */
  (function () {
    var flow = document.getElementById('flow');
    if (!flow) return;
    var svg = flow.querySelector('.flow__svg');
    var track = flow.querySelector('.flow__track');
    var done = flow.querySelector('.flow__done');
    var spark = flow.querySelector('.flow__spark');
    var grad = document.getElementById('flowGrad');
    var stepsEl = Array.prototype.slice.call(flow.querySelectorAll('.fstep'));
    var pills = stepsEl.map(function (s) { return s.querySelector('.fstep__pill'); });
    var total = 0, marks = [], cur = 0, tgt = 0, running = false, lastT = null;

    // Dựng đường cong đi qua tâm từng viên (toạ độ điểm ảnh thật), nhô ra hai mép như đường hành trình
    function build() {
      var fr = flow.getBoundingClientRect();
      if (!fr.width) return;
      svg.setAttribute('viewBox', '0 0 ' + fr.width.toFixed(1) + ' ' + fr.height.toFixed(1));
      grad.setAttribute('x2', fr.width.toFixed(0));
      var pts = pills.map(function (p) {
        var r = p.getBoundingClientRect();
        return [r.left - fr.left + r.width / 2, r.top - fr.top + r.height / 2];
      });
      var first = pts[0], last = pts[pts.length - 1];
      var all = [[Math.min(0, first[0] - 120), first[1] + 40]].concat(pts, [[Math.max(fr.width, last[0] + 120), last[1] - 40]]);
      var d = 'M' + all[0][0].toFixed(1) + ' ' + all[0][1].toFixed(1);
      for (var i = 1; i < all.length; i++) {
        var a = all[i - 1], b = all[i], mx = (a[0] + b[0]) / 2;
        d += ' C ' + mx.toFixed(1) + ' ' + a[1].toFixed(1) + ' ' + mx.toFixed(1) + ' ' + b[1].toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
      }
      track.setAttribute('d', d); done.setAttribute('d', d);
      total = done.getTotalLength();
      done.style.strokeDasharray = total + ' ' + total;
      // Độ dài đường tới tâm từng viên (dò theo trục ngang)
      marks = pts.map(function (pt) {
        var lo = 0, hi = total;
        for (var k = 0; k < 22; k++) { var m = (lo + hi) / 2; if (done.getPointAtLength(m).x < pt[0]) lo = m; else hi = m; }
        return lo;
      });
      paint();
    }
    function target() {
      var r = flow.getBoundingClientRect(), vh = window.innerHeight;
      // 0 khi đỉnh dãy viên ở 90% màn hình → 1 khi đáy dãy lên tới 55% màn hình
      return Math.max(0, Math.min(1, (vh * 0.9 - r.top) / (r.height + vh * 0.35)));
    }
    function paint() {
      if (!total) return;
      var len = cur * total;
      done.style.strokeDashoffset = String(total - len);
      var pt = done.getPointAtLength(Math.max(len, 0.01));
      spark.setAttribute('cx', pt.x.toFixed(1)); spark.setAttribute('cy', pt.y.toFixed(1));
      spark.style.opacity = cur > 0.005 && cur < 0.995 ? 1 : 0;
      stepsEl.forEach(function (s, i) { s.classList.toggle('is-on', len >= marks[i] - 2); });
    }
    function step(t) {
      var dt = lastT === null ? 16 : Math.min(t - lastT, 64);
      lastT = t;
      tgt = target();
      cur += (tgt - cur) * (1 - Math.exp(-dt / 160));
      paint();
      if (Math.abs(tgt - cur) > 0.0005) requestAnimationFrame(step); else { cur = tgt; paint(); running = false; lastT = null; }
    }
    function kick() { if (reduceMotion) { cur = 1; paint(); return; } if (!running) { running = true; requestAnimationFrame(step); } }
    build();
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', function () { build(); kick(); });
    window.addEventListener('load', build);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    kick();
  })();

  /* ---------- Nhật ký: ảnh bài nổi bật trôi chậm khi cuộn ---------- */
  (function () {
    var img = document.querySelector('.jfeat__img .ph');
    if (!img || reduceMotion) return;
    var q = false;
    function pp() {
      q = false;
      var r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var c = (r.top + r.height / 2) / window.innerHeight - 0.5;
      img.style.setProperty('--py', (-c * 28).toFixed(1) + 'px');
    }
    window.addEventListener('scroll', function () { if (!q) { q = true; requestAnimationFrame(pp); } }, { passive: true });
    pp();
  })();

  /* ---------- Chuyện ông Cao: vòng tư liệu ---------- */
  (function () {
    var story = document.querySelector('.story');
    var orbit = document.getElementById('storyOrbit');
    if (!story || !orbit) return;
    var memos = Array.prototype.slice.call(orbit.querySelectorAll('.memo[data-i]'));
    var lines = Array.prototype.slice.call(orbit.querySelectorAll('.memo-line'));
    var spark = orbit.querySelector('.story__spark');
    var desktop = window.matchMedia('(min-width: 761px)');
    lines.forEach(function (p) { p.style.setProperty('--len', p.getTotalLength().toFixed(1)); });

    // Hiện ra một lần: tiêu đề từng cụm, sợi chỉ vẽ từ tâm ra, tư liệu hiện lần lượt
    onceVisible(story, function () { story.classList.add('is-in'); setTimeout(startCycle, 2200); }, 0.2);

    // Lần lượt kể từng mốc theo thứ tự thời gian; một chấm sáng chạy theo sợi chỉ từ tâm tới tư liệu
    var cur = -1, timer = null, hoverLock = false, sparkRaf = null, inView = false;
    function runSpark(i) {
      if (reduceMotion || !desktop.matches) return;
      cancelAnimationFrame(sparkRaf);
      var p = lines[i], len = p.getTotalLength(), t0 = null, DUR = 1400;
      function step(t) {
        if (t0 === null) t0 = t;
        var k = Math.min((t - t0) / DUR, 1);
        var e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        var pt = p.getPointAtLength(e * len);
        spark.setAttribute('cx', pt.x.toFixed(1)); spark.setAttribute('cy', pt.y.toFixed(1));
        spark.style.opacity = k < .9 ? 1 : (1 - k) * 10;
        if (k < 1) sparkRaf = requestAnimationFrame(step);
      }
      sparkRaf = requestAnimationFrame(step);
    }
    function show(i, withSpark) {
      if (i === cur) return;
      cur = i;
      memos.forEach(function (m, k) { m.classList.toggle('is-on', k === i); });
      lines.forEach(function (l, k) { l.classList.toggle('is-on', k === i); });
      if (withSpark !== false) runSpark(i);
    }
    function next() { show((cur + 1) % memos.length); }
    function startCycle() {
      clearInterval(timer);
      if (!desktop.matches) return;
      if (cur < 0) show(0);
      if (reduceMotion || !inView || hoverLock) return;
      timer = setInterval(next, 3600);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        inView = en[0].isIntersecting;
        if (inView && story.classList.contains('is-in')) startCycle(); else clearInterval(timer);
      }, { threshold: 0.25 }).observe(orbit);
    }
    memos.forEach(function (m, k) {
      m.addEventListener('mouseenter', function () { hoverLock = true; clearInterval(timer); show(k); });
      m.addEventListener('focus', function () { hoverLock = true; clearInterval(timer); show(k); });
      m.addEventListener('mouseleave', function () { hoverLock = false; startCycle(); });
      m.addEventListener('blur', function () { hoverLock = false; startCycle(); });
    });

    // Trôi nhẹ khi cuộn, mỗi tư liệu một độ sâu
    var ticking = false;
    function parallax() {
      ticking = false;
      if (reduceMotion || !desktop.matches) { memos.forEach(function (m) { m.style.transform = ''; }); return; }
      var r = orbit.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var center = r.top + r.height / 2 - window.innerHeight / 2;
      memos.forEach(function (m) {
        m.style.transform = 'translate3d(0,' + (center * Number(m.dataset.depth || 0)).toFixed(1) + 'px,0)';
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
    }, { passive: true });
    parallax();
  })();

  /* ---------- Footer: nền đứng yên, thẻ kính trượt lên phủ qua (nhịp học theo Delta) ---------- */
  (function () {
    var foot = document.querySelector('.footer');
    var pre = document.getElementById('footerPre');
    var panel = document.getElementById('footerPanel');
    var glass = document.getElementById('footerGlass');
    var hero = document.getElementById('footerHero');
    var bg = pre && pre.querySelector('.footer__bg');
    if (!foot || !pre || !panel || !glass || !hero || !bg) return;
    onceVisible(pre, function () { foot.classList.add('is-in'); }, 0.35);
    if (reduceMotion) return;

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    var KEYS = ['off', 'gi', 'gr', 'hs', 'ho', 'hy', 'bs', 'by'];
    var cur = null, tgt = {};

    // Giá trị đích theo vị trí cuộn. Thẻ kính: trễ hơn nội dung trang một đoạn rồi bắt kịp,
    // mép kính từ tràn ra ngoài khung co vào cách mép 16px, góc bo dần.
    function targets() {
      var vh = window.innerHeight, vw = window.innerWidth;
      var mobile = vw < 761;
      var ft = foot.getBoundingClientRect().top;
      var pt = ft + panel.offsetTop;                      // vị trí tự nhiên của thẻ (chưa tính độ trễ)
      // Nhịp bắt kịp tuyến tính như Delta: bắt đầu khi thẻ vừa ló lên, xong đúng lúc cuộn tới cuối trang
      var settle = vh - foot.offsetHeight + panel.offsetTop;   // vị trí của thẻ khi đã cuộn hết trang
      var p = clamp((vh * 0.95 - pt) / Math.max(vh * 0.95 - settle, 1), 0, 1);
      var OFF = mobile ? Math.min(90, vh * 0.11) : Math.min(150, vh * 0.17);
      var edge = mobile ? 8 : 16;
      tgt.off = (1 - p) * OFF;
      tgt.gi = -vw * 0.03 + p * (edge + vw * 0.03);
      tgt.gr = p * (mobile ? 16 : 20);
      // Câu slogan thu nhỏ và lùi lại khi thẻ kính kéo lên
      var s = clamp((vh - pt) / Math.max(vh - settle, 1), 0, 1);
      tgt.hs = 1 - s * 0.16;
      tgt.ho = 1 - s * 0.6;
      tgt.hy = -s * vh * 0.05;
      // Nền: phóng 1.1 và lệch lên khi footer còn ở dưới, về 1 khi footer chạm đỉnh màn hình
      var q = 1 - clamp(ft / vh, 0, 1);
      tgt.bs = 1.1 - q * 0.1;
      tgt.by = -(1 - q) * vh * 0.2;
    }
    function apply() {
      panel.style.transform = 'translate3d(0,' + cur.off.toFixed(2) + 'px,0)';
      glass.style.setProperty('--gi', cur.gi.toFixed(2) + 'px');
      glass.style.setProperty('--gr', cur.gr.toFixed(2) + 'px');
      hero.style.transform = 'translate3d(0,' + cur.hy.toFixed(2) + 'px,0) scale(' + cur.hs.toFixed(4) + ')';
      hero.style.opacity = cur.ho.toFixed(3);
      bg.style.transform = 'translate3d(0,' + cur.by.toFixed(2) + 'px,0) scale(' + cur.bs.toFixed(4) + ')';
    }
    // Làm mượt theo thời gian thật: mọi giá trị trôi dần về đích, tạo cảm giác có quán tính
    var running = false, lastT = null, TAU = smooth.on ? 70 : 140;
    function step(t) {
      var dt = lastT === null ? 16 : Math.min(t - lastT, 64);
      lastT = t;
      targets();
      var k = 1 - Math.exp(-dt / TAU), busy = false;
      KEYS.forEach(function (key) {
        var d = tgt[key] - cur[key];
        cur[key] += d * k;
        if (Math.abs(d) > (key === 'hs' || key === 'ho' || key === 'bs' ? 0.0005 : 0.05)) busy = true;
      });
      apply();
      if (busy) requestAnimationFrame(step); else { running = false; lastT = null; }
    }
    function kick() { if (!running) { running = true; requestAnimationFrame(step); } }
    targets();
    cur = {}; KEYS.forEach(function (key) { cur[key] = tgt[key]; });
    apply();
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
  })();

  /* ---------- Giỏ hàng (bản thử, chỉ đếm) ---------- */
  var count = 0;
  var countEl = document.getElementById('cartCount');
  var toast = document.getElementById('toast');
  var toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 2400);
  }
  document.querySelectorAll('[data-add]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      count += 1;
      countEl.textContent = String(count);
      countEl.classList.add('has-items', 'bump');
      setTimeout(function () { countEl.classList.remove('bump'); }, 250);
      showToast(lang() === 'en' ? 'Added ' + btn.dataset.add + ' to your cart' : 'Đã thêm ' + btn.dataset.add + ' vào giỏ');
    });
  });

  /* ---------- Đăng ký nhận tin ---------- */
  var form = document.getElementById('signup');
  var email = document.getElementById('email');
  var msg = document.getElementById('signupMsg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    email.setAttribute('aria-invalid', String(!ok));
    msg.classList.toggle('is-error', !ok);
    if (!ok) {
      msg.textContent = lang() === 'en' ? 'Enter a valid email, like name@email.com.' : 'Nhập email hợp lệ, ví dụ ten@email.com.';
      email.focus();
      return;
    }
    msg.textContent = lang() === 'en' ? 'Signed up. Your first letter arrives next season.' : 'Đã đăng ký. Lá thư đầu tiên sẽ đến vào mùa tới.';
    form.reset();
  });
  email.addEventListener('input', function () {
    email.removeAttribute('aria-invalid');
    msg.textContent = '';
    msg.classList.remove('is-error');
  });

  // Đồng bộ nút ngôn ngữ với ngôn ngữ đã lưu
  setLang(lang());
  window.OngCao = {
    lang: lang, reduceMotion: reduceMotion, onceVisible: onceVisible, makeWave: makeWave,
    stages: STAGES, stageMonths: STAGE_MONTHS, nowIdx: nowIdx,
    smoothScroll: smooth.on, refreshLights: function () { refreshLights(); }
  };
})();
