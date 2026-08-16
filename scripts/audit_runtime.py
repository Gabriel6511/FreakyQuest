# -*- coding: utf-8 -*-
"""
Auditoria de runtime do FreakyQuest: abre o app de verdade num navegador
headless, completa o onboarding, navega por todas as abas e procura por
erro de JS, layout quebrado, alvo de toque pequeno e problema de PWA.

Roda em ~12 telas diferentes. Demora alguns minutos — e por isso que so
deve rodar antes de subir atualizacao, nao no dia a dia. Ver docs/QA.md.

REQUER: pip install playwright && playwright install chromium
        e o app servido em http://localhost:8099

USO: python scripts/audit_all.py   (que sobe o servidor e chama este script)

Severidades:
  P0 = app nao abre / excecao JS   P1 = fluxo quebrado
  P2 = layout / recurso faltando   P3 = polimento
"""
import time
import json
import sys
import argparse
from collections import Counter

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("ERRO: playwright nao instalado.")
    print("Rode: pip install playwright && playwright install chromium")
    sys.exit(2)

URL = "http://localhost:8099/index.html"

# Telas reais + casos extremos (tela minuscula, densidade alta, tablet, desktop)
DEVICES = [
    {"name": "iPhone SE (2020)",      "w": 375,  "h": 667,  "dpr": 2,    "mobile": True},
    {"name": "iPhone 12/13/14",       "w": 390,  "h": 844,  "dpr": 3,    "mobile": True},
    {"name": "iPhone 14 Pro Max",     "w": 430,  "h": 932,  "dpr": 3,    "mobile": True},
    {"name": "iPhone 4/antigo",       "w": 320,  "h": 480,  "dpr": 2,    "mobile": True},
    {"name": "Galaxy S8/S22",         "w": 360,  "h": 740,  "dpr": 3,    "mobile": True},
    {"name": "Galaxy S20 Ultra",      "w": 412,  "h": 915,  "dpr": 3.5,  "mobile": True},
    {"name": "Pixel 5",               "w": 393,  "h": 851,  "dpr": 2.75, "mobile": True},
    {"name": "Galaxy Fold (fechado)", "w": 280,  "h": 653,  "dpr": 3,    "mobile": True},
    {"name": "Android baixo custo",   "w": 360,  "h": 640,  "dpr": 1.5,  "mobile": True},
    {"name": "iPad Mini",             "w": 768,  "h": 1024, "dpr": 2,    "mobile": True},
    {"name": "iPad Pro 11",           "w": 834,  "h": 1194, "dpr": 2,    "mobile": True},
    {"name": "Desktop",               "w": 1280, "h": 800,  "dpr": 1,    "mobile": False},
]

# Subconjunto rapido pra checagem durante desenvolvimento (--rapido)
DEVICES_RAPIDO = ["iPhone SE (2020)", "Galaxy Fold (fechado)", "Desktop"]

results = {}


def complete_rpg(page):
    """Completa o wizard do modo RPG clicando a 1a opcao de cada passo."""
    page.fill("#wiz-name", "QA Bot")
    for _ in range(14):
        try:
            step = page.locator("#onboarding-wizard .onboarding-step.active").first
            if step.count() == 0:
                break
            cards = step.locator(".option-select-card")
            if cards.count() > 0:
                try:
                    cards.first.click(timeout=800)
                except Exception:
                    pass
            nxt = page.locator("#wiz-btn-next")
            if nxt.count() == 0 or not nxt.first.is_visible():
                break
            nxt.first.click(timeout=1500)
            time.sleep(0.15)
        except Exception:
            break
        if not page.locator("#onboarding-wizard").is_visible():
            break


