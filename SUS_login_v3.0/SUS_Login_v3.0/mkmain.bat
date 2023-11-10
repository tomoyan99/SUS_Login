@echo off
nexe -i ./main.js -o main.exe -t windows-x64-14.15.3
nexe -i ./main.js -o ../test_env/main.exe -t windows-x64-14.15.3
pause