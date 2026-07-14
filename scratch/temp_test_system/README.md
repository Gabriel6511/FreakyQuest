# FreakyQuest

RPG de academia em web app mobile-first: treinos, dieta, XP, mentores e tributo ao Bebezinho.

## Como rodar

Abra `index.html` no navegador ou sirva a pasta com um servidor local:

```bash
python -m http.server 8080
```

Acesse `http://localhost:8080`.

## Testes

```bash
python validate.py
python test_app.py
python test_complete_system.py
```

Requer Playwright: `pip install playwright && playwright install chromium`

## Deploy

Projeto configurado para Vercel (pasta estática).

## Funcionalidades principais

- Onboarding com perfil, lesões, metas e notificações
- Treinos A/B/C com progressive overload e validação de séries
- Dieta com macros calculados por peso, objetivo e atividade
- Sistema RPG: XP, níveis, atributos, troféus, desafio diário
- Mentores com temas visuais e bônus de XP
- PWA instalável (manifest + service worker)
