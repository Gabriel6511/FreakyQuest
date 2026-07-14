# -*- coding: utf-8 -*-
"""Verifica modo simples isolado + captura evidencias das correcoes."""
import time, sys
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass
from playwright.sync_api import sync_playwright

URL = "http://localhost:8099/index.html"

def main():
    with sync_playwright() as pw:
        b = pw.chromium.launch(headless=True)
        # --- modo simples isolado (contexto novo) ---
        ctx = b.new_context(viewport={"width":375,"height":667}, device_scale_factor=2, is_mobile=True, has_touch=True)
        p = ctx.new_page()
        errs=[]; p.on("pageerror", lambda e: errs.append(str(e)))
        p.goto(URL); time.sleep(1.2)
        p.locator(".mode-card-simple").first.click(); time.sleep(0.5)
        p.fill("#simple-wiz-name","Maria")
        for _ in range(8):
            step = p.locator("#simple-onboarding-wizard .onboarding-step.active").first
            if step.count()==0: break
            c = step.locator(".option-select-card")
            if c.count()>0:
                try: c.first.click(timeout=600)
                except Exception: pass
            d = step.locator(".simple-day-btn")
            if d.count()>0:
                try: d.first.click(timeout=500)
                except Exception: pass
            nx = p.locator("#simple-wiz-btn-next")
            if nx.count()==0 or not nx.first.is_visible(): break
            nx.first.click(timeout=1500); time.sleep(0.15)
            if not p.locator("#simple-onboarding-wizard").is_visible(): break
        time.sleep(0.8)
        p.evaluate("()=>{['tutorial-overlay','level-up-modal','item-acquired-modal'].forEach(i=>{const e=document.getElementById(i);if(e)e.classList.add('hidden')})}")
        main_vis = p.evaluate("()=>{const m=document.getElementById('main-app');return m&&!m.classList.contains('hidden')}")
        simple_body = p.evaluate("()=>document.body.classList.contains('mode-simple')")
        # abas visiveis no modo simples
        tabs_vis = p.evaluate("""()=>{const o={};document.querySelectorAll('.bottom-nav .nav-item').forEach(b=>{o[b.getAttribute('data-tab')]=getComputedStyle(b).display!=='none'});return o}""")
        print("MODO SIMPLES -> main-app:", main_vis, "| body.mode-simple:", simple_body)
        print("Abas visiveis (simples):", tabs_vis)
        print("Excecoes JS no modo simples:", errs)
        p.screenshot(path="scratch/verify_simple_dashboard.png")

        # --- settings pos-fix (RPG) num contexto novo estreito ---
        ctx2 = b.new_context(viewport={"width":320,"height":568}, device_scale_factor=2, is_mobile=True, has_touch=True)
        p2 = ctx2.new_page()
        p2.goto(URL); p2.evaluate("()=>localStorage.clear()"); p2.reload(); time.sleep(1.2)
        p2.locator(".mode-card-rpg").first.click(); time.sleep(0.4)
        p2.fill("#wiz-name","QA")
        for _ in range(14):
            step=p2.locator("#onboarding-wizard .onboarding-step.active").first
            if step.count()==0: break
            c=step.locator(".option-select-card")
            if c.count()>0:
                try: c.first.click(timeout=600)
                except Exception: pass
            nx=p2.locator("#wiz-btn-next")
            if nx.count()==0 or not nx.first.is_visible(): break
            nx.first.click(timeout=1500); time.sleep(0.12)
            if not p2.locator("#onboarding-wizard").is_visible(): break
        time.sleep(0.6)
        p2.evaluate("()=>{['tutorial-overlay','level-up-modal','item-acquired-modal'].forEach(i=>{const e=document.getElementById(i);if(e)e.classList.add('hidden')})}")
        p2.locator('.bottom-nav .nav-item[data-tab="settings"]').first.click(); time.sleep(0.3)
        # mede overflow do input de altura
        info = p2.evaluate("""()=>{const el=document.getElementById('settings-height');const r=el.getBoundingClientRect();return {right:Math.round(r.right),vw:window.innerWidth,pageOverflow:document.documentElement.scrollWidth>window.innerWidth+1}}""")
        print("SETTINGS 320px -> settings-height.right:", info["right"], "vw:", info["vw"], "| pageOverflow:", info["pageOverflow"])
        p2.screenshot(path="scratch/verify_settings_320.png")

        # calendario no status a 320
        p2.locator('.bottom-nav .nav-item[data-tab="status"]').first.click(); time.sleep(0.3)
        cal = p2.evaluate("""()=>{let max=0;document.querySelectorAll('.calendar-day-cell').forEach(c=>{const r=c.getBoundingClientRect();if(r.right>max)max=r.right});return {maxRight:Math.round(max),vw:window.innerWidth}}""")
        print("CALENDARIO 320px -> maxRight:", cal["maxRight"], "vw:", cal["vw"])
        b.close()

if __name__=="__main__":
    main()
