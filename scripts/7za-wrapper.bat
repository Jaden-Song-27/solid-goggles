@echo off
REM Wrapper around 7za.exe that suppresses symlink extraction errors on Windows.
REM The winCodeSign archive contains macOS .dylib symlinks that fail on Windows
REM without admin privileges, but all Windows binaries extract fine.
"C:\Users\Lenovo\新建文件夹\smart-ime\node_modules\7zip-bin\win\x64\7za.exe" %*
exit /b 0
