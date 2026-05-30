#!/bin/bash
# 心汐 API 监控 — 一键部署脚本
# 用法: bash setup_monitor.sh

echo "=== 心汐 API 监控部署 ==="

# 1. 部署测试脚本
echo "[1/3] 部署测试脚本..."
cp "$(dirname "$0")/xinxi_api_test.py" /tmp/xinxi_api_test.py
chmod +x /tmp/xinxi_api_test.py
echo "  ✅ /tmp/xinxi_api_test.py"

# 2. 安装 launchd 定时任务（每 10 分钟）
echo "[2/3] 安装 launchd 定时任务..."
PLIST="$HOME/Library/LaunchAgents/com.xinxi.api-monitor.plist"
cat > "$PLIST" << 'PLISTEOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.xinxi.api-monitor</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/tmp/xinxi_api_test.py</string>
    </array>
    <key>StartInterval</key>
    <integer>600</integer>
    <key>StandardOutPath</key>
    <string>/tmp/xinxi-monitor.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/xinxi-monitor-err.log</string>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
PLISTEOF

launchctl unload "$PLIST" 2>/dev/null
launchctl load "$PLIST"
echo "  ✅ launchd 已加载 (每 10 分钟)"

# 3. 首次测试
echo "[3/3] 首次运行测试..."
python3 /tmp/xinxi_api_test.py
echo ""
echo "=== 部署完成 ==="
echo "日志: /tmp/xinxi-monitor.log"
echo "错误: /tmp/xinxi-monitor-err.log"
echo ""
echo "管理命令:"
echo "  查看状态: launchctl list | grep xinxi"
echo "  停止监控: launchctl unload $PLIST"
echo "  手动测试: python3 /tmp/xinxi_api_test.py"
