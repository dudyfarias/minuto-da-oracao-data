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

PAGES = {"oracao": 3489102, "santo": 3489108}

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
