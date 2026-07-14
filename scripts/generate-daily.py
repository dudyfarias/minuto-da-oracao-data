#!/usr/bin/env python3
"""
Gera o conteúdo diário do Minuto da Oração a partir das bases santos.json e oracoes.json.

Escreve, na raiz do repositório:
  - daily.json                      (consumido pelo tema via fetch no cliente)
  - noscript/oracao-do-dia.html     (fallback lido por crawlers sem JS)
  - noscript/santo-do-dia.html      (idem)

Uso:
  python3 scripts/generate-daily.py            # usa a data de hoje (UTC-3 / America/Sao_Paulo)
  python3 scripts/generate-daily.py 2026-12-25 # gera para uma data específica (teste)

Idempotente: rodar duas vezes no mesmo dia produz o mesmo resultado.
Este é o mesmo script executado diariamente pela GitHub Action (.github/workflows/daily.yml).
"""
import json
import sys
import os
from datetime import datetime, timezone, timedelta

# Raiz do repositório = pasta pai de scripts/
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE_URL = "https://minutodaoracao.com.br"  # canônico, SEM www (consistente com o resto do site)

MESES_PT = [
    "", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]


def data_brasil():
    """Data atual no fuso de Brasília (UTC-3), independente do fuso do runner."""
    return datetime.now(timezone(timedelta(hours=-3))).date()


def carregar(nome):
    with open(os.path.join(ROOT, nome), encoding="utf-8") as f:
        return json.load(f)


def buscar_por_data(base, dia, mes):
    """Encontra a entrada da base para o dia/mês. Cai para 28/2 se 29/2 não existir."""
    for item in base:
        if item.get("dia") == dia and item.get("mes") == mes:
            return item
    if dia == 29 and mes == 2:  # ano não-bissexto: usa 28/2
        return buscar_por_data(base, 28, 2)
    return None


def truncar(texto, limite=155):
    if len(texto) <= limite:
        return texto
    return texto[:limite].rsplit(" ", 1)[0] + "..."


def montar_daily(data, oracao, santo):
    iso = data.isoformat()
    return {
        "date": iso,
        "oracao": {
            "titulo": oracao["titulo"],
            "texto": oracao["texto"],
            "reflexao": oracao["reflexao"],
            "versiculo": oracao["versiculo"],
        },
        "santo": {
            "nome": santo["nome"],
            "titulo": santo["titulo"],
            "resumo": santo["resumo"],
            "historia": santo["historia"],
            "oracao": santo["oracao"],
        },
        "meta": {
            "oracao": {
                "title": f'{oracao["titulo"]} — Oração do Dia | Minuto da Oração',
                "description": truncar(oracao["texto"]),
                "og_title": oracao["titulo"],
                "url": f"{SITE_URL}/oracao-do-dia/",
                "date": iso,
            },
            "santo": {
                "title": f'{santo["nome"]} — Santo do Dia | Minuto da Oração',
                "description": truncar(santo["resumo"]),
                "og_title": f'{santo["nome"]} — {santo["titulo"]}',
                "url": f"{SITE_URL}/santo-do-dia/",
                "date": iso,
            },
        },
    }


def data_extenso(data):
    return f"{data.day} de {MESES_PT[data.month]} de {data.year}"


def noscript_oracao(data, oracao):
    iso = data.isoformat()
    return f"""<noscript>
  <article class="mo-noscript-content" itemscope itemtype="https://schema.org/Article">
    <meta itemprop="datePublished" content="{iso}" />
    <meta itemprop="dateModified" content="{iso}" />
    <meta itemprop="author" content="Eduardo Farias Cappia" />

    <h1 itemprop="headline">{oracao["titulo"]}</h1>
    <p class="mo-noscript-date">{data_extenso(data)}</p>
    <p class="mo-noscript-author">Por <a href="/quem-somos/">Eduardo Farias Cappia</a></p>

    <section class="mo-noscript-prayer">
      <h2>Oração do Dia</h2>
      <blockquote class="prayer-text" itemprop="articleBody">
    <p>{oracao["texto"]}</p>
      </blockquote>
    </section>

    <section class="mo-noscript-reflection">
      <h2>Reflexão</h2>
      <p class="reflection-text">{oracao["reflexao"]}</p>
    </section>

    <section class="mo-noscript-verse">
      <h2>Versículo do Dia</h2>
      <p class="verse-text">{oracao["versiculo"]}</p>
    </section>

    <section class="mo-noscript-links">
      <h2>Orações Relacionadas</h2>
      <ul>
        <li><a href="/oracao-da-manha/">Oração da Manhã</a></li>
        <li><a href="/oracao-de-protecao/">Oração de Proteção</a></li>
        <li><a href="/oracao-para-familia/">Oração para a Família</a></li>
        <li><a href="/oracao-para-ansiedade/">Oração para Ansiedade</a></li>
        <li><a href="/santo-do-dia/">Santo do Dia</a></li>
      </ul>
    </section>
  </article>
</noscript>
"""


