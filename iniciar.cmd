@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   Sistema de Biblioteca - Iniciando...
echo ============================================
echo.

if not exist ".env" (
  echo [ERRO] Arquivo .env nao encontrado nesta pasta.
  echo Rode o instalar.cmd primeiro.
  echo.
  pause
  exit /b 1
)

echo Abrindo o servidor da API...
start "Biblioteca - API" cmd /k "set PORT=8080&& pnpm --filter @workspace/api-server run dev"

echo Abrindo o site...
start "Biblioteca - Site" cmd /k "set PORT=5173&& set BASE_PATH=/&& pnpm --filter @workspace/biblioteca run dev"

echo.
echo Aguardando os servidores carregarem...
timeout /t 12 >nul

start "" http://localhost:5173

echo.
echo ============================================
echo   Pronto! O sistema abriu no navegador:
echo   http://localhost:5173
echo.
echo   Para desligar, feche as duas janelas
echo   pretas que abriram (API e Site).
echo ============================================
echo.
pause
