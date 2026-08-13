@echo off
REM ============================================================
REM  Abre o Painel Admin do FreakyQuest — clique duas vezes aqui.
REM  So funciona rodando NESTE computador (admin.html nao existe
REM  em nenhum lugar publicado, so na sua pasta local).
REM ============================================================

set PORTA=8990

cd /d "%~dp0"

if not exist admin.html (
  echo ERRO: admin.html nao foi encontrado nesta pasta.
  echo Confirme que este .bat esta na mesma pasta que admin.html.
  pause
  exit /b 1
)

echo Iniciando o servidor local na porta %PORTA%...
start "FreakyQuest Admin - NAO FECHE (feche esta janela pra desligar o painel)" /min cmd /c "python -m http.server %PORTA%"

timeout /t 2 /nobreak >nul

start "" "http://127.0.0.1:%PORTA%/admin.html"

echo.
echo Painel aberto no navegador.
echo O servidor continua rodando numa janela minimizada chamada
echo "FreakyQuest Admin - NAO FECHE...". Pra desligar o painel,
echo feche aquela janela (ela esta minimizada na barra de tarefas).
echo.
pause
