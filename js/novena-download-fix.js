/**
 * Minuto da Oracao — Script Bundle v4
 * 1) Novena PDF Download Fix (variant C)
 * 2) Noscript Fallback + Meta Update (daily.json)
 * 3) GEO Schemas Injection (Organization, Article, BreadcrumbList, FAQPage, Person)
 */

/* ====== PART 1: Novena PDF Download Fix ====== */
(function() {
  'use strict';

  var NOVENA_PDF_URL = 'https://raw.githubusercontent.com/dudyfarias/minuto-da-oracao-data/main/novena-9-dias-intercessao-gracas.pdf';

  function patchDownloadButtons() {
    var buttons = document.querySelectorAll('.mo-lead-download[data-variant="c"]');
    buttons.forEach(function(btn) {
      var newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (typeof gtag === 'function') {
          gtag('event', 'lead_capture_download', {
            lead_magnet: 'c',
            experiment: 'lead_magnet_ab',
            pdf_type: 'hosted'
          });
        }

        var a = document.createElement('a');
        a.href = NOVENA_PDF_URL;
        a.download = 'novena-9-dias-intercessao-gracas.pdf';
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() { document.body.removeChild(a); }, 100);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchDownloadButtons);
  } else {
    setTimeout(patchDownloadButtons, 500);
  }
})();

/* ====== PART 2: Noscript Fallback + Meta Update ====== */
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

