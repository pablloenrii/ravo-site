/* ============================================================
   RAVO — script.js
   Header scroll state, mobile nav, scroll reveal, contact form
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Header scroll state ---------- */
  const header = document.querySelector('.header');
  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 12) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navMobile = document.querySelector('.nav-mobile');

  if (navToggle && navMobile) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMobile.classList.toggle('is-open');
      navToggle.classList.toggle('is-active');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navMobile.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navMobile.classList.remove('is-open');
        navToggle.classList.remove('is-active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Animated stat counters ---------- */
  const counters = document.querySelectorAll('[data-count]');

  if ('IntersectionObserver' in window && counters.length) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseFloat(el.dataset.count);
          const suffix = el.dataset.suffix || '';
          const duration = 1400;
          const start = performance.now();

          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = target * eased;
            el.textContent = (Number.isInteger(target) ? Math.round(value) : value.toFixed(1)) + suffix;
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          counterObserver.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach((el) => counterObserver.observe(el));
  }

  /* ---------- Contact form (Formspree) ---------- */
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    const statusEl = document.querySelector('#form-status');
    const originalNote = statusEl ? statusEl.innerHTML : '';

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = btn.innerHTML;
      const actionUrl = contactForm.getAttribute('action') || '';

      if (!actionUrl || actionUrl.includes('SEU_FORM_ID')) {
        if (statusEl) {
          statusEl.textContent = 'Formulário ainda não configurado: substitua SEU_FORM_ID pelo ID gerado no Formspree em contato.html.';
          statusEl.style.color = '#e08a3c';
        }
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Enviando...';
      if (statusEl) {
        statusEl.textContent = 'Enviando sua mensagem...';
        statusEl.style.color = '';
      }

      try {
        const response = await fetch(actionUrl, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          contactForm.reset();
          btn.innerHTML = 'Mensagem enviada';
          if (statusEl) {
            statusEl.textContent = 'Mensagem enviada com sucesso. Retornaremos em breve.';
            statusEl.style.color = '#3ecf6e';
          }
        } else {
          throw new Error('Formspree respondeu com erro');
        }
      } catch (err) {
        btn.innerHTML = originalBtnText;
        if (statusEl) {
          statusEl.textContent = 'Não foi possível enviar agora. Tente novamente ou escreva para sistema@ravocompany.com.br.';
          statusEl.style.color = '#e05c5c';
        }
      } finally {
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = originalBtnText;
          if (statusEl) {
            statusEl.style.color = '';
            statusEl.innerHTML = originalNote;
          }
        }, 4500);
      }
    });
  }

  /* ---------- Cursor spotlight on cards ---------- */
  const spotlightSelector = '.card, .client-card';
  document.addEventListener('pointermove', (e) => {
    const target = e.target.closest ? e.target.closest(spotlightSelector) : null;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    target.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
    target.style.setProperty('--my', (e.clientY - rect.top) + 'px');
  }, { passive: true });

  /* ---------- Active nav link by current page ---------- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });
});
