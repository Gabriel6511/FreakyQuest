@echo off
REM ============================================================
REM  Abre o Painel Admin do FreakyQuest — clique duas vezes aqui.
REM  Isso e so uma conveniencia para testar localmente. O painel
REM  tambem esta publicado no Vercel (mesmo dominio do app), entao
REM  pra acessar de qualquer lugar (inclusive do celular, com o PC
REM  desligado) so entrar direto em <seu-dominio>/admin.html.
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
REM Sem --bind: o http.server do Python escuta em todas as interfaces de
REM rede por padrao, entao o celular tambem consegue acessar (mesmo Wi-Fi).
start "FreakyQuest Admin - NAO FECHE (feche esta janela pra desligar o painel)" /min cmd /c "python -m http.server %PORTA%"

timeout /t 2 /nobreak >nul

start "" "http://127.0.0.1:%PORTA%/admin.html"

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  set LANIP=%%a
  goto :achou_ip
)
:achou_ip
set LANIP=%LANIP: =%

echo.
echo Painel aberto no navegador deste PC.
echo.
echo Pra abrir pelo CELULAR (precisa estar na MESMA rede Wi-Fi do PC):
echo   http://%LANIP%:%PORTA%/admin.html
echo.
echo Na primeira vez o Windows pode perguntar se libera o Python na rede —
echo escolha "Redes particulares" e permita.
echo.
echo O servidor continua rodando numa janela minimizada chamada
echo "FreakyQuest Admin - NAO FECHE...". Pra desligar o painel,
echo feche aquela janela (ela esta minimizada na barra de tarefas).
echo.
pause