def noscript_santo(data, santo):
    iso = data.isoformat()
    paragrafos = "\n".join(
        f"    <p>{p}</p>" for p in santo["historia"].split("\n") if p.strip()
    )
    return f"""<noscript>
  <article class="mo-noscript-content" itemscope itemtype="https://schema.org/Article">
    <meta itemprop="datePublished" content="{iso}" />
    <meta itemprop="dateModified" content="{iso}" />
    <meta itemprop="author" content="Eduardo Farias Cappia" />

    <h1 itemprop="headline">{santo["nome"]} — {santo["titulo"]}</h1>
    <p class="mo-noscript-date">Santo do dia {data_extenso(data)}</p>
    <p class="mo-noscript-author">Por <a href="/quem-somos/">Eduardo Farias Cappia</a></p>

    <section class="mo-noscript-summary">
      <p class="intro"><strong>{santo["resumo"]}</strong></p>
    </section>

    <section class="mo-noscript-history">
      <h2>História de {santo["nome"]}</h2>
{paragrafos}
    </section>

    <section class="mo-noscript-prayer">
      <h2>Oração a {santo["nome"]}</h2>
      <blockquote class="prayer-text">
    <p>{santo["oracao"]}</p>
      </blockquote>
    </section>

    <section class="mo-noscript-links">
      <h2>Continue rezando</h2>
      <ul>
        <li><a href="/oracao-do-dia/">Oração do Dia</a></li>
        <li><a href="/oracao-de-protecao/">Oração de Proteção</a></li>
        <li><a href="/oracao-para-familia/">Oração para a Família</a></li>
        <li><a href="/oracao-de-gratidao/">Oração de Gratidão</a></li>
        <li><a href="/pedido-de-oracao/">Envie seu Pedido de Oração</a></li>
      </ul>
    </section>
  </article>
</noscript>
"""


def main():
    if len(sys.argv) > 1:
        data = datetime.strptime(sys.argv[1], "%Y-%m-%d").date()
    else:
        data = data_brasil()

    oracoes = carregar("oracoes.json")
    santos = carregar("santos.json")

    oracao = buscar_por_data(oracoes, data.day, data.month)
    santo = buscar_por_data(santos, data.day, data.month)
    if not oracao or not santo:
        print(f"ERRO: sem entrada para {data.isoformat()} (oracao={bool(oracao)}, santo={bool(santo)})", file=sys.stderr)
        sys.exit(1)

    # daily.json
    daily = montar_daily(data, oracao, santo)
    with open(os.path.join(ROOT, "daily.json"), "w", encoding="utf-8") as f:
        json.dump(daily, f, ensure_ascii=False, indent=2)
        f.write("\n")

    # noscript/
    os.makedirs(os.path.join(ROOT, "noscript"), exist_ok=True)
    with open(os.path.join(ROOT, "noscript", "oracao-do-dia.html"), "w", encoding="utf-8") as f:
        f.write(noscript_oracao(data, oracao))
    with open(os.path.join(ROOT, "noscript", "santo-do-dia.html"), "w", encoding="utf-8") as f:
        f.write(noscript_santo(data, santo))

    print(f"OK {data.isoformat()} — oração: {oracao['titulo']!r} | santo: {santo['nome']!r}")


if __name__ == "__main__":
    main()
