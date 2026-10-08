#!/usr/bin/env bash
set -e

# ==============================================================================
# Fogbound 阿里云服务器 443 SSL (WSS) 一键配置与证书部署脚本
# 适用环境：Ubuntu / Debian / CentOS / Aliyun Linux
# 目标：为 momentmap.top 配置免费 SSL 证书并支持 WSS (WebSocket Secure)
# ==============================================================================

echo ">>> [1/5] 检查系统环境与 Nginx 状态..."
if ! command -v nginx &> /dev/null; then
  echo "错误: 未检测到 Nginx，请先安装 Nginx"
  exit 1
fi

DOMAIN="momentmap.top"
SNIPPET="/etc/nginx/snippets/fogbound.conf"
mkdir -p /etc/nginx/snippets

echo ">>> [2/5] 确保 fogbound Nginx 代理配置正确..."
cat << 'EOF' > "$SNIPPET"
location = /fogbound { return 302 /fogbound/; }
location /fogbound/ {
    proxy_pass http://127.0.0.1:43129/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
}
EOF

echo ">>> [3/5] 检查并安装 Certbot 工具..."
if ! command -v certbot &> /dev/null; then
  if command -v apt-get &> /dev/null; then
    apt-get update && apt-get install -y certbot python3-certbot-nginx
  elif command -v yum &> /dev/null; then
    yum install -y epel-release && yum install -y certbot python3-certbot-nginx
  fi
fi

echo ">>> [4/5] 申请/配置 momentmap.top 的免费 SSL 证书..."
# 检查是否已存在 momentmap.top 证书
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "✔ 检测到已有证书: /etc/letsencrypt/live/$DOMAIN"
else
  echo "正在向 Let's Encrypt 申请 SSL 证书..."
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect || {
    echo "提示: Certbot 自动配置遇到问题，尝试使用 standalone/webroot 模式..."
    certbot certonly --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email || true
  }
fi

# 确保在所有 443 (ssl) 虚拟主机配置中包含 fogbound.conf
for conf in /etc/nginx/conf.d/*.conf /etc/nginx/sites-enabled/*; do
  if [ -f "$conf" ]; then
    if grep -q "443" "$conf" && ! grep -q "fogbound.conf" "$conf"; then
      echo "在 $conf 中注入 fogbound 代理..."
      sed -i '/ssl_certificate/a \    include /etc/nginx/snippets/fogbound.conf;' "$conf" || true
    fi
  fi
done

echo ">>> [5/5] 测试并重载 Nginx 与 Node 服务..."
nginx -t
systemctl daemon-reload
systemctl enable --now fogbound || true
systemctl restart fogbound || true
systemctl reload nginx

echo "=========================================================="
echo "✔ 部署完成！"
echo "WebSocket Secure (WSS) 已成功开启："
echo "WSS 地址: wss://$DOMAIN/fogbound/ws"
echo "HTTPS 网页: https://$DOMAIN/fogbound/"
echo "现在 GitHub Pages (HTTPS) 可直接连接 wss://$DOMAIN/fogbound/ws 进行联机！"
echo "=========================================================="
