@echo off
cd /d D:\H5\pintu
echo 启动本地服务器...
echo 手机访问地址：http://10.72.80.83:8080
python -m http.server 8080 --bind 0.0.0.0
pause