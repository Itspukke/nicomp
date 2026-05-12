/* =============================================
   NICOMP GROUP — main.js
   ============================================= */

/* ── GLOBAL nav functions — defined immediately, before ANY event fires ── */
var _mobNav = null;

function closeMobNav() {
  var el = document.getElementById('mobileNav');
  if (el) { el.classList.remove('open'); }
  document.body.style.overflow = '';
}

function openMobNav() {
  var el = document.getElementById('mobileNav');
  if (el) { el.classList.add('open'); }
  document.body.style.overflow = 'hidden';
}

/* ── Everything else runs after DOM is ready ── */
document.addEventListener('DOMContentLoaded', function () {
  /* Always land on hero on load/refresh */
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  /* Wire hamburger button */
  var navToggle = document.getElementById('navToggle');
  if (navToggle) {
    navToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      openMobNav();
    });
  }

  /* Wire X close button — belt AND braces */
  var mobClose = document.getElementById('mobNavClose');
  if (mobClose) {
    /* addEventListener */
    mobClose.addEventListener('click', function(e) {
      e.stopPropagation();
      closeMobNav();
    });
    /* also set onclick directly on the element */
    mobClose.onclick = function(e) {
      e.stopPropagation();
      closeMobNav();
      return false;
    };
  }

  /* Close on backdrop tap (only when tapping the overlay itself) */
  var overlay = document.getElementById('mobileNav');
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeMobNav();
    });
  }

  /* Close on ESC */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeMobNav();
  });

  /* ── HERO SLIDESHOW ── */
  var cur    = 0;
  var slides = document.querySelectorAll('.hero-slide');
  var dots   = document.querySelectorAll('.hdot');
  var strips = document.querySelectorAll('.strip-item');
  var timer  = null;

  function goSlide(n) {
    if (!slides.length) return;
    slides[cur].classList.remove('active');
    if (dots[cur])   dots[cur].classList.remove('active');
    if (strips[cur]) strips[cur].classList.remove('si-active');
    cur = n;
    slides[cur].classList.add('active');
    if (dots[cur])   dots[cur].classList.add('active');
    if (strips[cur]) strips[cur].classList.add('si-active');
    clearInterval(timer);
    timer = setInterval(function() { goSlide((cur + 1) % slides.length); }, 4000);
  }
  window.goSlide = goSlide;

  if (slides.length) {
    timer = setInterval(function() { goSlide((cur + 1) % slides.length); }, 4000);
  }
  strips.forEach(function(s, i) {
    s.addEventListener('click', function() { goSlide(i); });
  });

  /* ── NAV solid on scroll ── */
  window.addEventListener('scroll', function() {
    var nav = document.getElementById('mainNav');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 80);
  });

  /* ── SERVICES TAB SWITCHER ── */
  var tabs   = document.querySelectorAll('.svc-tab');
  var panels = document.querySelectorAll('.svc-panel');
  var ink    = document.querySelector('.svc-tab-ink');

  function positionInk(tab) {
    if (!ink) return;
    var parent = tab.parentElement;
    /* offsetLeft and offsetWidth are always correct regardless of scroll */
    ink.style.left  = tab.offsetLeft + 'px';
    ink.style.width = tab.offsetWidth + 'px';
  }

  function activateTab(idx) {
    tabs.forEach(function(t) { t.classList.remove('active'); });
    panels.forEach(function(p) { p.classList.remove('active'); });
    if (!tabs[idx] || !panels[idx]) return;
    tabs[idx].classList.add('active');
    panels[idx].classList.add('active');

    /* Position ink first using offsetLeft/offsetWidth (scroll-independent) */
    positionInk(tabs[idx]);

    /* Scroll active tab into view */
    tabs[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    /* Reposition after scroll settles to handle any drift */
    setTimeout(function() { positionInk(tabs[idx]); }, 350);
  }

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      activateTab(parseInt(tab.dataset.tab, 10));
    });
  });
  if (tabs.length) setTimeout(function() { activateTab(0); }, 60);

  window.addEventListener('resize', function() {
    var active = document.querySelector('.svc-tab.active');
    if (active) activateTab(parseInt(active.dataset.tab, 10));
  });

  /* ── SCROLL REVEAL ── */
  var revealObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll(
    '.reveal, .reveal-left, .reveal-right, .reveal-scale, ' +
    '.pstep, .why-item, .value-item, .work-card, .stat, ' +
    '.contact-card, .info-card, .svc-item-card'
  ).forEach(function(el) { revealObs.observe(el); });

  /* ── CONTACT FORM ── */
  var submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', function() {
      var fn  = document.getElementById('firstName').value.trim();
      var ln  = document.getElementById('lastName').value.trim();
      var em  = document.getElementById('email').value.trim();
      var sv  = document.getElementById('service').value;
      var ms  = document.getElementById('message').value.trim();
      var msg = document.getElementById('formMsg');
      if (!fn || !ln) { showMsg(msg, 'error', 'Please enter your full name.'); return; }
      if (!em || !em.includes('@')) { showMsg(msg, 'error', 'Please enter a valid email address.'); return; }
      if (!sv) { showMsg(msg, 'error', 'Please select the service you are interested in.'); return; }
      if (!ms) { showMsg(msg, 'error', 'Please tell us about your project.'); return; }
      var co = document.getElementById('company').value.trim();
      var ph = document.getElementById('phone').value.trim();
      var bg = document.getElementById('budget').value;
      var subject = encodeURIComponent('New Enquiry from ' + fn + ' ' + ln + ' \u2014 ' + sv);
      var body = encodeURIComponent(
        'New enquiry from the Nicomp Group website\n\n' +
        'Name: ' + fn + ' ' + ln + '\n' +
        'Email: ' + em + '\n' +
        'Phone: ' + (ph || 'Not provided') + '\n' +
        'Company: ' + (co || 'Not provided') + '\n' +
        'Service: ' + sv + '\n' +
        'Budget: ' + (bg || 'Not specified') + '\n\nMessage:\n' + ms
      );
      window.location.href = 'mailto:info@nicompgroup.com?subject=' + subject + '&body=' + body;
      showMsg(msg, 'success', '\u2713 Email client opened \u2014 please hit Send. We\'ll reply within one business day!');
    });
  }

  function showMsg(el, type, text) {
    if (!el) return;
    el.className = 'form-msg ' + type;
    el.textContent = text;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

}); /* end DOMContentLoaded */