#!/usr/bin/env bash
set -e

# ==============================================================================
# Fogbound 阿里云服务器 一键热更新脚本
# 拉取 GitHub 最新代码 -> 重启 Node 服务 -> 重载 Nginx
# 使用：cd /opt/fogbound && bash deploy/update.sh
# 首次在非 git 目录运行时，会自动初始化 git 并绑定远程仓库。
# ==============================================================================

APP_DIR="/opt/fogbound"
REPO_URL="https://github.com/ButterJack07/5.git"
cd "$APP_DIR"

echo ">>> [1/5] 检查 / 初始化 Git 仓库..."
if [ ! -d "$APP_DIR/.git" ]; then
  echo "未检测到 .git，正在将现有目录初始化为 Git 仓库..."
  git init -q
fi
if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$REPO_URL"
else
  git remote set-url origin "$REPO_URL"
fi
echo "✔ 远程仓库: $(git remote get-url origin)"

echo ">>> [2/5] 拉取 GitHub 最新代码..."
# 优先官方地址，失败则自动切换 ghproxy 加速镜像（国内服务器常用）
if ! git fetch --all --prune --depth=1 2>/dev/null; then
  echo "官方 GitHub 拉取失败，尝试镜像加速..."
  git remote set-url origin "https://ghproxy.net/${REPO_URL}"
  git fetch --all --prune --depth=1
fi
git checkout -f -B main origin/main
echo "✔ 已同步到最新提交: $(git log -1 --oneline)"

echo ">>> [3/5] 校验关键前端模块与服务端文件..."
for f in index.html style.css app.js game.js match.js server.js survivor-model.js hunter-model.js; do
  if [ ! -f "$APP_DIR/$f" ]; then
    echo "✖ 缺少关键文件: $f"
    exit 1
  fi
done
echo "✔ 所有关键模块存在"

echo ">>> [4/5] 重启 Fogbound Node 服务..."
systemctl daemon-reload
systemctl restart fogbound
sleep 1
systemctl --no-pager --full status fogbound | head -n 12 || true

echo ">>> [5/5] 重载 Nginx 反向代理..."
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
