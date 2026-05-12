/* =============================================
   NICOMP GROUP — main.js  v5
   Major fixes:
   - Scroll jump: removed history.scrollTo on load; use scrollRestoration
   - Mobile nav: body.nav-open class (position:fixed) prevents page jump
   - Hero slideshow: opacity-only transition, no transform
   - Service tab ink: requestAnimationFrame + ResizeObserver for accuracy
   - Reveal: IntersectionObserver with once:true and rootMargin tuning
   - Nav scroll: throttled via requestAnimationFrame flag
   ============================================= */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────
     1. SCROLL RESTORATION
     FIX: scrollRestoration = 'manual' in HTML head prevents
     browser from jumping to a remembered scroll position.
     We DON'T call window.scrollTo on DOMContentLoaded — that
     itself causes a jump. Let the browser load at top naturally.
  ─────────────────────────────────────────────── */

  /* ──────────────────────────────────────────────
     2. MOBILE NAV
     FIX: body.nav-open applies position:fixed + overflow:hidden
     which locks page scroll without a jump. We store scrollY
     before locking and restore it on close.
  ─────────────────────────────────────────────── */
  var _scrollY = 0;

  function openMobNav() {
    var nav = document.getElementById('mobileNav');
    var toggle = document.getElementById('navToggle');
    if (!nav) return;

    // Store current scroll position before locking body
    _scrollY = window.scrollY || window.pageYOffset || 0;

    nav.classList.add('open');
    document.body.classList.add('nav-open');
    // FIX: set top so the page doesn't jump when position:fixed is applied
    document.body.style.top = '-' + _scrollY + 'px';

    if (toggle) toggle.classList.add('active');
  }

  function closeMobNav() {
    var nav = document.getElementById('mobileNav');
    var toggle = document.getElementById('navToggle');
    if (!nav) return;

    nav.classList.remove('open');
    document.body.classList.remove('nav-open');
    // FIX: restore scroll position after removing position:fixed
    document.body.style.top = '';
    window.scrollTo(0, _scrollY);

    if (toggle) toggle.classList.remove('active');
  }

  // Expose globally for onclick handlers
  window.openMobNav  = openMobNav;
  window.closeMobNav = closeMobNav;

  /* ──────────────────────────────────────────────
     3. DOM READY
  ─────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {

    /* ── Wire hamburger ── */
    var navToggle = document.getElementById('navToggle');
    if (navToggle) {
      navToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var nav = document.getElementById('mobileNav');
        if (nav && nav.classList.contains('open')) {
          closeMobNav();
        } else {
          openMobNav();
        }
      });
    }

    /* ── Wire close button ── */
    var mobClose = document.getElementById('mobNavClose');
    if (mobClose) {
      mobClose.addEventListener('click', function (e) {
        e.stopPropagation();
        closeMobNav();
      });
    }

    /* ── Close on nav link clicks (data-close-nav attribute) ── */
    document.querySelectorAll('[data-close-nav]').forEach(function (link) {
      link.addEventListener('click', function () {
        closeMobNav();
      });
    });

    /* ── Close on overlay backdrop tap ── */
    var overlay = document.getElementById('mobileNav');
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        // Only close when clicking the backdrop, not children
        if (e.target === overlay) closeMobNav();
      });
    }

    /* ── Close on Escape ── */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMobNav();
    });

    /* ──────────────────────────────────────────────
       4. NAV SCROLL BEHAVIOUR
       FIX: Use rAF flag to throttle scroll handler —
       prevents excessive style recalculations that
       cause layout jitter during scroll.
    ─────────────────────────────────────────────── */
    var mainNav = document.getElementById('mainNav');
    var navTicking = false;

    function updateNav() {
      if (!mainNav) return;
      var scrolled = (window.scrollY || window.pageYOffset) > 80;
      mainNav.classList.toggle('scrolled', scrolled);
      navTicking = false;
    }

    window.addEventListener('scroll', function () {
      if (!navTicking) {
        requestAnimationFrame(updateNav);
        navTicking = true;
      }
    }, { passive: true });

    // Set initial state
    updateNav();

    /* ──────────────────────────────────────────────
       5. HERO SLIDESHOW
       FIX: Uses opacity transitions only (no transform/scale)
       to prevent reflow and scroll position shifts.
    ─────────────────────────────────────────────── */
    var slides  = document.querySelectorAll('.hero-slide');
    var dots    = document.querySelectorAll('.hdot');
    var strips  = document.querySelectorAll('.strip-item');
    var curSlide = 0;
    var slideTimer = null;
    var SLIDE_INTERVAL = 4500;

    function goSlide(n) {
      if (!slides.length) return;
      // Wrap around
      n = ((n % slides.length) + slides.length) % slides.length;

      // Remove active from previous
      slides[curSlide].classList.remove('active');
      if (dots[curSlide])   dots[curSlide].classList.remove('active');
      if (strips[curSlide]) strips[curSlide].classList.remove('si-active');

      curSlide = n;

      // Add active to current
      slides[curSlide].classList.add('active');
      if (dots[curSlide])   dots[curSlide].classList.add('active');
      if (strips[curSlide]) strips[curSlide].classList.add('si-active');

      // Restart timer after manual slide change
      clearInterval(slideTimer);
      slideTimer = setInterval(function () {
        goSlide(curSlide + 1);
      }, SLIDE_INTERVAL);
    }

    // Expose goSlide globally for inline onclick handlers
    window.goSlide = goSlide;

    if (slides.length > 1) {
      slideTimer = setInterval(function () {
        goSlide(curSlide + 1);
      }, SLIDE_INTERVAL);
    }

    // Strip thumbnail clicks
    strips.forEach(function (strip, i) {
      strip.addEventListener('click', function () { goSlide(i); });
    });

    /* ──────────────────────────────────────────────
       6. SERVICE TABS
       FIX: Tab ink uses offsetLeft/offsetWidth read
       inside rAF to avoid layout thrash.
       ResizeObserver repositions ink on resize.
    ─────────────────────────────────────────────── */
    var tabs   = document.querySelectorAll('.svc-tab');
    var panels = document.querySelectorAll('.svc-panel');
    var ink    = document.querySelector('.svc-tab-ink');
    var tabContainer = document.querySelector('.svc-tabs');

    function positionInk(tab) {
      if (!ink || !tab || !tabContainer) return;
      requestAnimationFrame(function () {
        // FIX: measure after rAF so layout is settled
        var containerRect = tabContainer.getBoundingClientRect();
        var tabRect = tab.getBoundingClientRect();
        // Position relative to container, accounting for scroll
        var relLeft = tabRect.left - containerRect.left + tabContainer.scrollLeft;
        ink.style.left  = relLeft + 'px';
        ink.style.width = tabRect.width + 'px';
      });
    }

    function activateTab(idx) {
      if (idx < 0 || idx >= tabs.length) return;

      // Update tab ARIA + classes
      tabs.forEach(function (t, i) {
        t.classList.toggle('active', i === idx);
        t.setAttribute('aria-selected', i === idx ? 'true' : 'false');
      });

      // Update panels
      panels.forEach(function (p, i) {
        var isActive = i === idx;
        p.classList.toggle('active', isActive);
      });

      // Re-observe service item cards in active panel
      var activePanel = panels[idx];
      if (activePanel) {
        activePanel.querySelectorAll('.svc-item-card').forEach(function (card) {
          card.classList.remove('in-view');
          revealObserver.observe(card);
        });
      }

      // Position ink
      positionInk(tabs[idx]);

      // Scroll active tab into view (within the tabs container)
      tabs[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        activateTab(parseInt(tab.dataset.tab, 10));
      });
    });

    // Initial ink position — wait for fonts/layout to settle
    if (tabs.length) {
      setTimeout(function () { activateTab(0); }, 120);
    }

    // FIX: ResizeObserver repositions ink when viewport changes
    if (window.ResizeObserver && tabContainer) {
      var tabResizeObs = new ResizeObserver(function () {
        var activeTab = document.querySelector('.svc-tab.active');
        if (activeTab) positionInk(activeTab);
      });
      tabResizeObs.observe(tabContainer);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', function () {
        var activeTab = document.querySelector('.svc-tab.active');
        if (activeTab) positionInk(activeTab);
      }, { passive: true });
    }

    /* ──────────────────────────────────────────────
       7. SCROLL REVEAL — IntersectionObserver
       FIX: rootMargin tuned so reveal fires slightly
       before element enters viewport, avoiding pop-in.
       unobserve after reveal so it only fires once.
    ─────────────────────────────────────────────── */
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -32px 0px'
    });

    // All reveal elements
    var revealSelectors = [
      '.reveal',
      '.reveal-left',
      '.reveal-right',
      '.pstep',
      '.why-item',
      '.value-item',
      '.work-card',
      '.stat',
      '.contact-card',
      '.svc-item-card',
      '.work-strip-label'
    ].join(', ');

    document.querySelectorAll(revealSelectors).forEach(function (el) {
      // FIX: Don't observe elements that are already in the viewport on load
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92) {
        el.classList.add('in-view');
      } else {
        revealObserver.observe(el);
      }
    });

    /* ──────────────────────────────────────────────
       8. SMOOTH ANCHOR SCROLLING
       FIX: Account for fixed nav height when scrolling
       to anchors so content isn't hidden behind nav.
    ─────────────────────────────────────────────── */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var target = document.querySelector(anchor.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        var navHeight = mainNav ? mainNav.offsetHeight : 70;
        var top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });

    /* ──────────────────────────────────────────────
       9. CONTACT FORM (contact.html)
    ─────────────────────────────────────────────── */
    var submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        var fn  = (document.getElementById('firstName') || {}).value || '';
        var ln  = (document.getElementById('lastName')  || {}).value || '';
        var em  = (document.getElementById('email')     || {}).value || '';
        var sv  = (document.getElementById('service')   || {}).value || '';
        var ms  = (document.getElementById('message')   || {}).value || '';
        var msg = document.getElementById('formMsg');

        fn = fn.trim(); ln = ln.trim(); em = em.trim(); sv = sv.trim(); ms = ms.trim();

        if (!fn || !ln) { showMsg(msg, 'error', 'Please enter your full name.'); return; }
        if (!em || !em.includes('@')) { showMsg(msg, 'error', 'Please enter a valid email address.'); return; }
        if (!sv) { showMsg(msg, 'error', 'Please select the service you are interested in.'); return; }
        if (!ms) { showMsg(msg, 'error', 'Please tell us about your project.'); return; }

        var co = ((document.getElementById('company') || {}).value || '').trim();
        var ph = ((document.getElementById('phone')   || {}).value || '').trim();
        var bg = ((document.getElementById('budget')  || {}).value || '').trim();

        var subject = encodeURIComponent('New Enquiry from ' + fn + ' ' + ln + ' — ' + sv);
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
        showMsg(msg, 'success', '✓ Email client opened — please hit Send. We\'ll reply within one business day!');
      });
    }

    function showMsg(el, type, text) {
      if (!el) return;
      el.className = 'form-msg ' + type;
      el.textContent = text;
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

  }); // end DOMContentLoaded

}()); // end IIFE
