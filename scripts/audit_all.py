# -*- coding: utf-8 -*-
"""
Auditoria completa do FreakyQuest — RODAR ANTES DE SUBIR ATUALIZACAO.

Sobe o servidor local sozinho, roda todas as checagens em ordem (da mais
rapida pra mais lenta) e para na primeira que falhar.

  1. validate.py            — balanceamento de chaves, IDs obrigatorios
  2. check_duplicate_ids.py — IDs duplicados no HTML
  3. audit_static.py        — JS x HTML x CSS x manifest x sw (segundos)
  4. audit_runtime.py       — 12 telas reais em navegador (minutos)

USO:
    python scripts/audit_all.py            # tudo (antes de deploy)
    python scripts/audit_all.py --rapido   # so 3 telas (checagem intermediaria)
    python scripts/audit_all.py --sem-navegador   # pula o passo 4

Exit code 0 = pode subir. 1 = tem P0/P1, nao suba.
"""
import argparse
import http.server
import socketserver
import subprocess
import sys
import threading
import time
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent
PORTA = 8099


class SilentHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def sobe_servidor():
    import os
    os.chdir(ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", PORTA), SilentHandler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd


def roda(titulo, cmd):
    print(f"\n{'=' * 60}\n  {titulo}\n{'=' * 60}")
    r = subprocess.run(cmd, cwd=ROOT)
    return r.returncode


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rapido", action="store_true", help="runtime em 3 telas em vez de 12")
    ap.add_argument("--sem-navegador", action="store_true", help="pula a auditoria de runtime")
    args = ap.parse_args()

    py = sys.executable
    falhas = []

    if roda("1/4  validate.py", [py, "validate.py"]) != 0:
        falhas.append("validate.py")

    if roda("2/4  check_duplicate_ids.py", [py, "check_duplicate_ids.py"]) != 0:
        falhas.append("check_duplicate_ids.py")

    if roda("3/4  auditoria estatica", [py, "scripts/audit_static.py"]) != 0:
        falhas.append("audit_static.py")

    if args.sem_navegador:
        print("\n(pulando auditoria de runtime — --sem-navegador)")
    else:
        print(f"\nSubindo servidor local em http://localhost:{PORTA} ...")
        httpd = sobe_servidor()
        time.sleep(0.6)
        cmd = [py, "scripts/audit_runtime.py", "--json", "scripts/relatorio_runtime.json"]
        if args.rapido:
            cmd.append("--rapido")
        if roda("4/4  auditoria de runtime (navegador)", cmd) != 0:
            falhas.append("audit_runtime.py")
        httpd.shutdown()

    print(f"\n{'=' * 60}")
    if falhas:
        print(f"  RESULTADO: FALHOU em {', '.join(falhas)}")
        print("  Nao suba a atualizacao ate resolver os P0/P1 acima.")
        print("=" * 60)
        sys.exit(1)
    print("  RESULTADO: tudo passou. Pode subir.")
    print("=" * 60)
    sys.exit(0)


if __name__ == "__main__":
    main()