def complete_simple(page):
    page.fill("#simple-wiz-name", "QA Simple")
    for _ in range(10):
        try:
            step = page.locator("#simple-onboarding-wizard .onboarding-step.active").first
            if step.count() == 0:
                break
            cards = step.locator(".option-select-card")
            if cards.count() > 0:
                try:
                    cards.first.click(timeout=800)
                except Exception:
                    pass
            days = step.locator(".simple-day-btn")
            if days.count() > 0:
                try:
                    days.first.click(timeout=600)
                except Exception:
                    pass
            nxt = page.locator("#simple-wiz-btn-next")
            if nxt.count() == 0 or not nxt.first.is_visible():
                break
            nxt.first.click(timeout=1500)
            time.sleep(0.15)
        except Exception:
            break
        if not page.locator("#simple-onboarding-wizard").is_visible():
            break


def close_overlays(page):
    page.evaluate("""() => {
      ['tutorial-overlay','level-up-modal','item-acquired-modal','profile-card-modal',
       'training-alarm-modal','custom-food-modal','settings-modal'].forEach(id=>{
        const el=document.getElementById(id); if(el) el.classList.add('hidden');
      });
      document.querySelectorAll('.modal-overlay:not(.hidden), .tutorial-overlay:not(.hidden)')
        .forEach(el=>el.classList.add('hidden'));
    }""")
    time.sleep(0.1)


def audit_layout(page, dev, mode, tab, issues):
    """Layout: vazamento horizontal, alvo de toque pequeno, texto minusculo."""
    data = page.evaluate("""() => {
      const out = {overflowX:false, overflow:[], smallTargets:[], tinyText:[], lowContrast:[]};
      out.overflowX = document.documentElement.scrollWidth > window.innerWidth + 1;
      const vw = window.innerWidth;
      const isContained = (el) => {
        let p = el.parentElement;
        while (p && p !== document.body) {
          const cs = getComputedStyle(p);
          if (/(hidden|auto|scroll|clip)/.test(cs.overflowX + cs.overflow)) return true;
          p = p.parentElement;
        }
        return false;
      };
      document.querySelectorAll('body *').forEach(el=>{
        const r = el.getBoundingClientRect();
        if (r.width===0||r.height===0) return;
        const cs = getComputedStyle(el);
        if (cs.display==='none'||cs.visibility==='hidden'||cs.position==='fixed') return;
        if (r.right > vw + 2 && r.width <= vw + 40 && r.width>20) {
          if (isContained(el)) return;
          const id = el.id?('#'+el.id):(el.className&&typeof el.className==='string'?('.'+el.className.split(' ')[0]):el.tagName);
          if(out.overflow.length<6) out.overflow.push(id+' right='+Math.round(r.right));
        }
      });
      document.querySelectorAll('button:not([disabled]), a, .nav-item, .option-select-card, [onclick]').forEach(el=>{
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (cs.display==='none'||cs.visibility==='hidden') return;
        if (r.width===0||r.height===0) return;
        if ((r.height < 32 || r.width < 24) && r.height>0) {
          const id = el.id?('#'+el.id):(el.textContent||'').trim().slice(0,18);
          if(out.smallTargets.length<8) out.smallTargets.push(id+' '+Math.round(r.width)+'x'+Math.round(r.height));
        }
      });
      // texto muito pequeno pra ler no celular
      document.querySelectorAll('p, span, div, li, label').forEach(el=>{
        if (el.children.length > 0) return;
        const txt = (el.textContent||'').trim();
        if (txt.length < 4) return;
        const cs = getComputedStyle(el);
        if (cs.display==='none'||cs.visibility==='hidden') return;
        const fs = parseFloat(cs.fontSize);
        if (fs && fs < 10) {
          if(out.tinyText.length<6) out.tinyText.push(Math.round(fs*10)/10+'px: "'+txt.slice(0,24)+'"');
        }
      });
      return out;
    }""")
    if data["overflowX"]:
        issues.append(("P2", f"[{dev}/{mode}/{tab}] scroll horizontal (a pagina vaza pro lado)"))
    for o in data["overflow"]:
        issues.append(("P2", f"[{dev}/{mode}/{tab}] elemento estoura a largura: {o}"))
    if data["smallTargets"]:
        issues.append((
            "P3",
            f"[{dev}/{mode}/{tab}] {len(data['smallTargets'])} alvos de toque <32px: {data['smallTargets'][:4]}",
        ))
    if data["tinyText"]:
        issues.append((
            "P3",
            f"[{dev}/{mode}/{tab}] {len(data['tinyText'])} textos <10px: {data['tinyText'][:3]}",
        ))


