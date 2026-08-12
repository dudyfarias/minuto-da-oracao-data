#!/usr/bin/env python3
"""
Publica o conteúdo do dia (daily.json) nas páginas da Nuvemshop via API.

Por que existe: o tema da Nuvemshop não faz fetch HTTP no servidor, então o conteúdo
diário só aparecia via JavaScript — invisível para o Google e para crawlers de IA.
Gravando o HTML do dia no campo `content` da página, a Nuvemshop passa a renderizá-lo
server-side. O JS do tema continua funcionando como melhoria progressiva.

Uso:
  NUVEMSHOP_TOKEN=xxx python3 scripts/push-nuvemshop.py

Lê daily.json (gerado por generate-daily.py) e atualiza:
  - /oracao-do-dia/  (id 3489102)
  - /santo-do-dia/   (id 3489108)
"""
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORE = "4674321"
API = f"https://api.nuvemshop.com.br/2025-03/{STORE}/pages"
UA = "MinutoDaOracao (contato@minutodaoracao.com.br)"

PAGES = {"oracao": 3489102, "santo": 3489108,
         "evangelho": 3715701, "liturgia": 3715702}

MESES = ["", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
         "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]


def data_extenso(iso):
    a, m, d = iso.split("-")
    return f"{int(d)} de {MESES[int(m)]} de {a}"


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def html_oracao(d):
    o, data = d["oracao"], data_extenso(d["date"])
    return (
        f"<h2>{esc(o['titulo'])}</h2>"
        f"<p><em>Oração do dia — {data}</em></p>"
        f"<blockquote><p>{esc(o['texto'])}</p></blockquote>"
        f"<h3>Reflexão</h3><p>{esc(o['reflexao'])}</p>"
        f"<h3>Versículo do dia</h3><p>{esc(o['versiculo'])}</p>"
    )


def html_santo(d):
    s, data = d["santo"], data_extenso(d["date"])
    hist = "".join(f"<p>{esc(p)}</p>" for p in s["historia"].split("\n") if p.strip())
    return (
        f"<h2>{esc(s['nome'])} — {esc(s['titulo'])}</h2>"
        f"<p><em>Santo do dia — {data}</em></p>"
        f"<p><strong>{esc(s['resumo'])}</strong></p>"
        f"<h3>História de {esc(s['nome'])}</h3>{hist}"
        f"<h3>Oração a {esc(s['nome'])}</h3>"
        f"<blockquote><p>{esc(s['oracao'])}</p></blockquote>"
    )


def _leitura_html(b, titulo_secao):
    """Renderiza um bloco de leitura (referencia + titulo + texto [+ refrao])."""
    if not b:
        return ""
    partes = [f"<h3>{esc(titulo_secao)} — {esc(b['referencia'])}</h3>"]
    if b.get("titulo"):
        partes.append(f"<p><em>{esc(b['titulo'])}</em></p>")
    if b.get("refrao"):
        partes.append(f"<p><strong>R. {esc(b['refrao'])}</strong></p>")
    for par in b["texto"].split("\n"):
        if par.strip():
            partes.append(f"<p>{esc(par.strip())}</p>")
    return "".join(partes)


def html_evangelho(lit):
    ev = lit["evangelho"]
    return (
        f"<h2>Evangelho de hoje — {esc(ev['referencia'])}</h2>"
        f"<p><em>{esc(lit['data_extenso'])} · {esc(lit['liturgia'])} · Cor litúrgica: {esc(lit['cor'])}</em></p>"
        + _leitura_html(ev, "Evangelho")
    )


def html_liturgia(lit):
    partes = [
        f"<h2>Liturgia de {esc(lit['data_extenso'])}</h2>",
        f"<p><em>{esc(lit['liturgia'])} · Cor litúrgica: {esc(lit['cor'])}</em></p>",
        _leitura_html(lit.get("primeira_leitura"), "Primeira Leitura"),
        _leitura_html(lit.get("salmo"), "Salmo Responsorial"),
        _leitura_html(lit.get("segunda_leitura"), "Segunda Leitura"),
        _leitura_html(lit.get("evangelho"), "Evangelho"),
    ]
    return "".join(p for p in partes if p)


def put_page(page_id, title, content, seo_title, seo_desc, token):
    payload = {"page": {"publish": True, "i18n": {"pt_BR": {
        "title": title, "content": content,
        "seo_title": seo_title[:70], "seo_description": seo_desc[:160],
    }}}}
    req = urllib.request.Request(
        f"{API}/{page_id}",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        method="PUT",
        headers={"Authentication": f"bearer {token}", "User-Agent": UA,
                 "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.status


def main():
    token = os.environ.get("NUVEMSHOP_TOKEN")
    if not token:
        print("ERRO: defina NUVEMSHOP_TOKEN no ambiente", file=sys.stderr)
        sys.exit(1)

    d = json.load(open(os.path.join(ROOT, "daily.json"), encoding="utf-8"))
    meta = d.get("meta", {})

    jobs = [
        ("oracao", "Oração do Dia", html_oracao(d),
         meta.get("oracao", {}).get("title", "Oração do Dia | Minuto da Oração"),
         meta.get("oracao", {}).get("description", d["oracao"]["texto"])),
        ("santo", "Santo do Dia", html_santo(d),
         meta.get("santo", {}).get("title", "Santo do Dia | Minuto da Oração"),
         meta.get("santo", {}).get("description", d["santo"]["resumo"])),
    ]

    # Liturgia (evangelho + leituras) — opcional: so entra se liturgia.json existir
    lit_path = os.path.join(ROOT, "liturgia.json")
    if os.path.exists(lit_path):
        lit = json.load(open(lit_path, encoding="utf-8"))
        ev = lit.get("evangelho") or {}
        if ev.get("texto"):
            resumo_ev = " ".join(ev["texto"].split())[:150]
            jobs.append((
                "evangelho", "Evangelho do Dia", html_evangelho(lit),
                f"Evangelho de Hoje: {ev['referencia']} | Minuto da Oração",
                f"Evangelho do dia {lit['data_extenso']} ({ev['referencia']}): {resumo_ev}",
            ))
            jobs.append((
                "liturgia", "Liturgia Diária", html_liturgia(lit),
                f"Liturgia Diária de Hoje — {lit['liturgia']} | Minuto da Oração",
                f"Leituras da Missa de {lit['data_extenso']}: primeira leitura, salmo responsorial e Evangelho ({ev['referencia']}).",
            ))
    else:
        print("  (liturgia.json ausente — pulando evangelho/liturgia)")

    falhou = False
    for key, title, content, st, sd in jobs:
        try:
            code = put_page(PAGES[key], title, content, st, sd, token)
            print(f"  {key}: HTTP {code} — {len(content)} bytes publicados")
        except Exception as e:
            print(f"  {key}: FALHOU — {e}", file=sys.stderr)
            falhou = True

    if falhou:
        sys.exit(1)
    print(f"OK — conteúdo de {d['date']} publicado nas páginas da Nuvemshop")


if __name__ == "__main__":
    main()
