@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   Sistema de Biblioteca - Instalacao
echo ============================================
echo.

if not exist ".env" (
  echo [ERRO] Arquivo .env nao encontrado!
  echo.
  echo Antes de instalar, faca o seguinte:
  echo   1. Copie o arquivo .env.example
  echo   2. Renomeie a copia para apenas:  .env
  echo   3. Abra o .env e troque SUA_SENHA_DO_POSTGRES
  echo      pela senha do seu PostgreSQL.
  echo.
  pause
  exit /b 1
)

echo [1/3] Instalando dependencias (pode demorar alguns minutos)...
echo.
call pnpm install
if errorlevel 1 (
  echo.
  echo [ATENCAO] Se apareceu mensagem sobre "esbuild" / approve-builds, rode:
  echo     pnpm approve-builds
  echo   marque com a tecla A, aperte Enter, e rode este instalar.cmd de novo.
  echo.
  pause
  exit /b 1
)

echo.
echo [2/3] Criando as tabelas no banco de dados...
echo.
call pnpm --filter @workspace/db run push
if errorlevel 1 (
  echo.
  echo [ERRO] Falha ao criar as tabelas.
  echo Verifique se o PostgreSQL esta rodando e se a senha no .env esta correta.
  echo.
  pause
  exit /b 1
)

echo.
echo [3/3] Cadastrando os 9 usuarios...
echo.
call pnpm --filter @workspace/scripts run seed
if errorlevel 1 (
  echo.
  echo [ERRO] Falha ao cadastrar os usuarios.
  echo.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   Instalacao concluida com sucesso!
echo.
echo   Agora use o arquivo  iniciar.cmd
echo   para rodar o sistema.
echo ============================================
echo.
pause
