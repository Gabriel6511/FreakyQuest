# -*- coding: utf-8 -*-
"""
FreakyQuest - QA de runtime exaustivo.
Captura erros de console/pageerror, testa fluxos completos e valida
responsividade/tap-targets em ampla matriz de dispositivos moveis.
"""
import time, json, sys, io
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass
from playwright.sync_api import sync_playwright

URL = "http://localhost:8099/index.html"

# Matriz ampla de dispositivos: modelos reais + edge cases de hardware/resolucao
DEVICES = [
    {"name": "iPhone SE (2020)",     "w": 375, "h": 667,  "dpr": 2,    "mobile": True},
    {"name": "iPhone 12/13/14",      "w": 390, "h": 844,  "dpr": 3,    "mobile": True},
    {"name": "iPhone 14 Pro Max",    "w": 430, "h": 932,  "dpr": 3,    "mobile": True},
    {"name": "iPhone 4/antigo",      "w": 320, "h": 480,  "dpr": 2,    "mobile": True},
    {"name": "Galaxy S8/S22",        "w": 360, "h": 740,  "dpr": 3,    "mobile": True},
    {"name": "Galaxy S20 Ultra",     "w": 412, "h": 915,  "dpr": 3.5,  "mobile": True},
    {"name": "Pixel 5",              "w": 393, "h": 851,  "dpr": 2.75, "mobile": True},
    {"name": "Galaxy Fold (fechado)","w": 280, "h": 653,  "dpr": 3,    "mobile": True},
    {"name": "Android baixo custo",  "w": 360, "h": 640,  "dpr": 1.5,  "mobile": True},
    {"name": "iPad Mini",            "w": 768, "h": 1024, "dpr": 2,    "mobile": True},
    {"name": "iPad Pro 11",          "w": 834, "h": 1194, "dpr": 2,    "mobile": True},
    {"name": "Desktop",              "w": 1280,"h": 800,  "dpr": 1,    "mobile": False},
]

results = {}