def audit_pwa(page, dev, issues):
    """Checagens de PWA: service worker registrado, manifest carregado, icones OK."""
    try:
        sw_ok = page.evaluate("""async () => {
          if (!('serviceWorker' in navigator)) return 'sem-suporte';
          const regs = await navigator.serviceWorker.getRegistrations();
          return regs.length > 0 ? 'ok' : 'nao-registrado';
        }""")
        if sw_ok == "nao-registrado":
            issues.append(("P2", f"[{dev}] service worker nao registrou (app nao funciona offline)"))
    except Exception:
        pass

    try:
        manifest_ok = page.evaluate("""async () => {
          const link = document.querySelector('link[rel="manifest"]');
          if (!link) return {erro:'sem <link rel=manifest>'};
          const r = await fetch(link.href);
          if (!r.ok) return {erro:'manifest HTTP '+r.status};
          const m = await r.json();
          const faltando = [];
          for (const i of (m.icons||[])) {
            const ir = await fetch(new URL(i.src, link.href));
            if (!ir.ok) faltando.push(i.src);
          }
          return {icones_faltando: faltando, total_icones: (m.icons||[]).length};
        }""")
        if manifest_ok.get("erro"):
            issues.append(("P1", f"[{dev}] PWA: {manifest_ok['erro']}"))
        for ic in manifest_ok.get("icones_faltando", []):
            issues.append(("P1", f"[{dev}] PWA: icone do manifest nao carrega: {ic}"))
    except Exception:
        pass


def audit_a11y(page, dev, mode, tab, issues):
    """Acessibilidade em runtime: imagem sem alt, foco invisivel, contraste."""
    data = page.evaluate("""() => {
      const out = {semAlt:0, semLabel:0, contraste:[]};
      document.querySelectorAll('img').forEach(el=>{
        const r = el.getBoundingClientRect();
        if (r.width===0) return;
        if (!el.hasAttribute('alt')) out.semAlt++;
      });
      document.querySelectorAll('input, select, textarea').forEach(el=>{
        const r = el.getBoundingClientRect();
        if (r.width===0) return;
        const temLabel = el.labels?.length > 0 || el.getAttribute('aria-label') ||
                         el.getAttribute('placeholder') || el.getAttribute('title');
        if (!temLabel) out.semLabel++;
      });
      return out;
    }""")
    if data["semAlt"]:
        issues.append(("P3", f"[{dev}/{mode}/{tab}] {data['semAlt']} <img> visivel sem alt"))
    if data["semLabel"]:
        issues.append(("P2", f"[{dev}/{mode}/{tab}] {data['semLabel']} campo(s) sem label/placeholder"))


def audit_perf(page, dev, issues):
    """Tempo de carregamento e peso da pagina."""
    try:
        perf = page.evaluate("""() => {
          const nav = performance.getEntriesByType('navigation')[0];
          const recursos = performance.getEntriesByType('resource');
          const pesoTotal = recursos.reduce((s,r)=>s+(r.transferSize||0),0);
          const pesados = recursos
            .filter(r=>(r.transferSize||0) > 300*1024)
            .map(r=>({n:r.name.split('/').pop(), kb:Math.round(r.transferSize/1024)}))
            .sort((a,b)=>b.kb-a.kb).slice(0,5);
          return {
            domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
            load: nav ? Math.round(nav.loadEventEnd) : null,
            pesoTotalKb: Math.round(pesoTotal/1024),
            recursosPesados: pesados,
            totalRecursos: recursos.length
          };
        }""")
        if perf.get("load") and perf["load"] > 5000:
            issues.append(("P2", f"[{dev}] carregamento lento: {perf['load']}ms ate load"))
        if perf.get("pesoTotalKb", 0) > 6000:
            issues.append(("P2", f"[{dev}] pagina pesada: {perf['pesoTotalKb']}KB baixados"))
        for r in perf.get("recursosPesados", []):
            issues.append(("P3", f"[{dev}] recurso pesado: {r['n']} ({r['kb']}KB)"))
    except Exception:
        pass