/* ====== PART 3: GEO Schemas Injection ====== */
(function() {
  'use strict';

  var SITE_URL = 'https://www.minutodaoracao.com.br';
  var SITE_NAME = 'Minuto da Oração';
  var AUTHOR_NAME = 'Eduardo Farias Cappia';
  var EMAIL = 'contato@minutodaoracao.com.br';
  var OG_IMAGE = 'https://cdn.jsdelivr.net/gh/dudyfarias/minuto-da-oracao-data@main/og-image.jpg';

  function injectSchema(data) {
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  function injectMeta(name, content, isProperty) {
    var attr = isProperty ? 'property' : 'name';
    if (document.querySelector('meta[' + attr + '="' + name + '"]')) return;
    var m = document.createElement('meta');
    m.setAttribute(attr, name);
    m.setAttribute('content', content);
    document.head.appendChild(m);
  }

  // Meta Robots
  injectMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  // Twitter site
  injectMeta('twitter:site', '@minutodaoracao');

  // llms.txt links for AI crawler discoverability
  function injectLink(rel, href, type) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (type) link.type = type;
    document.head.appendChild(link);
  }
  injectLink('llms', 'https://cdn.jsdelivr.net/gh/dudyfarias/minuto-da-oracao-data@main/llms.txt', 'text/plain');
  injectLink('llms-full', 'https://cdn.jsdelivr.net/gh/dudyfarias/minuto-da-oracao-data@main/llms-full.txt', 'text/plain');

  var path = window.location.pathname;
  var isHome = (path === '/' || path === '');

  // Organization Enhanced (homepage only)
  if (isHome) {
    injectSchema({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": SITE_URL + "/#organization",
      "name": SITE_NAME,
      "alternateName": "Minuto da Oracao Portal Catolico",
      "url": SITE_URL,
      "logo": {"@type": "ImageObject", "url": OG_IMAGE, "width": 512, "height": 512},
      "description": "Portal católico brasileiro com oração do dia, santo do dia, pedidos de oração, liturgia diária e loja de produtos religiosos.",
      "email": EMAIL,
      "foundingDate": "2024-01-01",
      "founder": {"@type": "Person", "name": AUTHOR_NAME, "jobTitle": "Fundador e Editor", "url": SITE_URL + "/quem-somos/"},
      "sameAs": [
        "https://www.instagram.com/minutodaoracao/",
        "https://www.youtube.com/@MinutodaOracaooficial",
        "https://www.tiktok.com/@minutodaoracao"
      ],
      "contactPoint": {"@type": "ContactPoint", "contactType": "customer service", "email": EMAIL, "availableLanguage": "Portuguese"},
      "knowsAbout": ["Catolicismo", "Oracoes Catolicas", "Santos Catolicos", "Liturgia Diaria", "Produtos Religiosos", "Devocao Mariana"],
      "inLanguage": "pt-BR",
      "areaServed": {"@type": "Country", "name": "BR"}
    });
  }

  // BreadcrumbList (all pages except home)
  if (!isHome) {
    var pageTitle = document.title.split('|')[0].split('\u2014')[0].trim();
    injectSchema({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Início", "item": SITE_URL + "/"},
        {"@type": "ListItem", "position": 2, "name": pageTitle, "item": window.location.href.split('?')[0]}
      ]
    });
  }

  // Article + Speakable (content pages)
  var contentPages = [
    '/oracao-do-dia/', '/santo-do-dia/', '/oracao-da-manha/',
    '/oracao-de-protecao/', '/oracao-para-ansiedade/',
    '/oracao-para-familia/', '/oracao-para-prosperidade/',
    '/oracao-para-cura/', '/oracao-pelo-casamento/',
    '/oracao-pelos-filhos/', '/oracao-de-gratidao/',
    '/oracao-para-luto/', '/noticias/', '/quem-somos/',
    '/pedido-de-oracao/', '/mural-de-oracoes/'
  ];

  if (contentPages.some(function(p) { return path.indexOf(p) === 0; })) {
    var title = document.title.split('|')[0].split('\u2014')[0].trim();
    var descTag = document.querySelector('meta[name="description"]');
    var desc = descTag ? descTag.getAttribute('content') || '' : '';
    var ogImg = document.querySelector('meta[property="og:image"]');
    var img = ogImg ? ogImg.getAttribute('content') || '' : '';
    var today = new Date().toISOString().split('T')[0];

    injectSchema({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": desc,
      "url": window.location.href.split('?')[0],
      "image": img,
      "author": {"@type": "Person", "name": AUTHOR_NAME, "jobTitle": "Fundador e Editor", "url": SITE_URL + "/quem-somos/", "knowsAbout": ["Catolicismo", "Oracoes Catolicas", "Santos Catolicos", "Liturgia"]},
      "publisher": {"@type": "Organization", "@id": SITE_URL + "/#organization", "name": SITE_NAME, "logo": {"@type": "ImageObject", "url": OG_IMAGE}},
      "datePublished": today,
      "dateModified": today,
      "inLanguage": "pt-BR",
      "mainEntityOfPage": {"@type": "WebPage", "@id": window.location.href.split('?')[0]},
      "speakable": {"@type": "SpeakableSpecification", "cssSelector": ["article h1", "article > p:first-of-type", ".mo-prayer-block", ".prayer-text", ".reflection-text", ".mo-content-text"]}
    });
  }

  // FAQPage (perguntas frequentes)
  if (path.indexOf('/perguntas-frequentes') === 0) {
    injectSchema({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {"@type": "Question", "name": "O que é o Minuto da Oração?", "acceptedAnswer": {"@type": "Answer", "text": "O Minuto da Oração é um portal católico brasileiro que oferece oração do dia, santo do dia, pedidos de oração, notícias da Igreja e uma loja de artigos religiosos. Atualizado diariamente, atende milhares de fiéis que buscam fortalecer sua vida de oração."}},
        {"@type": "Question", "name": "Como enviar um pedido de oração?", "acceptedAnswer": {"@type": "Answer", "text": "Acesse a página 'Pedido de Oração' no menu principal, preencha o formulário com sua intenção e envie. Seu pedido será acolhido pela comunidade do Minuto da Oração e publicado no Mural de Orações para que outros fiéis rezem por você."}},
        {"@type": "Question", "name": "A que horas a oração do dia é atualizada?", "acceptedAnswer": {"@type": "Answer", "text": "A oração do dia é atualizada diariamente antes das 6h da manhã (horário de Brasília). Cada oração inclui o texto completo, uma reflexão espiritual baseada na liturgia do dia e um versículo bíblico."}},
        {"@type": "Question", "name": "Como comprar na loja do Minuto da Oração?", "acceptedAnswer": {"@type": "Answer", "text": "Acesse a seção Loja no menu, escolha o produto desejado, adicione ao carrinho e finalize a compra com pagamento via Pix, cartão de crédito ou boleto. Enviamos para todo o Brasil com prazo de 3 a 15 dias úteis."}},
        {"@type": "Question", "name": "Qual a política de trocas e devoluções?", "acceptedAnswer": {"@type": "Answer", "text": "Você tem até 7 dias após o recebimento para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor. Entre em contato pelo email contato@minutodaoracao.com.br com o número do pedido e o motivo da solicitação."}},
        {"@type": "Question", "name": "O Minuto da Oração é ligado a alguma diocese ou paróquia?", "acceptedAnswer": {"@type": "Answer", "text": "O Minuto da Oração é um apostolado leigo independente, fundado por Eduardo Farias Cappia. Embora não seja oficialmente vinculado a uma diocese específica, todo o conteúdo segue fielmente a doutrina da Igreja Católica Apostólica Romana."}}
      ]
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
