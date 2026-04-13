/**
 * GEO Schemas Injection — Minuto da Oracao
 * Injeta JSON-LD schemas e meta tags para otimizacao GEO (Generative Engine Optimization).
 * Adicionado via Nuvemshop Script Tag para evitar dependencia de cache de template.
 */
(function() {
  'use strict';

  var SITE_URL = 'https://www.minutodaoracao.com.br';
  var SITE_NAME = 'Minuto da Oração';
  var AUTHOR_NAME = 'Eduardo Farias Cappia';
  var EMAIL = 'contato@minutodaoracao.com.br';

  /**
   * Injeta um bloco JSON-LD no <head>
   */
  function injectSchema(data) {
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /**
   * Injeta uma meta tag no <head> (se nao existir)
   */
  function injectMeta(name, content, property) {
    var attr = property ? 'property' : 'name';
    var existing = document.querySelector('meta[' + attr + '="' + name + '"]');
    if (existing) return; // ja existe
    var meta = document.createElement('meta');
    meta.setAttribute(attr, name);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }

  // ========== 1. Meta Robots (todas as paginas) ==========
  injectMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  // ========== 2. Twitter site tag ==========
  injectMeta('twitter:site', '@minutodaoracao');

  // ========== 3. Organization Enhanced (apenas homepage) ==========
  var path = window.location.pathname;
  var isHome = (path === '/' || path === '');

  if (isHome) {
    injectSchema({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": SITE_URL + "/#organization",
      "name": SITE_NAME,
      "alternateName": "Minuto da Oracao Portal Catolico",
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": "https://cdn.jsdelivr.net/gh/dudyfarias/minuto-da-oracao-data@main/og-image.jpg",
        "width": 512,
        "height": 512
      },
      "description": "Portal católico brasileiro com oração do dia, santo do dia, pedidos de oração, liturgia diária e loja de produtos religiosos.",
      "email": EMAIL,
      "foundingDate": "2024-01-01",
      "founder": {
        "@type": "Person",
        "name": AUTHOR_NAME,
        "jobTitle": "Fundador e Editor",
        "url": SITE_URL + "/quem-somos/"
      },
      "sameAs": [
        "https://www.instagram.com/minutodaoracao/",
        "https://www.youtube.com/@MinutodaOracaooficial",
        "https://www.tiktok.com/@minutodaoracao"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": EMAIL,
        "availableLanguage": "Portuguese"
      },
      "knowsAbout": [
        "Catolicismo",
        "Oracoes Catolicas",
        "Santos Catolicos",
        "Liturgia Diaria",
        "Produtos Religiosos",
        "Devocao Mariana"
      ],
      "inLanguage": "pt-BR",
      "areaServed": {
        "@type": "Country",
        "name": "BR"
      }
    });
  }

  // ========== 4. BreadcrumbList (todas menos home) ==========
  if (!isHome) {
    var pageTitle = document.title.split('|')[0].split('—')[0].trim();
    var breadcrumbItems = [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Início",
        "item": SITE_URL + "/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": pageTitle,
        "item": window.location.href.split('?')[0]
      }
    ];

    injectSchema({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems
    });
  }

  // ========== 5. Article + Speakable (paginas de conteudo) ==========
  var contentPages = [
    '/oracao-do-dia/', '/santo-do-dia/', '/oracao-da-manha/',
    '/oracao-de-protecao/', '/oracao-para-ansiedade/',
    '/oracao-para-familia/', '/oracao-para-prosperidade/',
    '/oracao-para-cura/', '/oracao-pelo-casamento/',
    '/oracao-pelos-filhos/', '/oracao-de-gratidao/',
    '/oracao-para-luto/', '/noticias/', '/quem-somos/',
    '/pedido-de-oracao/', '/mural-de-oracoes/'
  ];

  var isContentPage = contentPages.some(function(p) {
    return path.indexOf(p) === 0;
  });

  if (isContentPage) {
    var pageTitle = document.title.split('|')[0].split('—')[0].trim();
    var metaDesc = '';
    var descTag = document.querySelector('meta[name="description"]');
    if (descTag) metaDesc = descTag.getAttribute('content') || '';

    var ogImage = '';
    var ogImgTag = document.querySelector('meta[property="og:image"]');
    if (ogImgTag) ogImage = ogImgTag.getAttribute('content') || '';

    var today = new Date().toISOString().split('T')[0];

    injectSchema({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": pageTitle,
      "description": metaDesc,
      "url": window.location.href.split('?')[0],
      "image": ogImage,
      "author": {
        "@type": "Person",
        "name": AUTHOR_NAME,
        "jobTitle": "Fundador e Editor",
        "url": SITE_URL + "/quem-somos/",
        "knowsAbout": ["Catolicismo", "Oracoes Catolicas", "Santos Catolicos", "Liturgia"]
      },
      "publisher": {
        "@type": "Organization",
        "@id": SITE_URL + "/#organization",
        "name": SITE_NAME,
        "logo": {
          "@type": "ImageObject",
          "url": "https://cdn.jsdelivr.net/gh/dudyfarias/minuto-da-oracao-data@main/og-image.jpg"
        }
      },
      "datePublished": today,
      "dateModified": today,
      "inLanguage": "pt-BR",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.href.split('?')[0]
      },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [
          "article h1",
          "article > p:first-of-type",
          ".mo-prayer-block",
          ".prayer-text",
          ".reflection-text",
          ".mo-content-text"
        ]
      }
    });
  }

  // ========== 6. FAQPage (pagina de perguntas frequentes) ==========
  if (path.indexOf('/perguntas-frequentes') === 0) {
    injectSchema({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "O que é o Minuto da Oração?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "O Minuto da Oração é um portal católico brasileiro que oferece oração do dia, santo do dia, pedidos de oração, notícias da Igreja e uma loja de artigos religiosos. Atualizado diariamente, atende milhares de fiéis que buscam fortalecer sua vida de oração."
          }
        },
        {
          "@type": "Question",
          "name": "Como enviar um pedido de oração?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Acesse a página 'Pedido de Oração' no menu principal, preencha o formulário com sua intenção e envie. Seu pedido será acolhido pela comunidade do Minuto da Oração e publicado no Mural de Orações para que outros fiéis rezem por você."
          }
        },
        {
          "@type": "Question",
          "name": "A que horas a oração do dia é atualizada?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A oração do dia é atualizada diariamente antes das 6h da manhã (horário de Brasília). Cada oração inclui o texto completo, uma reflexão espiritual baseada na liturgia do dia e um versículo bíblico."
          }
        },
        {
          "@type": "Question",
          "name": "Como comprar na loja do Minuto da Oração?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Acesse a seção Loja no menu, escolha o produto desejado, adicione ao carrinho e finalize a compra com pagamento via Pix, cartão de crédito ou boleto. Enviamos para todo o Brasil com prazo de 3 a 15 dias úteis."
          }
        },
        {
          "@type": "Question",
          "name": "Qual a política de trocas e devoluções?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Você tem até 7 dias após o recebimento para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor. Entre em contato pelo email contato@minutodaoracao.com.br com o número do pedido e o motivo da solicitação."
          }
        },
        {
          "@type": "Question",
          "name": "O Minuto da Oração é ligado a alguma diocese ou paróquia?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "O Minuto da Oração é um apostolado leigo independente, fundado por Eduardo Farias Cappia. Embora não seja oficialmente vinculado a uma diocese específica, todo o conteúdo segue fielmente a doutrina da Igreja Católica Apostólica Romana."
          }
        }
      ]
    });
  }

})();
