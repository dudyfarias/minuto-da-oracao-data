#!/usr/bin/env python3
"""
Busca a liturgia do dia (evangelho, salmo, leituras) e grava em liturgia.json.

Fonte: https://liturgia.up.railway.app/v2/ (projeto Dancrf/liturgia-diaria)

Resiliente por desenho: se a API falhar ou vier incompleta, o script mantém o
liturgia.json anterior e sai com codigo 0 — o workflow diario nao quebra por
causa de uma indisponibilidade de terceiro. Sai com 1 apenas se nao houver
nem dado novo nem arquivo antigo.

Uso: python3 scripts/generate-liturgia.py
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(ROOT, "liturgia.json")
FONTE = "https://liturgia.up.railway.app/v2/"

MESES = ["", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
         "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]


def hoje_br():
    return datetime.now(timezone(timedelta(hours=-3))).date()


def data_extenso(d):
    return f"{d.day} de {MESES[d.month]} de {d.year}"


def buscar():
    req = urllib.request.Request(FONTE, headers={"User-Agent": "MinutoDaOracao/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def primeiro(lst):
    """A API devolve listas; pega o primeiro item ou None."""
    return lst[0] if isinstance(lst, list) and lst else None


def montar(api, data):
    leituras = api.get("leituras", {}) or {}
    ev = primeiro(leituras.get("evangelho"))
    sl = primeiro(leituras.get("salmo"))
    l1 = primeiro(leituras.get("primeiraLeitura"))
    l2 = primeiro(leituras.get("segundaLeitura"))

    if not ev or not ev.get("texto"):
        raise ValueError("resposta sem evangelho utilizavel")

    def bloco(x):
        if not x:
            return None
        return {
            "referencia": (x.get("referencia") or "").strip(),
            "titulo": (x.get("titulo") or "").strip(),
            "texto": (x.get("texto") or "").strip(),
            **({"refrao": x["refrao"].strip()} if x.get("refrao") else {}),
        }

    iso = data.isoformat()
    return {
        "date": iso,
        "data_extenso": data_extenso(data),
        "liturgia": (api.get("liturgia") or "").strip(),
        "cor": (api.get("cor") or "").strip(),
        "evangelho": bloco(ev),
        "salmo": bloco(sl),
        "primeira_leitura": bloco(l1),
        "segunda_leitura": bloco(l2),
        "fonte": FONTE,
    }


def main():
    data = hoje_br()
    try:
        api = buscar()
        # a API responde a data no formato dd/mm/aaaa — confere se e mesmo hoje
        vinda = (api.get("data") or "").strip()
        esperada = data.strftime("%d/%m/%Y")
        if vinda and vinda != esperada:
            print(f"AVISO: API retornou {vinda}, esperado {esperada} — usando mesmo assim")
        novo = montar(api, data)
    except Exception as e:
        print(f"AVISO: falha ao buscar liturgia ({e})", file=sys.stderr)
        if os.path.exists(DEST):
            antigo = json.load(open(DEST, encoding="utf-8"))
            print(f"Mantendo liturgia.json anterior ({antigo.get('date')}) — sem quebrar o fluxo")
            sys.exit(0)
        print("ERRO: sem dado novo e sem arquivo anterior", file=sys.stderr)
        sys.exit(1)

    with open(DEST, "w", encoding="utf-8") as f:
        json.dump(novo, f, ensure_ascii=False, indent=2)
        f.write("\n")

    ev = novo["evangelho"]
    print(f"OK {novo['date']} — {novo['liturgia']} | Evangelho: {ev['referencia']}")


if __name__ == "__main__":
    main()
