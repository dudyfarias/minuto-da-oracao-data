/**
 * GEO Supplement v4 — Additions over Script Bundle v3
 * Loads via "Códigos externos" on page load (better for crawlers)
 *
 * Adds: Person schema, Speakable, llms.txt links, Noscript fallback
 * Does NOT duplicate: Organization, Article, BreadcrumbList, FAQPage (handled by v3)
 */

/* ====== PART 1: Noscript Fallback + Meta Update ====== */
(function() {
  'use strict';

  var DAILY_URL = 'https://cdn.jsdelivr.net/gh/dudyfarias/minuto-da-oracao-data@main/daily.json';
  var path = window.location.pathname;

  function el(tag, text, className) {
    var e = document.createElement(tag);
    if (text) e.textContent = text;
    if (className) e.className = className;
    return e;
  }

  function paragraphs(parent, text) {
    (text || '').split('\n').forEach(function(line) {
      if (line.trim()) parent.appendChild(el('p', line.trim()));
    });
  }

  function setMetaContent(selector, value) {
    var tag = document.querySelector(selector);
    if (tag && value) tag.setAttribute('content', value);
  }

  function injectNoscriptContent() {
    fetch(DAILY_URL)
      .then(function(r) { return r.json(); })
      .then(function(daily) {
        var isOracaoPage = path.indexOf('/oracao-do-dia') === 0;
        var isSantoPage = path.indexOf('/santo-do-dia') === 0;
        var isHome = (path === '/' || path === '');

        if (isOracaoPage && daily.oracao) {
          var o = daily.oracao;
          var article = document.createElement('article');
          article.className = 'mo-noscript-content';
          article.appendChild(el('h1', o.titulo));
          var bq = el('blockquote', null, 'prayer-text');
          paragraphs(bq, o.texto);
          article.appendChild(bq);
          article.appendChild(el('p', o.reflexao, 'reflection-text'));
          article.appendChild(el('p', o.versiculo, 'verse-text'));
          var noscript = document.createElement('noscript');
          noscript.appendChild(article);
          var main = document.getElementById('main-content');
          if (main) main.appendChild(noscript);

          if (daily.meta && daily.meta.oracao) {
            setMetaContent('meta[name="description"]', daily.meta.oracao.description);
            setMetaContent('meta[property="og:description"]', daily.meta.oracao.description);
          }
        }

        if (isSantoPage && daily.santo) {
          var s = daily.santo;
          var article2 = document.createElement('article');
          article2.className = 'mo-noscript-content';
          article2.appendChild(el('h1', s.nome + ' — ' + s.titulo));
          article2.appendChild(el('p', s.resumo, 'intro'));
          var hist = document.createElement('div');
          paragraphs(hist, s.historia);
          article2.appendChild(hist);
          var bq2 = el('blockquote', null, 'prayer-text');
          paragraphs(bq2, s.oracao);
          article2.appendChild(bq2);
          var noscript2 = document.createElement('noscript');
          noscript2.appendChild(article2);
          var main2 = document.querySelector('[data-santo-page]') || document.getElementById('main-content');
          if (main2) main2.appendChild(noscript2);

          if (daily.meta && daily.meta.santo) {
            setMetaContent('meta[name="description"]', daily.meta.santo.description);
            setMetaContent('meta[property="og:description"]', daily.meta.santo.description);
          }
        }

        if (isHome && daily.oracao && daily.santo) {
          var hidden = document.createElement('div');
          hidden.className = 'mo-seo-content';
          hidden.setAttribute('aria-hidden', 'true');
          hidden.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);';
          hidden.appendChild(el('h2', 'Oração do Dia — ' + daily.oracao.titulo));
          hidden.appendChild(el('p', daily.oracao.texto.substring(0, 300) + '...'));
          hidden.appendChild(el('p', daily.oracao.reflexao));
          hidden.appendChild(el('h2', 'Santo do Dia — ' + daily.santo.nome));
          hidden.appendChild(el('p', daily.santo.resumo));
          document.body.appendChild(hidden);
        }
      })
      .catch(function(e) { console.warn('GEO noscript:', e); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNoscriptContent);
  } else {
    injectNoscriptContent();
  }
})();

/* ====== PART 2: GEO Supplement — Person, Speakable, llms.txt ====== */
(function() {
  'use strict';

  var SITE_URL = 'https://www.minutodaoracao.com.br';
  var SITE_NAME = 'Minuto da Oração';
  var AUTHOR_NAME = 'Eduardo Farias Cappia';
  var EMAIL = 'contato@minutodaoracao.com.br';

  function injectSchema(data) {
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  function injectLink(rel, href, type) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (type) link.type = type;
    document.head.appendChild(link);
  }

  // llms.txt links for AI crawler discoverability (all pages)
  injectLink('llms', 'https://cdn.jsdelivr.net/gh/dudyfarias/minuto-da-oracao-data@main/llms.txt', 'text/plain');
  injectLink('llms-full', 'https://cdn.jsdelivr.net/gh/dudyfarias/minuto-da-oracao-data@main/llms-full.txt', 'text/plain');

  var path = window.location.pathname;

  // Speakable for content pages (enhances Article schema from v3)
  var contentPages = [
    '/oracao-do-dia/', '/santo-do-dia/', '/oracao-da-manha/',
    '/oracao-de-protecao/', '/oracao-para-ansiedade/',
    '/oracao-para-familia/', '/oracao-para-prosperidade/',
    '/oracao-para-cura/', '/oracao-pelo-casamento/',
    '/oracao-pelos-filhos/', '/oracao-de-gratidao/',
    '/oracao-para-luto/'
  ];

  if (contentPages.some(function(p) { return path.indexOf(p) === 0; })) {
    injectSchema({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["article h1", "article > p:first-of-type", ".mo-prayer-block", ".prayer-text", ".reflection-text", ".mo-content-text"]
      },
      "url": window.location.href.split('?')[0]
    });
  }

  // Person Schema (author page /quem-somos/)
  if (path.indexOf('/quem-somos') === 0) {
    injectSchema({
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": SITE_URL + "/quem-somos/#author",
      "name": AUTHOR_NAME,
      "alternateName": "Dudy Farias",
      "jobTitle": "Fundador e Editor",
      "description": "Fundador e editor do Minuto da Oração, portal católico brasileiro com oração do dia, santo do dia e artigos religiosos. Católico praticante dedicado a levar a oração ao dia a dia de milhares de brasileiros.",
      "url": SITE_URL + "/quem-somos/",
      "image": "https://cdn.jsdelivr.net/gh/dudyfarias/minuto-da-oracao-data@main/images/eduardo-autor.webp",
      "email": EMAIL,
      "worksFor": {"@type": "Organization", "@id": SITE_URL + "/#organization", "name": SITE_NAME},
      "sameAs": [
        "https://www.linkedin.com/in/eduardo-farias-cappia-b9a159145/",
        "https://www.instagram.com/minutodaoracao/",
        "https://www.youtube.com/@MinutodaOracaooficial",
        "https://www.tiktok.com/@minutodaoracao"
      ],
      "knowsAbout": ["Catolicismo", "Oracoes Catolicas", "Santos Catolicos", "Liturgia Diaria", "Hagiografia", "Devocao Mariana", "Catecismo da Igreja Catolica", "Espiritualidade Crista"]
    });
  }
})();