def run_device(pw, dev, com_perf=False):
    issues = []
    console_errs = []
    page_errs = []
    browser = pw.chromium.launch(headless=True)
    ctx = browser.new_context(
        viewport={"width": dev["w"], "height": dev["h"]},
        device_scale_factor=dev["dpr"],
        is_mobile=dev["mobile"],
        has_touch=dev["mobile"],
    )
    page = ctx.new_page()
    page.on("console", lambda m: console_errs.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: page_errs.append(str(e)))

    modes = ["rpg"]
    if dev["name"] in ("iPhone SE (2020)", "Galaxy Fold (fechado)"):
        modes = ["rpg", "simple"]

    for mode in modes:
        ctx.clear_cookies()
        page.goto(URL)
        # _isResetting (sem "window.", ver nota abaixo) precisa ir junto do
        # clear — e exatamente o que o botao real "Reiniciar progresso" faz
        # antes de limpar. Sem isso, o autosave de pagehide/beforeunload
        # dispara durante o reload e regrava o estado antigo por cima da
        # limpeza, fazendo o app abrir direto no dashboard salvo em vez da
        # tela de selecao de modo — foi isso que gerou o falso P1 aqui.
        # `_isResetting` e `let` top-level num script classico (nao modulo),
        # entao vive no ambiente lexico global da pagina, nao em `window` —
        # setar via `window._isResetting` criaria uma propriedade separada
        # e NAO afetaria o guard real que saveState() consulta.
        page.evaluate("() => { _isResetting = true; localStorage.clear(); }")
        page.reload()
        time.sleep(1.2)
        page.evaluate("() => { _isResetting = false; }")

        if com_perf and mode == "rpg":
            audit_perf(page, dev["name"], issues)
            audit_pwa(page, dev["name"], issues)

        card = page.locator(f".mode-card-{'rpg' if mode == 'rpg' else 'simple'}")
        try:
            card.first.click(timeout=3000)
            time.sleep(0.4)
        except Exception:
            issues.append(("P1", f"[{dev['name']}/{mode}] nao clicou no card de modo"))
            continue
        try:
            if mode == "rpg":
                complete_rpg(page)
            else:
                complete_simple(page)
        except Exception as e:
            issues.append(("P1", f"[{dev['name']}/{mode}] erro no onboarding: {e}"))
        time.sleep(0.6)
        close_overlays(page)

        main_visible = page.evaluate(
            "() => { const m=document.getElementById('main-app'); return m && !m.classList.contains('hidden'); }"
        )
        if not main_visible:
            issues.append(("P0", f"[{dev['name']}/{mode}] NAO chegou ao app depois do onboarding"))
            continue

        tabs = ["dashboard", "workouts", "diet", "equipment", "mentors", "status", "settings"]
        for tab in tabs:
            btn = page.locator(f'.bottom-nav .nav-item[data-tab="{tab}"]')
            if btn.count() == 0 or not btn.first.is_visible():
                continue
            try:
                btn.first.click(timeout=1500)
                time.sleep(0.25)
                close_overlays(page)
            except Exception as e:
                issues.append(("P1", f"[{dev['name']}/{mode}] falha ao abrir aba {tab}: {e}"))
                continue
            audit_layout(page, dev["name"], mode, tab, issues)
            audit_a11y(page, dev["name"], mode, tab, issues)

        # Interacoes-chave (o que o usuario faz todo dia)
        close_overlays(page)
        try:
            page.locator('.bottom-nav .nav-item[data-tab="dashboard"]').first.click()
            time.sleep(0.2)
            aw = page.locator("#add-water-btn")
            if aw.count() > 0 and aw.first.is_visible():
                aw.first.click()
                time.sleep(0.15)
        except Exception as e:
            issues.append(("P2", f"[{dev['name']}/{mode}] beber agua: {e}"))
        try:
            page.locator('.bottom-nav .nav-item[data-tab="workouts"]').first.click()
            time.sleep(0.2)
            close_overlays(page)
            fb = page.locator("#btn-finish-workout")
            if fb.count() > 0 and fb.first.is_visible():
                fb.first.click()
                time.sleep(0.4)
                close_overlays(page)
        except Exception as e:
            issues.append(("P2", f"[{dev['name']}/{mode}] finalizar treino: {e}"))

        # O progresso sobreviveu?
        try:
            saved = page.evaluate("() => localStorage.getItem('freakyquest_state_v2')")
            if not saved:
                issues.append(("P1", f"[{dev['name']}/{mode}] progresso NAO foi salvo no localStorage"))
        except Exception:
            pass

        # Sobrevive a um reload? (bug classico de estado corrompido)
        try:
            page.reload()
            time.sleep(1.5)
            close_overlays(page)
            ainda_ok = page.evaluate(
                "() => { const m=document.getElementById('main-app'); return m && !m.classList.contains('hidden'); }"
            )
            if not ainda_ok:
                issues.append(("P0", f"[{dev['name']}/{mode}] app NAO volta ao estado salvo depois de recarregar"))
        except Exception as e:
            issues.append(("P1", f"[{dev['name']}/{mode}] erro ao recarregar: {e}"))

    for e in page_errs:
        issues.append(("P0", f"[{dev['name']}] EXCECAO JS: {e}"))
    for e in console_errs:
        low = e.lower()
        if "favicon" in low or "manifest" in low or "service worker" in low or "sw.js" in low:
            continue
        if "failed to load resource" in low and ("404" in low or "icon" in low):
            issues.append(("P2", f"[{dev['name']}] recurso 404: {e[:120]}"))
            continue
        issues.append(("P1", f"[{dev['name']}] console.error: {e[:160]}"))

    ctx.close()
    browser.close()
    results[dev["name"]] = issues
    p0 = sum(1 for s, _ in issues if s == "P0")
    p1 = sum(1 for s, _ in issues if s == "P1")
    print(f"  {dev['name']:24s} -> {len(issues)} achados (P0={p0} P1={p1})")
    return issues


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rapido", action="store_true", help="so 3 telas, pra checagem rapida")
    ap.add_argument("--json", metavar="ARQUIVO", help="salva o relatorio em JSON")
    args = ap.parse_args()

    devices = DEVICES
    if args.rapido:
        devices = [d for d in DEVICES if d["name"] in DEVICES_RAPIDO]

    print(f"Rodando {len(devices)} tela(s)...")
    with sync_playwright() as pw:
        for i, dev in enumerate(devices):
            run_device(pw, dev, com_perf=(i == 0))

    allissues = []
    for dev, iss in results.items():
        for s, m in iss:
            allissues.append((s, m))
    order = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}
    allissues.sort(key=lambda x: order.get(x[0], 9))
    c = Counter(s for s, _ in allissues)

    print("\n===== AUDITORIA DE RUNTIME =====", dict(c))
    for s, m in allissues:
        print(f"[{s}] {m}")

    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump({"resumo": dict(c), "achados": allissues, "por_tela": results},
                      f, ensure_ascii=False, indent=2)
        print(f"\nRelatorio salvo em {args.json}")

    bloqueantes = c.get("P0", 0) + c.get("P1", 0)
    if bloqueantes:
        print(f"\n>> {bloqueantes} problema(s) bloqueante(s) (P0/P1). NAO suba assim.")
    sys.exit(1 if bloqueantes else 0)


if __name__ == "__main__":
    main()
