/* Trang con của Ông Cao Coffee. Chạy sau assets/main.js (dùng window.OngCao). */
(function () {
  'use strict';
  var O = window.OngCao || {};
  var root = document.documentElement;
  var reduce = O.reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = function () { return root.lang === 'en' ? 'en' : 'vi'; };
  var page = document.body.dataset.page;
  function ve(vi, en) { return '<span lang="vi">' + vi + '</span><span lang="en">' + (en || vi) + '</span>'; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---------- Mục đang xem trên menu ---------- */
  $$('.nav a[data-page]').forEach(function (a) { if (a.dataset.page === page) a.setAttribute('aria-current', 'page'); });

  /* ---------- Vòng lặp cuộn dùng chung: mọi hiệu ứng theo cuộn đăng ký vào đây ---------- */
  var scrollFns = [];
  var queued = false;
  function runScroll() { queued = false; scrollFns.forEach(function (f) { f(); }); }
  function onScroll(fn) { scrollFns.push(fn); fn(); }
  window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(runScroll); } }, { passive: true });
  window.addEventListener('resize', function () { requestAnimationFrame(runScroll); });

  // Đo độ dài nét vẽ cho các hình nét mảnh
  function measure(scope) {
    $$('.draw', scope).forEach(function (p) { try { p.style.setProperty('--len', Math.ceil(p.getTotalLength() + 2)); } catch (e) {} });
  }
  measure(document);
  function redraw(svg) {
    if (!svg || reduce) return;
    svg.classList.add('is-drawing');
    void svg.getBoundingClientRect();
    requestAnimationFrame(function () { svg.classList.remove('is-drawing'); });
  }

  /* ---------- Chips: viên đậm trượt tới mục đang chọn ---------- */
  function chips(el, onPick) {
    var pill = el.querySelector('.chips__pill');
    var btns = $$('.chip', el);
    function place(b) {
      if (!pill || !b) return;
      pill.style.setProperty('--px', b.offsetLeft - 4 + 'px');
      pill.style.setProperty('--pw', b.offsetWidth + 'px');
    }
    function pick(b, silent) {
      btns.forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); x.tabIndex = x === b ? 0 : -1; });
      place(b);
      if (!silent && onPick) onPick(b.dataset.v, b);
    }
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!k) return;
        e.preventDefault();
        var n = btns[(i + k + btns.length) % btns.length]; n.focus(); pick(n);
      });
    });
    var cur = btns.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0] || btns[0];
    pick(cur, true);
    if ('ResizeObserver' in window) new ResizeObserver(function () { place(btns.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0]); }).observe(el);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(cur); });
    return { pick: pick };
  }

  // Lọc danh sách: ẩn dần mục không khớp, hiện lần lượt mục khớp
  function filterList(items, test, after) {
    items.forEach(function (it) { if (!it.hidden && !test(it)) it.classList.add('is-out'); });
    setTimeout(function () {
      var k = 0;
      items.forEach(function (it) {
        var ok = test(it);
        if (!ok) { it.hidden = true; return; }
        var wasHidden = it.hidden;
        it.hidden = false;
        if (wasHidden) { it.classList.add('is-out'); void it.offsetWidth; }
        (function (el, d) { setTimeout(function () { el.classList.remove('is-out'); }, d); })(it, reduce ? 0 : k * 60);
        k++;
      });
      if (after) after(k);
    }, reduce ? 0 : 260);
  }

  // Thẻ xếp chồng khi cuộn: chỉ dùng position: sticky trong CSS.
  // Bản 10kweb bỏ phần thu nhỏ và làm tối thẻ phía trên để chuyển động nhẹ hơn.
  function stack() {}

  // Đăng ký nhận thư (các form phụ trên trang con)
  $$('.js-signup').forEach(function (f) {
    var input = f.querySelector('input'), msg = f.parentElement.querySelector('.nsub__msg');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      input.setAttribute('aria-invalid', String(!ok));
      if (msg) {
        msg.classList.toggle('is-error', !ok);
        msg.textContent = ok
          ? (lang() === 'en' ? 'Thank you. The next letter from Đức An is on its way to you.' : 'Cảm ơn bạn. Lá thư mùa tới từ Đức An sẽ gửi về hộp thư của bạn.')
          : (lang() === 'en' ? 'Please check your email address.' : 'Bạn kiểm tra lại địa chỉ email giúp nhà mình nhé.');
      }
      if (ok) input.value = '';
    });
  });

  /* =====================================================================
     1. LỊCH SỬ: đường thời gian theo cuộn + mục lục nổi
     ===================================================================== */
  (function () {
    var wrap = $('#chapters');
    if (!wrap) return;
    var chs = $$('.chapter', wrap);
    var bodies = chs.map(function (c) { return c.querySelector('.chapter__body'); });
    var lines = bodies.map(function (b) { return b.querySelector('.chapter__line'); });
    var entries = $$('.entry', wrap);
    var toc = $('#toc'), tocBtn = $('#tocBtn'), tocCur = $('#tocCur'), links = $$('.toc__list a');
    tocBtn.addEventListener('click', function () {
      var open = toc.classList.toggle('is-open');
      tocBtn.setAttribute('aria-expanded', String(open));
    });
    links.forEach(function (a) { a.addEventListener('click', function () { toc.classList.remove('is-open'); tocBtn.setAttribute('aria-expanded', 'false'); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toc.classList.remove('is-open'); });

    var target = [], cur = [], lastIdx = -1, running = false, lastT = null;
    function measureTargets() {
      var vh = window.innerHeight, mark = vh * 0.55;
      bodies.forEach(function (b, i) {
        var r = b.getBoundingClientRect();
        target[i] = clamp((mark - r.top) / Math.max(r.height, 1), 0, 1);
        if (cur[i] === undefined) cur[i] = target[i];
      });
      entries.forEach(function (en) { en.classList.toggle('is-passed', en.getBoundingClientRect().top < mark); });
      // Mục lục: hiện khi đang đọc các chương; chương hiện tại là chương cuối cùng đã qua vạch giữa màn hình
      var wr = wrap.getBoundingClientRect();
      toc.classList.toggle('is-on', wr.top < vh * 0.6 && wr.bottom > vh * 0.4);
      var idx = 0;
      chs.forEach(function (c, i) { if (c.getBoundingClientRect().top < mark) idx = i; });
      if (idx !== lastIdx) {
        lastIdx = idx;
        links.forEach(function (a, i) { a.classList.toggle('is-on', i === idx); });
        tocCur.innerHTML = chs[idx].dataset.toc;
      }
      toc.style.setProperty('--tp', clamp((mark - wr.top) / Math.max(wr.height, 1), 0, 1).toFixed(3));
    }
    // Đường sáng trôi dần về vị trí cuộn, có quán tính nhẹ như các đường ở trang chủ
    function step(t) {
      var dt = lastT === null ? 16 : Math.min(t - lastT, 64); lastT = t;
      var k = reduce ? 1 : 1 - Math.exp(-dt / (O.smoothScroll ? 70 : 140)), busy = false;
      lines.forEach(function (l, i) {
        cur[i] += (target[i] - cur[i]) * k;
        if (Math.abs(target[i] - cur[i]) > 0.0008) busy = true;
        l.style.setProperty('--p', cur[i].toFixed(4));
        l.style.setProperty('--sp', cur[i] > 0.002 && cur[i] < 0.998 ? 1 : 0);
      });
      if (busy) requestAnimationFrame(step); else { running = false; lastT = null; }
    }
    onScroll(function () { measureTargets(); if (!running) { running = true; requestAnimationFrame(step); } });
  })();

  /* =====================================================================
     2. VỀ ÔNG CAO: đo vòng tròn, bản đồ, thẻ nguyên tắc xếp chồng
     ===================================================================== */
  (function () {
    var hero = $('.ahero');
    if (!hero) return;
    var ring = $('.ahero__ring', hero);
    if (ring) ring.style.setProperty('--len', Math.ceil(ring.getTotalLength()));
    var done = $('.amap__done');
    if (done) done.style.setProperty('--len', Math.ceil(done.getTotalLength()));
    var places = $('.aplaces');
    if (places && O.onceVisible) O.onceVisible(places, function () { places.classList.add('is-in'); }, 0.25);
    stack($$('.pcardx'));
    // Trạng thái trực tiếp của nông trại (giờ Việt Nam) trên thẻ bản đồ
    var st = $('#farmLive');
    if (st && O.makeWave) {
      var w = O.makeWave(st.querySelector('.live-wave'));
      var paint = function () {
        var open = false;
        try {
          var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(new Date());
          var wd = '', hr = 0;
          parts.forEach(function (p) { if (p.type === 'weekday') wd = p.value; if (p.type === 'hour') hr = Number(p.value); });
          open = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(wd) > -1 && hr >= 8 && hr < 16;
        } catch (e) {}
        st.classList.toggle('is-open', open);
        st.querySelector('.place__status-text').innerHTML = open ? ve('Đang đón khách', 'Open for visits now') : ve('Ngoài giờ đón khách', 'Closed for visits now');
        w.setLive(open);
      };
      paint(); setInterval(paint, 60000);
    }
  })();

  /* =====================================================================
     3. SẢN PHẨM: lọc, thanh lọc nổi
     ===================================================================== */
  (function () {
    var zone = $('#prodsZone');
    if (!zone) return;
    var items = $$('.prod', zone);
    var count = $('#prodCount');
    function setCount(n) { count.innerHTML = ve(n + ' sản phẩm', n + (n === 1 ? ' product' : ' products')); }
    setCount(items.length);
    var bars = $$('.pfilter .chips, .prods-bar .chips');
    var ctrls = bars.map(function (b) {
      return chips(b, function (v) {
        ctrls.forEach(function (c) {
          var other = c.el; if (other === b) return;
          c.api.pick(other.querySelector('.chip[data-v="' + v + '"]'), true);
        });
        filterList(items, function (it) { return v === 'all' || it.dataset.cat === v; }, setCount);
      });
    }).map(function (api, i) { return { api: api, el: bars[i] }; });
    var pf = $('.pfilter'), grid = $('.prods', zone);
    onScroll(function () {
      var r = grid.getBoundingClientRect(), vh = window.innerHeight;
      var head = $('.prods-bar', zone).getBoundingClientRect();
      pf.classList.toggle('is-on', head.bottom < 72 && r.bottom > vh * 0.35);
    });
  })();

  /* =====================================================================
     4. VĂN HOÁ: dải mốc kéo ngang + hướng dẫn pha có hẹn giờ
     ===================================================================== */
  (function () {
    var rail = $('#evoRail');
    if (!rail) return;
    var bar = $('#evoBar'), prev = $('#evoPrev'), next = $('#evoNext');
    function upd() {
      var max = rail.scrollWidth - rail.clientWidth;
      var p = max > 0 ? rail.scrollLeft / max : 1;
      bar.style.setProperty('--p', p.toFixed(3));
      prev.disabled = rail.scrollLeft < 4; next.disabled = rail.scrollLeft > max - 4;
    }
    rail.addEventListener('scroll', function () { requestAnimationFrame(upd); }, { passive: true });
    window.addEventListener('resize', upd); upd();
    function by(d) { var c = rail.querySelector('.evo__card'); rail.scrollBy({ left: d * (c.offsetWidth + 20), behavior: reduce ? 'auto' : 'smooth' }); }
    prev.addEventListener('click', function () { by(-1); });
    next.addEventListener('click', function () { by(1); });
    // Kéo bằng chuột như vuốt trên điện thoại
    var down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 4 && !moved) { moved = true; rail.classList.add('is-drag'); }
      if (moved) rail.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      if (moved) { rail.classList.remove('is-drag'); var c = rail.querySelector('.evo__card'); var w = c.offsetWidth + 20; rail.scrollTo({ left: Math.round(rail.scrollLeft / w) * w, behavior: 'smooth' }); }
    });
  })();

  (function () {
    var panel = $('#brewPanel');
    if (!panel) return;
    // Thông số là điểm bắt đầu cho Robusta của nhà; nếm rồi chỉnh theo khẩu vị.
    var M = {
      phin: {
        name: ['Phin nhôm', 'Aluminium phin'], desc: ['Cách pha quen thuộc của người Việt: chậm, đậm, hợp nhất với Robusta. Mỗi sáng ở nhà ông Cao vẫn bắt đầu như vậy.', 'The classic Vietnamese way: slow, strong and made for Robusta. Mornings at Mr. Cao’s still start like this.'],
        taste: [['Đậm', 'Bold'], ['Dày', 'Full-bodied'], ['Hợp sữa đặc', 'Loves condensed milk']],
        g: 20, min: 12, max: 30, ratio: 5, out: ['Nước', 'Water'], grind: ['Vừa, hơi thô', 'Medium-coarse'], temp: '92–96°C', time: ['4–5 phút', '4–5 min'],
        pick: ['Signature, bột pha phin', 'Signature, phin grind'],
        steps: [[0, 'Tráng phin và ly bằng nước sôi cho ấm.', 'Rinse the phin and cup with boiling water to warm them.'],
                [20, 'Cho {g} g cà phê vào phin, lắc nhẹ cho mặt bột phẳng, đặt nắp gài lên.', 'Add {g} g of coffee, shake it level and set the press on top.'],
                [40, 'Rót khoảng {b} ml nước để ủ, chờ 30–40 giây cho bột nở.', 'Pour about {b} ml to bloom and wait 30–40 seconds.'],
                [80, 'Rót tiếp cho đầy phin, đậy nắp lại.', 'Fill the phin to the top and cover it.'],
                [120, 'Để cà phê nhỏ giọt thong thả, khoảng 3–4 phút.', 'Let it drip slowly, about 3–4 minutes.'],
                [300, 'Thêm sữa đặc hoặc đá nếu thích. Khuấy đều rồi thưởng thức.', 'Add condensed milk or ice if you like, stir and enjoy.']],
        total: 300, svg: 'phin'
      },
      drip: {
        name: ['Drip bag', 'Drip bag'], desc: ['Vẫn là cà phê lọc, nhưng gói gọn trong một túi giấy treo miệng ly. Hợp buổi sáng vội, văn phòng và những chuyến đi.', 'Still filtered coffee, folded into a paper bag that hangs on your cup. Made for rushed mornings, offices and travel.'],
        taste: [['Nhẹ', 'Light'], ['Thơm', 'Aromatic'], ['Tiện', 'Handy']],
        g: 12, min: 10, max: 15, ratio: 13, out: ['Nước', 'Water'], grind: ['Đã xay sẵn', 'Pre-ground'], temp: '90–94°C', time: ['2–3 phút', '2–3 min'],
        pick: ['Drip bag Ông Cao', 'Ông Cao drip bag'],
        steps: [[0, 'Xé miệng túi, kéo hai quai giấy và treo lên miệng ly.', 'Tear the top, open the two paper hooks and hang it on the cup.'],
                [15, 'Rót khoảng {b} ml nước để ủ, chờ 30 giây.', 'Pour about {b} ml to bloom and wait 30 seconds.'],
                [45, 'Rót chậm theo vòng tròn, chia làm 3–4 lần cho tới khi đủ nước.', 'Pour slowly in circles, in 3–4 rounds, until all the water is in.'],
                [150, 'Đợi nước chảy hết rồi nhấc túi ra.', 'Wait for the water to drain, then lift the bag out.']],
        total: 160, svg: 'drip'
      },
      espresso: {
        name: ['Espresso', 'Espresso'], desc: ['Nước nóng đi qua lớp bột nén dưới áp suất cao. Robusta cho lớp crema dày và vị đậm, làm nền tốt cho latte hay bạc xỉu.', 'Hot water forced through tamped coffee under pressure. Robusta gives a thick crema and a bold base for lattes or bạc xỉu.'],
        taste: [['Đậm đặc', 'Intense'], ['Crema dày', 'Thick crema'], ['Hậu vị dài', 'Long finish']],
        g: 18, min: 14, max: 22, ratio: 2, out: ['Ra ly', 'Yield'], grind: ['Rất mịn', 'Very fine'], temp: '92–94°C', time: ['25–30 giây', '25–30 sec'],
        pick: ['Robusta rang mộc, hạt', 'Pure roast Robusta, beans'],
        steps: [[0, 'Xay {g} g cà phê ngay trước khi pha.', 'Grind {g} g of coffee right before brewing.'],
                [15, 'Dàn đều bột trong tay cầm và nén phẳng (tamp).', 'Distribute evenly in the basket and tamp level.'],
                [30, 'Lắp tay cầm vào máy, bấm chiết ngay.', 'Lock the portafilter in and start the shot straight away.'],
                [33, 'Chiết khoảng {o} g espresso trong 25–30 giây.', 'Pull about {o} g of espresso in 25–30 seconds.'],
                [63, 'Xong một shot. Uống ngay hoặc thêm sữa nóng.', 'That is one shot. Drink it now or add steamed milk.']],
        total: 63, svg: 'espresso'
      },
      moka: {
        name: ['Moka pot', 'Moka pot'], desc: ['Ấm nhôm hai tầng của người Ý, đặt thẳng lên bếp. Cà phê đậm gần như espresso, không cần máy.', 'The Italian two-chamber pot that sits right on the stove. Nearly espresso-strong, no machine needed.'],
        taste: [['Đậm', 'Bold'], ['Hơi khói', 'Slightly smoky'], ['Mạnh', 'Punchy']],
        g: 16, min: 12, max: 22, ratio: 10, out: ['Nước', 'Water'], grind: ['Mịn vừa', 'Medium-fine'], temp: ['Nước nóng sẵn', 'Pre-heated water'], time: ['4–5 phút', '4–5 min'],
        pick: ['Bột pha máy', 'Espresso grind'],
        steps: [[0, 'Đổ nước nóng vào bình dưới, ngang dưới van an toàn.', 'Fill the bottom chamber with hot water, just below the valve.'],
                [20, 'Cho {g} g cà phê vào phễu, gạt phẳng, không nén.', 'Add {g} g of coffee to the funnel, level it, do not tamp.'],
                [40, 'Vặn chặt hai phần, đặt lên lửa vừa nhỏ, mở nắp.', 'Screw it tight, set it on a low-medium flame, lid open.'],
                [60, 'Cà phê bắt đầu trào lên. Giữ lửa nhỏ cho dòng chảy đều.', 'Coffee starts to rise. Keep the flame low for a steady flow.'],
                [240, 'Nghe tiếng sôi phì phì thì nhấc khỏi bếp ngay.', 'When it starts to gurgle, take it off the heat.'],
                [270, 'Rót ra ly và thưởng thức khi còn nóng.', 'Pour and enjoy while hot.']],
        total: 270, svg: 'moka'
      },
      french: {
        name: ['French press', 'French press'], desc: ['Ngâm cà phê trong nước nóng rồi nhấn lưới lọc. Dễ pha, ly cà phê dày và đầy đặn.', 'Steep the coffee in hot water, then press the mesh down. Easy, with a heavy, rounded cup.'],
        taste: [['Dày', 'Heavy body'], ['Tròn vị', 'Rounded'], ['Ít đắng', 'Low bitterness']],
        g: 20, min: 12, max: 40, ratio: 15, out: ['Nước', 'Water'], grind: ['Thô', 'Coarse'], temp: '93–96°C', time: ['4 phút', '4 min'],
        pick: ['Hạt rang, xay thô', 'Roasted beans, coarse grind'],
        steps: [[0, 'Tráng bình bằng nước nóng.', 'Warm the press with hot water.'],
                [15, 'Cho {g} g cà phê xay thô vào bình.', 'Add {g} g of coarsely ground coffee.'],
                [25, 'Rót {w} ml nước, khuấy nhẹ vài vòng.', 'Pour {w} ml of water and give it a gentle stir.'],
                [40, 'Đậy nắp, kéo lưới lên trên, chờ 4 phút.', 'Put the lid on, plunger up, and wait 4 minutes.'],
                [265, 'Nhấn lưới lọc xuống chậm trong khoảng 20 giây.', 'Press the plunger down slowly over about 20 seconds.'],
                [285, 'Rót ra ngay để cà phê không bị chiết quá.', 'Pour straight away so it does not over-extract.']],
        total: 285, svg: 'french'
      },
      cold: {
        name: ['Cold brew', 'Cold brew'], desc: ['Ngâm cà phê trong nước lạnh nhiều giờ. Vị êm, ngọt hậu, hợp ngày nóng và để sẵn trong tủ lạnh cả tuần.', 'Coffee steeped in cold water for hours. Smooth and sweet, perfect for hot days and keeps in the fridge all week.'],
        taste: [['Êm', 'Smooth'], ['Ngọt hậu', 'Sweet finish'], ['Mát', 'Refreshing']],
        g: 100, min: 50, max: 200, ratio: 8, out: ['Nước', 'Water'], grind: ['Thô', 'Coarse'], temp: ['Nước lạnh', 'Cold water'], time: ['12–18 giờ', '12–18 hours'],
        pick: ['Hạt rang, xay thô', 'Roasted beans, coarse grind'],
        steps: [[0, 'Cho {g} g cà phê xay thô vào bình hoặc hũ thuỷ tinh.', 'Put {g} g of coarse coffee in a jar.'],
                [1, 'Rót {w} ml nước lọc, khuấy cho bột ngấm đều.', 'Pour in {w} ml of filtered water and stir until all is wet.'],
                [2, 'Đậy kín, để trong tủ lạnh 12–18 tiếng.', 'Cover and leave in the fridge for 12–18 hours.'],
                [3, 'Lọc qua giấy lọc hoặc vải. Pha thêm nước, sữa hoặc đá khi uống.', 'Strain through paper or cloth. Dilute with water, milk or ice to serve.']],
        total: 0, slow: true, svg: 'cold'
      },
      v60: {
        name: ['Pour over V60', 'Pour over V60'], desc: ['Rót tay qua phễu giấy. Cách pha của các quán specialty, làm rõ hương thơm và độ sạch của hạt.', 'Hand-poured through a paper cone. The specialty café method that shows off aroma and clarity.'],
        taste: [['Sạch vị', 'Clean'], ['Thơm', 'Aromatic'], ['Nhẹ', 'Light body']],
        g: 15, min: 10, max: 30, ratio: 16, out: ['Nước', 'Water'], grind: ['Vừa', 'Medium'], temp: '92–94°C', time: ['2:30–3:00', '2:30–3:00'],
        pick: ['Hạt rang', 'Roasted beans'],
        steps: [[0, 'Gấp giấy lọc, đặt vào phễu, tráng nước nóng rồi đổ nước tráng đi.', 'Fold the filter, rinse it with hot water and discard the water.'],
                [15, 'Cho {g} g cà phê, lắc nhẹ cho phẳng, tạo một lõm nhỏ ở giữa.', 'Add {g} g of coffee, level it and make a small dip in the centre.'],
                [30, 'Rót khoảng {b} ml nước để ủ (bloom), chờ 30–45 giây.', 'Pour about {b} ml to bloom and wait 30–45 seconds.'],
                [75, 'Rót xoắn ốc từ giữa ra ngoài, tới khoảng nửa lượng nước.', 'Pour in spirals from the centre out, to about half the water.'],
                [120, 'Rót tiếp tới đủ {w} ml.', 'Keep pouring up to {w} ml.'],
                [180, 'Chờ nước chảy hết. Tổng thời gian khoảng 2:30–3:00.', 'Let it drain. Total time about 2:30–3:00.']],
        total: 180, svg: 'v60'
      },
      aero: {
        name: ['AeroPress', 'AeroPress'], desc: ['Ống nhựa nhỏ nhấn bằng tay, kết hợp ngâm và ép. Nhanh, gọn, dễ mang theo.', 'A small hand-pressed tube that steeps and presses. Quick, tidy and easy to travel with.'],
        taste: [['Tròn vị', 'Rounded'], ['Ít chua', 'Low acidity'], ['Linh hoạt', 'Versatile']],
        g: 15, min: 11, max: 20, ratio: 14, out: ['Nước', 'Water'], grind: ['Mịn vừa', 'Medium-fine'], temp: '85–90°C', time: ['2 phút', '2 min'],
        pick: ['Hạt rang', 'Roasted beans'],
        steps: [[0, 'Đặt giấy lọc vào nắp, tráng nước nóng.', 'Put a paper filter in the cap and rinse it.'],
                [15, 'Cho {g} g cà phê vào ống.', 'Add {g} g of coffee to the chamber.'],
                [25, 'Rót {w} ml nước, khuấy khoảng 10 giây.', 'Pour {w} ml of water and stir for about 10 seconds.'],
                [40, 'Lắp pít-tông lên, chờ 1 phút.', 'Insert the plunger and wait 1 minute.'],
                [100, 'Nhấn đều tay xuống trong khoảng 30 giây.', 'Press down steadily for about 30 seconds.'],
                [130, 'Thêm nước nóng nếu muốn ly nhẹ hơn.', 'Top up with hot water for a lighter cup.']],
        total: 130, svg: 'aero'
      }
    };
    var SVG = {};
    $$('#brewSvgs [data-svg]').forEach(function (t) { SVG[t.dataset.svg] = t.innerHTML; });
    var el = {
      device: $('#brewDevice'), name: $('#brewName'), desc: $('#brewDesc'), taste: $('#brewTaste'), pick: $('#brewPick'),
      specs: $('#brewSpecs'), range: $('#brewG'), gOut: $('#brewGOut'), wOut: $('#brewWOut'), wLabel: $('#brewWLabel'),
      steps: $('#brewSteps'), timer: $('#brewTimer'), ring: $('#brewRing'), time: $('#brewTime'),
      start: $('#brewStart'), reset: $('#brewReset'), note: $('#brewNote'), swaps: $$('.brew__swap', panel)
    };
    var m = null, g = 0, t0 = 0, elapsed = 0, raf = null, running = false;
    function fmt(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
    function water() { return Math.round(g * m.ratio); }
    function fill(txt) { return txt.replace('{g}', g).replace('{w}', water()).replace('{o}', water()).replace('{b}', Math.round(g * 2)); }
    function renderSpecs() {
      var T = function (v) { return Array.isArray(v) ? ve(v[0], v[1]) : v; };
      el.specs.innerHTML = [
        [['Cà phê', 'Coffee'], g + ' g'], [m.out, water() + (m.out[0] === 'Ra ly' ? ' g' : ' ml')], [['Tỉ lệ', 'Ratio'], '1 : ' + m.ratio],
        [['Độ xay', 'Grind'], T(m.grind)], [['Nhiệt độ', 'Temperature'], T(m.temp)], [['Thời gian', 'Time'], T(m.time)]
      ].map(function (s) { return '<div class="spec lg"><small>' + ve(s[0][0], s[0][1]) + '</small><b>' + s[1] + '</b></div>'; }).join('');
      el.gOut.textContent = g + ' g';
      el.wOut.textContent = water() + (m.out[0] === 'Ra ly' ? ' g' : ' ml');
      el.wLabel.innerHTML = ve(m.out[0], m.out[1]);
      el.steps.innerHTML = m.steps.map(function (s) {
        var label = m.slow ? ve('Bước ' + (s[0] + 1), 'Step ' + (s[0] + 1)) : fmt(s[0]);
        return '<li class="bstep" data-t="' + s[0] + '"><span class="bstep__t">' + label + '</span><span class="bstep__x">' + ve(fill(s[1]), fill(s[2])) + '</span></li>';
      }).join('');
      paintTimer();
      if (O.refreshLights) O.refreshLights();
    }
    function paintTimer() {
      if (m.slow) return;
      var p = clamp(elapsed / m.total, 0, 1);
      el.ring.style.setProperty('--tp', p.toFixed(4));
      el.time.textContent = fmt(running || elapsed ? elapsed : m.total);
      var lis = $$('.bstep', el.steps), now = -1;
      lis.forEach(function (li, i) { if (elapsed >= Number(li.dataset.t)) now = i; });
      lis.forEach(function (li, i) {
        li.classList.toggle('is-now', (running || elapsed > 0) && i === now && elapsed < m.total);
        li.classList.toggle('is-done', (running || elapsed > 0) && (i < now || elapsed >= m.total));
      });
    }
    function tick(t) {
      elapsed = (t - t0) / 1000;
      if (elapsed >= m.total) { elapsed = m.total; stop(); el.start.innerHTML = ve('Pha lại', 'Brew again'); }
      paintTimer();
      if (running) raf = requestAnimationFrame(tick);
    }
    function stop() { running = false; cancelAnimationFrame(raf); }
    el.start.addEventListener('click', function () {
      if (running) { stop(); el.start.innerHTML = ve('Tiếp tục', 'Resume'); return; }
      if (elapsed >= m.total) elapsed = 0;
      running = true; t0 = performance.now() - elapsed * 1000;
      el.start.innerHTML = ve('Tạm dừng', 'Pause');
      raf = requestAnimationFrame(tick);
    });
    el.reset.addEventListener('click', function () { stop(); elapsed = 0; el.start.innerHTML = ve('Bắt đầu pha', 'Start brewing'); paintTimer(); });
    el.range.addEventListener('input', function () { g = Number(el.range.value); renderSpecs(); });
    function show(key, first) {
      stop(); elapsed = 0;
      var apply = function () {
        m = M[key]; g = m.g;
        el.range.min = m.min; el.range.max = m.max; el.range.step = m.max > 60 ? 10 : 1; el.range.value = g;
        el.device.innerHTML = SVG[m.svg] || '';
        measure(el.device); redraw(el.device.querySelector('svg'));
        el.name.innerHTML = ve(m.name[0], m.name[1]);
        el.desc.innerHTML = ve(m.desc[0], m.desc[1]);
        el.taste.innerHTML = m.taste.map(function (x) { return '<span>' + ve(x[0], x[1]) + '</span>'; }).join('');
        el.pick.querySelector('.brew__pick-name').innerHTML = ve('Gợi ý hạt: ' + m.pick[0], 'Suggested: ' + m.pick[1]);
        el.timer.hidden = !!m.slow; el.note.hidden = !m.slow;
        el.start.innerHTML = ve('Bắt đầu pha', 'Start brewing');
        renderSpecs();
        el.swaps.forEach(function (s) { s.classList.remove('is-swapping'); });
      };
      if (first || reduce) { apply(); return; }
      el.swaps.forEach(function (s) { s.classList.add('is-swapping'); });
      setTimeout(apply, 320);
    }
    var tabs = chips($('#brewTabs'), function (v) { show(v); history.replaceState(null, '', '#pha-' + v); });
    var fromHash = (location.hash.match(/^#pha-(\w+)/) || [])[1];
    var startKey = M[fromHash] ? fromHash : 'phin';
    if (startKey !== 'phin') tabs.pick($('#brewTabs .chip[data-v="' + startKey + '"]'), true);
    show(startKey, true);
    // Đến từ liên kết "#pha-...": cuộn tới khu hướng dẫn pha
    if (fromHash) setTimeout(function () { var sec = document.getElementById('pha'); if (sec) sec.scrollIntoView({ behavior: 'auto', block: 'start' }); }, 60);
  })();

  /* =====================================================================
     5. MỘT NĂM: lịch mùa vụ, trạng thái trực tiếp, thẻ giai đoạn xếp chồng
     ===================================================================== */
  (function () {
    var cal = $('#ycal');
    if (!cal) return;
    var months = O.stageMonths || [[2, 3], [4, 5, 6, 7, 8, 9, 10], [11, 12, 1], [12, 1, 2], null];
    var now = typeof O.nowIdx === 'number' ? O.nowIdx : 0;
    var mNow = new Date().getMonth() + 1;
    var grid = $('.ycal__grid', cal);
    var rows = $$('.ycal__label', grid);
    var COLORS = rows.map(function (r) { return getComputedStyle(r).getPropertyValue('--c'); });
    // Thanh của từng giai đoạn; giai đoạn vắt qua năm mới được tách thành hai đoạn
    rows.forEach(function (row, i) {
      var r = i + 2, list = months[i];
      if (!list) {
        grid.insertAdjacentHTML('beforeend', '<span class="ycal__bar ycal__bar--all" style="grid-row:' + r + ';grid-column:2 / 14;--c:' + COLORS[i] + ';--d:' + i + '"></span>');
        return;
      }
      var segs = [], s = null, prev = null;
      list.forEach(function (mm) { if (s === null) { s = mm; prev = mm; } else if (mm === prev + 1) prev = mm; else { segs.push([s, prev]); s = mm; prev = mm; } });
      segs.push([s, prev]);
      segs.forEach(function (sg) {
        grid.insertAdjacentHTML('beforeend', '<span class="ycal__bar" style="grid-row:' + r + ';grid-column:' + (sg[0] + 1) + ' / ' + (sg[1] + 2) + ';--c:' + COLORS[i] + ';--d:' + i + '"></span>');
      });
      row.addEventListener('click', function () { var c = document.getElementById('giai-doan-' + (i + 1)); if (c) c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });
    });
    $$('.ycal__m', grid).forEach(function (m, i) { m.classList.toggle('is-now', i + 1 === mNow); });
    // Vạch "Hôm nay" theo ngày trong tháng
    var today = $('.ycal__today', grid);
    function placeToday() {
      var first = $('.ycal__m', grid), gr = grid.getBoundingClientRect(), fr = first.getBoundingClientRect();
      var d = new Date(), days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      today.style.left = (fr.left - gr.left + fr.width * (mNow - 1) + fr.width * (d.getDate() - 0.5) / days) + 'px';
    }
    placeToday(); window.addEventListener('resize', placeToday);
    if (O.onceVisible) O.onceVisible(cal, function () { cal.classList.add('is-in'); }, 0.3); else cal.classList.add('is-in');

    // Trạng thái trực tiếp ở hero và trên thẻ giai đoạn hiện tại
    var live = $('#yLive');
    if (live && O.makeWave) {
      O.makeWave(live.querySelector('.live-wave')).setLive(true);
      var st = O.stages && O.stages[now] ? O.stages[now].status : null;
      if (st) live.querySelector('.ylive__text').innerHTML = ve('Đang diễn ra: ' + st.vi, 'Live: ' + st.en);
    }
    var cards = $$('.ycard');
    cards.forEach(function (c, i) {
      var on = i === now;
      c.classList.toggle('is-now', on);
      var b = c.querySelector('.ycard__live');
      if (b) { b.hidden = !on; if (on && O.makeWave) O.makeWave(b.querySelector('.live-wave')).setLive(true); }
    });
    // Rê chuột vào thẻ: icon chạy hiệu ứng như giai đoạn ở trang chủ
    cards.forEach(function (c) {
      var ring = c.querySelector('.ycard__ring');
      c.addEventListener('mouseenter', function () { ring.classList.add('ico-live'); });
      c.addEventListener('mouseleave', function () { ring.classList.remove('ico-live'); });
    });
    stack(cards);
  })();

  /* =====================================================================
     6. NHẬT KÝ: lọc theo chủ đề, xem thêm bài
     ===================================================================== */
  (function () {
    var grid = $('#nGrid');
    if (!grid) return;
    var items = $$('.ncard', grid);
    var more = $('#nMore'), count = $('#nCount'), cat = 'all', shown = 9;
    function test(it, i) { return (cat === 'all' || it.dataset.cat === cat); }
    function apply() {
      var k = 0;
      filterList(items, function (it) { var ok = test(it); if (ok) k++; return ok && k <= shown; }, function (n) {
        var total = items.filter(function (it) { return test(it); }).length;
        count.innerHTML = ve(total + ' bài viết', total + (total === 1 ? ' story' : ' stories'));
        more.hidden = total <= shown;
      });
    }
    chips($('#nChips'), function (v) { cat = v; shown = 9; apply(); });
    $$('.js-more', more).forEach(function (b) { b.addEventListener('click', function () { shown += 6; apply(); }); });
    items.forEach(function (it, i) { if (i >= shown) it.hidden = true; });
    var total = items.length;
    count.innerHTML = ve(total + ' bài viết', total + ' stories');
    more.hidden = total <= shown;
  })();
})();
