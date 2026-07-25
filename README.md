# FreakyQuest

RPG de academia em web app mobile-first: treinos, dieta, XP, mentores e tributo ao Bebezinho.

## Como rodar

Abra `index.html` no navegador ou sirva a pasta com um servidor local:

```bash
python -m http.server 8080
```

Acesse `http://localhost:8080`.

## Testes

Ferramentas reexecutáveis de QA (ver detalhes em `QA_PLAN.md`):

```bash
python validate.py                # balanceamento JS/CSS, IDs obrigatórios, imagens
python check_duplicate_ids.py     # detecta IDs duplicados no HTML
python test_app.py
python test_complete_system.py
```

Com o app servido em `http://localhost:8099` (`python -m http.server 8099`), também é possível rodar a auditoria estática/runtime mais completa:

```bash
python scratch/static_audit.py    # cruza getElementById/onclick com IDs/funções, imagens, temas, localStorage
python scratch/runtime_qa.py      # matriz de 12 dispositivos, captura de exceções e overflow
python scratch/verify_fixes.py    # verificação isolada pós-correção
```

Requer Playwright: `pip install playwright && playwright install chromium`

## Deploy

Deploy automático via Vercel a partir do GitHub (Gabriel6511/FreakyQuest, branch `main`).
A cada `git push` para `main`, a Vercel publica em produção automaticamente.

> **Depreciado:** não rode mais `vercel --prod` manualmente. O CLI ainda funciona, mas cria um deploy de produção redundante e fora do controle do Git. O fluxo oficial é `git push`.

## Funcionalidades principais

- Onboarding com perfil, lesões, metas e notificações
- Treinos A/B/C com progressive overload e validação de séries
- Dieta com macros calculados por peso, objetivo e atividade
- Sistema RPG: XP, níveis, atributos, troféus, desafio diário
- Mentores com temas visuais e bônus de XP
- PWA instalável (manifest + service worker)
