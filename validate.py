import sys

ok = True

# CSS balance check
css = open('styles.css', 'r', encoding='utf-8').read()
css_braces = css.count('{') - css.count('}')
css_parens = css.count('(') - css.count(')')
print(f'CSS: braces balance={css_braces}, parens balance={css_parens}')
if css_braces != 0: print('  !! CSS BRACE MISMATCH !!'); ok = False
if css_parens != 0: print('  !! CSS PAREN MISMATCH !!'); ok = False

# JS balance check
js = open('app.js', 'r', encoding='utf-8').read()
js_braces = js.count('{') - js.count('}')
js_parens = js.count('(') - js.count(')')
js_brackets = js.count('[') - js.count(']')
print(f'JS: braces={js_braces}, parens={js_parens}, brackets={js_brackets}')
if js_braces != 0: print('  !! JS BRACE MISMATCH !!'); ok = False
if js_parens != 0: print('  !! JS PAREN MISMATCH !!'); ok = False
if js_brackets != 0: print('  !! JS BRACKET MISMATCH !!'); ok = False

# HTML ID check
html = open('index.html', 'r', encoding='utf-8').read()
ids_needed = [
    'screen-onboarding','onboarding-intro','onboarding-wizard',
    'wiz-btn-next','wiz-btn-back','onboarding-progress-fill',
    'main-app','tab-dashboard','tab-workouts','tab-diet','tab-mentors','tab-status',
    'player-name','player-level-badge','xp-fill','xp-text',
    'eval-goal-badge','eval-weight','eval-height','eval-imc',
    'daily-quests-list','quests-completed-badge',
    'exercises-list','workout-title','btn-finish-workout',
    'diet-kcal-ring-fill','diet-calorie-status',
    'mentors-list-container','trophies-list',
    'level-up-modal','item-acquired-modal',
    'overload-notification','overload-msg',
    'toggle-workout-std','toggle-workout-cust',
    'wiz-name','slider-height','slider-weight','slider-tweight',
    'display-height','display-weight','display-tweight',
    'display-days','wiz-notif-enable','wiz-notif-time',
    'weekly-goal-badge','weekly-progress-fill','weekly-goal-text',
    'workout-today-progress','settings-modal','settings-form',
    'btn-open-settings','btn-close-settings-modal'
]
missing = [i for i in ids_needed if f'id="{i}"' not in html]
if missing:
    print(f'MISSING IDs: {missing}')
    ok = False
else:
    print(f'All {len(ids_needed)} required HTML IDs found OK')

# Check image references
import os
imgs = ['logo.webp','rocklee.webp','goku.webp','arnold.webp','saitama.webp','ramondino.webp']
for img in imgs:
    exists = os.path.exists(img)
    print(f'  {img}: {"OK" if exists else "MISSING!"}')
    if not exists: ok = False

if ok:
    print('Validation complete.')
else:
    print('Validation FAILED.')
    sys.exit(1)