def complete_rpg(page):
    """Completa o wizard RPG clicando a 1a opcao de cada step + name."""
    page.fill("#wiz-name", "QA Bot")
    for _ in range(14):
        # step visivel
        try:
            step = page.locator("#onboarding-wizard .onboarding-step.active").first
            if step.count() == 0:
                break
            # seleciona primeiro card de opcao se houver
            cards = step.locator(".option-select-card")
            if cards.count() > 0:
                try: cards.first.click(timeout=800)
                except Exception: pass
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
            if step.count() == 0: break
            cards = step.locator(".option-select-card")
            if cards.count() > 0:
                try: cards.first.click(timeout=800)
                except Exception: pass
            days = step.locator(".simple-day-btn")
            if days.count() > 0:
                try: days.first.click(timeout=600)
                except Exception: pass
            nxt = page.locator("#simple-wiz-btn-next")
            if nxt.count() == 0 or not nxt.first.is_visible(): break
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
      document.querySelectorAll('.modal-overlay:not(.hidden), .tutorial-overlay:not(.hidden)').forEach(el=>el.classList.add('hidden'));
    }""")
    time.sleep(0.1)

def audit_layout(page, dev, mode, tab, issues):
    data = page.evaluate("""() => {
      const out = {overflowX:false, overflow:[], smallTargets:[], offscreen:[]};
      out.overflowX = document.documentElement.scrollWidth > window.innerWidth + 1;
      const vw = window.innerWidth;
      // um elemento so e "vazamento real" se NENHUM ancestral o clipa (overflow hidden/auto/scroll)
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
          if (isContained(el)) return; // clipado por ancestral: nao afeta UX
          const id = el.id?('#'+el.id):(el.className&&typeof el.className==='string'?('.'+el.className.split(' ')[0]):el.tagName);
          if(out.overflow.length<6) out.overflow.push(id+' right='+Math.round(r.right));
        }
      });
      // tap targets pequenos (visiveis, clicaveis)
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
      return out;
    }""")
    if data["overflowX"]:
        issues.append(("P2", f"[{dev}/{mode}/{tab}] scroll horizontal (overflow-x da pagina)"))
    for o in data["overflow"]:
        issues.append(("P2", f"[{dev}/{mode}/{tab}] elemento estoura largura: {o}"))
    # tap targets: reportar apenas resumo por tab para nao poluir
    if data["smallTargets"]:
        issues.append(("P3", f"[{dev}/{mode}/{tab}] {len(data['smallTargets'])} alvos de toque <32px: {data['smallTargets'][:4]}"))

def run_device(pw, dev):
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
    page.on("console", lambda m: console_errs.append(m.text) if m.type=="error" else None)
    page.on("pageerror", lambda e: page_errs.append(str(e)))

    modes = ["rpg"]
    # roda simples tambem em 2 devices representativos
    if dev["name"] in ("iPhone SE (2020)", "Galaxy Fold (fechado)"):
        modes = ["rpg", "simple"]

    for mode in modes:
        ctx.clear_cookies()
        page.goto(URL)
        page.evaluate("() => { localStorage.clear(); }")
        page.reload()
        time.sleep(1.2)
        # seleciona modo
        card = page.locator(f".mode-card-{'rpg' if mode=='rpg' else 'simple'}")
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

        # confirma que chegou no app
        main_visible = page.evaluate("() => { const m=document.getElementById('main-app'); return m && !m.classList.contains('hidden'); }")
        if not main_visible:
            issues.append(("P0", f"[{dev['name']}/{mode}] NAO chegou ao main-app apos onboarding"))
            continue

        tabs = ["dashboard","workouts","diet","equipment","mentors","status","settings"]
        for tab in tabs:
            btn = page.locator(f'.bottom-nav .nav-item[data-tab="{tab}"]')
            if btn.count()==0:
                continue
            if not btn.first.is_visible():
                continue  # ocultado no modo (esperado no simple)
            try:
                btn.first.click(timeout=1500)
                time.sleep(0.25)
                close_overlays(page)
            except Exception as e:
                issues.append(("P1", f"[{dev['name']}/{mode}] falha ao abrir tab {tab}: {e}"))
                continue
            audit_layout(page, dev["name"], mode, tab, issues)

        # interacoes-chave
        close_overlays(page)
        try:
            page.locator('.bottom-nav .nav-item[data-tab="dashboard"]').first.click(); time.sleep(0.2)
            aw = page.locator("#add-water-btn")
            if aw.count()>0 and aw.first.is_visible(): aw.first.click(); time.sleep(0.15)
        except Exception as e:
            issues.append(("P2", f"[{dev['name']}/{mode}] agua: {e}"))
        try:
            page.locator('.bottom-nav .nav-item[data-tab="workouts"]').first.click(); time.sleep(0.2)
            close_overlays(page)
            fb = page.locator("#btn-finish-workout")
            if fb.count()>0 and fb.first.is_visible():
                fb.first.click(); time.sleep(0.4); close_overlays(page)
        except Exception as e:
            issues.append(("P2", f"[{dev['name']}/{mode}] finalizar treino: {e}"))
        # persistencia
        try:
            saved = page.evaluate("() => localStorage.getItem('freakyquest_state_v2')")
            if not saved:
                issues.append(("P1", f"[{dev['name']}/{mode}] estado nao persistido em localStorage"))
        except Exception:
            pass

    # erros capturados
    for e in page_errs:
        issues.append(("P0", f"[{dev['name']}] EXCECAO JS: {e}"))
    # filtra ruido comum de console
    for e in console_errs:
        low = e.lower()
        if "favicon" in low or "manifest" in low or "service worker" in low or "sw.js" in low:
            continue
        if "failed to load resource" in low and ("404" in low or "icon" in low):
            issues.append(("P2", f"[{dev['name']}] recurso 404: {e[:120]}"))
            continue
        issues.append(("P1", f"[{dev['name']}] console.error: {e[:160]}"))

    ctx.close(); browser.close()
    results[dev["name"]] = issues
    p0=sum(1 for s,_ in issues if s=="P0"); p1=sum(1 for s,_ in issues if s=="P1")
    print(f"  {dev['name']:24s} -> {len(issues)} issues (P0={p0} P1={p1})")
    return issues

def main():
    print("Rodando matriz de dispositivos...")
    with sync_playwright() as pw:
        for dev in DEVICES:
            run_device(pw, dev)
    # consolidacao
    allissues=[]
    for dev, iss in results.items():
        for s,m in iss: allissues.append((s,m))
    order={"P0":0,"P1":1,"P2":2,"P3":3}
    allissues.sort(key=lambda x:order.get(x[0],9))
    from collections import Counter
    c=Counter(s for s,_ in allissues)
    print("\n===== RESUMO GLOBAL =====", dict(c))
    for s,m in allissues:
        print(f"[{s}] {m}")
    with open("scratch/runtime_report.json","w",encoding="utf-8") as f:
        json.dump({"summary":dict(c),"issues":allissues,"per_device":results}, f, ensure_ascii=False, indent=2)

if __name__=="__main__":
    main()
