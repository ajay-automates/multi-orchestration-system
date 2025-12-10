@echo off
echo ========================================
echo Pushing to GitHub
echo ========================================
echo.

echo Setting remote URL...
git remote set-url origin https://github.com/ajay-automates/multi-orchestration-system.git

echo Renaming branch to main...
git branch -M main

echo Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo Done!
echo ========================================
echo.
echo Your repository is now at:
echo https://github.com/ajay-automates/multi-orchestration-system
echo.
pause
