#!/usr/bin/env bash
set -e

# ==============================================================================
# Fogbound 阿里云服务器 一键热更新脚本
# 拉取 GitHub 最新代码 -> 安装依赖无关 -> 重启 Node 服务 -> 重载 Nginx
# 使用：cd /opt/fogbound && bash deploy/update.sh
# ==============================================================================

APP_DIR="/opt/fogbound"
cd "$APP_DIR"

echo ">>> [1/4] 拉取 GitHub 最新代码..."
git fetch --all
git reset --hard origin/main
git clean -fd -e node_modules
echo "✔ 已同步到最新提交: $(git log -1 --oneline)"

echo ">>> [2/4] 校验关键前端模块与服务端文件..."
for f in index.html style.css app.js game.js match.js server.js survivor-model.js hunter-model.js programmer.test.js; do
  if [ ! -f "$APP_DIR/$f" ]; then
    echo "✖ 缺少关键文件: $f"
    exit 1
  fi
done
echo "✔ 所有关键模块存在"

echo ">>> [3/4] 重启 Fogbound Node 服务..."
systemctl daemon-reload
systemctl restart fogbound
sleep 1
systemctl --no-pager --full status fogbound | head -n 12 || true

echo ">>> [4/4] 重载 Nginx 反向代理..."
if command -v nginx &> /dev/null; then
  nginx -t && systemctl reload nginx
fi

echo "=========================================================="
echo "✔ 服务器已更新至最新版本！"
echo "版本提交: $(git log -1 --format='%h %s')"
echo "本机访问: http://127.0.0.1:43129/"
echo "外网访问: http://121.199.161.5/fogbound/"
echo "安全访问: https://momentmap.top/fogbound/  (若已配置SSL)"
echo "=========================================================="
