#!/bin/zsh
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
URL="http://127.0.0.1:4173"

if curl -sf "$URL/api/health" >/dev/null 2>&1; then
  echo "服务已在运行，正在打开浏览器: $URL"
  open "$URL"
  exit 0
fi

cd "$APP_DIR" || exit 1
NODE_BIN="$(command -v node)"
if [ -z "$NODE_BIN" ]; then
  echo "未找到 Node.js，请先安装 Node.js (>=18): https://nodejs.org/"
  exit 1
fi

if [ ! -d "$APP_DIR/dist" ]; then
  echo "首次运行，正在构建前端..."
  npm install && npm run build || exit 1
fi

echo "正在启动雅思单词跟读服务: $URL"
echo "（关闭此窗口或按 Ctrl+C 即可停止服务）"
(sleep 0.6 && open "$URL") &
exec "$NODE_BIN" "$APP_DIR/server.mjs"
