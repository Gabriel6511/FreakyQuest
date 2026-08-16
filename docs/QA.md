# QA — como testar antes de subir atualização

## Resumo de um parágrafo

O dia a dia usa só `validate.py` e `check_duplicate_ids.py` (segundos). A
**auditoria completa** (`scripts/audit_all.py`) é para rodar **só antes de
subir atualização** — ela abre o app num navegador de verdade em 12 telas
diferentes e demora minutos.

## Os dois níveis

### Nível 1 — dia a dia (rápido, sempre)

Depois de editar `app.js`, `index.html` ou `styles.css`:

```bash
python validate.py
python check_duplicate_ids.py
```

### Nível 2 — antes de subir atualização (completo, ocasional)

```bash
python scripts/audit_all.py
```

Isso roda, em ordem, parando no primeiro erro:

| # | Passo | O que pega | Tempo |
|---|-------|------------|-------|
| 1 | `validate.py` | chave/parêntese desbalanceado, ID obrigatório faltando, imagem sumida | segundos |
| 2 | `check_duplicate_ids.py` | dois elementos com o mesmo ID | segundos |
| 3 | `scripts/audit_static.py` | função de `onclick` que não existe, ID acessado sem existir, mentor sem tema, PWA/manifest/service worker inconsistente, segredo vazado, acessibilidade básica | segundos |
| 4 | `scripts/audit_runtime.py` | erro de JS real, layout vazando, botão pequeno demais, progresso não salvando, app não voltando depois de recarregar | minutos |

Exit code `0` = pode subir. `1` = tem problema bloqueante (P0/P1).

### Variações

```bash
python scripts/audit_all.py --rapido          # runtime em 3 telas, não 12
python scripts/audit_all.py --sem-navegador   # pula o passo 4 (não precisa de Playwright)
```

## Pré-requisito do passo 4

```bash
pip install playwright
playwright install chromium
```

O script sobe o servidor local sozinho (porta 8099) — não precisa rodar
`python -m http.server` à parte.

## Como ler o resultado

| Severidade | Significa | Bloqueia deploy? |
|---|---|---|
| **P0** | app não abre, exceção de JS, segredo vazado | sim |
| **P1** | fluxo quebrado, função inexistente, ícone de PWA faltando | sim |
| **P2** | layout vazando, campo sem label, recurso 404 | não, mas anote |
| **P3** | limpeza, botão pequeno, texto minúsculo, ID morto | não |
| **INFO** | só informação (chaves de localStorage, versão do cache) | não |

## Manutenção

**Ao criar um campo de texto novo** onde o usuário digita algo: adicione o
padrão dele na lista `USER_INPUT` no topo da seção 9 de
`scripts/audit_static.py`. Sem isso, a checagem de XSS não cobre o campo
novo. O script avisa quais campos ainda não estão mapeados (linha `[INFO]
(xss) campos de texto nao mapeados`).

**Ao adicionar um arquivo ao service worker**: lembre de subir o
`CACHE_NAME` em `sw.js` (`freakyquest-vNN` → `vNN+1`), senão o navegador
serve o cache velho.

## Histórico

Esses scripts existiam como `scratch/static_audit.py` e
`scratch/runtime_qa.py`, foram removidos no commit `e8e1bc6` e recuperados
do histórico do git em 2026-08-16, com as checagens de PWA, acessibilidade,
performance, segredos e persistência adicionadas na volta.
