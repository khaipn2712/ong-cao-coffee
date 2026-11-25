(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = function () { return root.lang === 'en' ? 'en' : 'vi'; };

  /* ---------- Cuộn: dùng cuộn gốc của trình duyệt ----------
     Bản 10kweb bỏ cuộn mượt giả lập: cuộn gốc phản hồi nhanh và quen tay nhất trên mọi thiết bị. */
  var smooth = { on: false, busy: function () { return false; } };

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

  /* ---------- Thẻ kính ở hero ---------- */
  var glass = document.getElementById('glass');
  var glassHover = false;
  holdWhileUsing(glass);
  glass.addEventListener('mouseenter', function () { glassHover = true; });
  glass.addEventListener('mouseleave', function () { glassHover = false; });
  glass.addEventListener('focusin', function () { glassHover = true; });
  glass.addEventListener('focusout', function () { glassHover = false; });
  glass.classList.add('is-in');

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
  // Bản 10kweb: chỉ thẻ kính lớn ở footer đón ánh sáng theo con trỏ
  var lightZone = document.querySelector('.footer');
  if (lightZone) setupLight(lightZone);

  /* ---------- Dữ liệu các giai đoạn trong năm ---------- */
  // Nội dung tạm: gia đình cần xác nhận tháng, mô tả và ảnh thật cho từng giai đoạn.
  var STAGES = [
    {
      status: { vi: 'Vườn Đức An đang trắng hoa', en: 'The orchard in Đức An is white with blossom' },
      title: { vi: 'Mùa hoa nở, tháng 2–3', en: 'Blossom season, Feb–Mar' },
      lead: { vi: 'Giữa mùa khô, sau những đợt tưới cây, hoa trắng nở kín cành và thơm khắp nông trại trong vài ngày, như lời chào của mùa mới.',
              en: 'In the middle of the dry season, after the watering of the trees, white blossom covers every branch and perfumes the farm for a few days, a greeting from the new season.' },
      photos: [
        { c: 'var(--sky-400)', vi: 'Cành trắng hoa', en: 'Branches in white' },
        { c: 'var(--sky-500)', vi: 'Tưới trước mùa hoa', en: 'Watering before the bloom' },
        { c: 'var(--sky-300)', vi: 'Ong ghé về vườn', en: 'Bees come to the orchard' }
      ]
    },
    {
      status: { vi: 'Từng quả non đang lớn dần trên cành', en: 'Young cherries are swelling on the branches' },
      title: { vi: 'Mùa nuôi quả, tháng 4–10', en: 'Growing season, Apr–Oct' },
      lead: { vi: 'Mùa mưa, quả căng dần trên cành. Cả nhà làm cỏ, bón phân, tỉa cành để cây giữ sức, và chăm lúa, ngô, khoai bên cạnh.',
              en: 'In the rainy season the cherries fill out. The family weeds, feeds and prunes so the trees keep their strength, and tends the rice, corn and sweet potato alongside.' },
      photos: [
        { c: 'var(--sky-700)', vi: 'Chùm quả xanh', en: 'Green cherries in clusters' },
        { c: 'var(--sky-600)', vi: 'Làm cỏ giữa các hàng', en: 'Weeding between the rows' },
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
        { c: 'var(--sky-700)', vi: 'Gùi cà phê vừa hái', en: 'A basket just picked', date: '10/11' },
        { c: 'var(--sky-300)', vi: 'Mẻ đầu trên sân phơi', en: 'The first batch on the drying yard', date: '08/11' }
      ]
    },
    {
      status: { vi: 'Sân phơi đang đầy nắng và gió', en: 'The drying yard is full of sun and wind' },
      title: { vi: 'Mùa phơi, tháng 12–2', en: 'Drying season, Dec–Feb' },
      lead: { vi: 'Quả vừa hái được trải đều trên sân phơi, dưới nắng và gió cao nguyên. Mỗi ngày được đảo bằng tay cho đến khi khô đều, không vội.',
              en: 'Freshly picked cherries are spread across the yard under the highland sun and wind, and turned by hand each day until they dry evenly, with no rush.' },
      photos: [
        { c: 'var(--sky-300)', vi: 'Sân phơi lúc bình minh', en: 'The yard at dawn' },
        { c: 'var(--sky-700)', vi: 'Đảo cà phê bằng cào', en: 'Raking the cherries' },
        { c: 'var(--sky-500)', vi: 'Thử độ khô bằng tay', en: 'Testing dryness by hand' }
      ]
    },
    {
      status: { vi: 'Xưởng nhỏ đang bốc hương', en: 'The little roastery is sending up its aroma' },
      title: { vi: 'Rang, quanh năm', en: 'Roasting, all year' },
      lead: { vi: 'Hạt khô được tách vỏ, rang từng mẻ nhỏ trong xưởng của gia đình quanh năm, rồi đóng gói khi mùi thơm vừa lên.',
              en: 'Dried beans are hulled and roasted in small batches in the family roastery all year, then packed while the aroma is at its peak.' },
      photos: [
        { c: 'var(--slate-400)', vi: 'Hạt sau khi tách vỏ', en: 'Green beans after hulling' },
        { c: 'var(--sky-700)', vi: 'Mẻ rang buổi sáng', en: 'The morning roast' },
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

    var DRAW_MS = 1800;
    done.style.strokeDasharray = total + ' ' + total;
    done.style.strokeDashoffset = String(total);
    var introDone = false;
    function runIntro() {
      if (introDone) return;
      introDone = true;
      btns.forEach(function (b) { b.classList.add('is-in'); });
      // Đường năm vẽ một lần, từ đầu năm tới hôm nay
      done.style.transition = reduceMotion ? 'none' : 'stroke-dashoffset ' + DRAW_MS + 'ms cubic-bezier(0.19, 1, 0.22, 1)';
      done.style.strokeDashoffset = String(total - doneLen);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var en = entries[0];
        if (en.isIntersecting) runIntro();
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


    paint();
    // Đổi ngôn ngữ thì vẽ lại section hành trình
    var renderSeasonBase = renderSeason;
    renderSeason = function () { renderSeasonBase(); paint(); };
  })();

  /* ---------- Dải sản phẩm dưới hero: đứng yên ----------
     Khung sản phẩm cao bằng 1/6 hero: đo chiều cao hero thật. Màn hẹp thì kéo ngang. */
  (function () {
    var heroEl = document.getElementById('hero');
    if (!heroEl || !document.getElementById('pstripTrack')) return;
    function syncHeroHeight() { root.style.setProperty('--hero-h', heroEl.offsetHeight + 'px'); }
    syncHeroHeight();
    window.addEventListener('resize', syncHeroHeight);
  })();

  /* ---------- Ảnh mở khi cuộn tới, dùng chung cho mọi trang ----------
     .rv-img: ảnh mở từ dưới lên rồi lùi về kích thước thật. Chữ không ẩn chờ cuộn:
     nội dung luôn có sẵn, chỉ ảnh có một nhịp mở. */
  (function () {
    var items = document.querySelectorAll('[data-rv], .rv-img');
    if (!('IntersectionObserver' in window) || reduceMotion) { Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); }); }
    else {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -6% 0px' });
      Array.prototype.forEach.call(items, function (el) { io.observe(el); });
    }
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

  /* ---------- Ba section cuối: hiện khi cuộn tới ---------- */
  document.querySelectorAll('[data-reveal]').forEach(function (sec) {
    onceVisible(sec, function () { sec.classList.add('is-in'); }, 0.18);
  });

  /* ---------- Chuyện ông Cao: vòng tư liệu ----------
     Bản 10kweb: không tự chạy vòng, không chấm sáng, không trôi theo cuộn.
     Mốc đầu tiên mở sẵn; rê chuột hoặc dùng bàn phím để xem mốc khác. */
  (function () {
    var story = document.querySelector('.story');
    var orbit = document.getElementById('storyOrbit');
    if (!story || !orbit) return;
    var memos = Array.prototype.slice.call(orbit.querySelectorAll('.memo[data-i]'));
    var lines = Array.prototype.slice.call(orbit.querySelectorAll('.memo-line'));
    story.classList.add('is-in');
    var cur = -1;
    function show(i) {
      if (i === cur) return;
      cur = i;
      memos.forEach(function (m, k) { m.classList.toggle('is-on', k === i); });
      lines.forEach(function (l, k) { l.classList.toggle('is-on', k === i); });
    }
    if (memos.length) show(0);
    memos.forEach(function (m, k) {
      m.addEventListener('mouseenter', function () { show(k); });
      m.addEventListener('focus', function () { show(k); });
    });
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
