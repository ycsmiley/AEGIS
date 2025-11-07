#!/bin/bash

# 🚀 Aegis Finance - 快速啟動腳本

echo "======================================"
echo "🚀 Aegis Finance 本地測試環境啟動"
echo "======================================"

# 檢查當前目錄
if [ ! -d "backend" ] || [ ! -d "frontend" ] || [ ! -d "contracts" ]; then
    echo "❌ 錯誤：請在專案根目錄執行此腳本"
    echo "   當前路徑：$(pwd)"
    echo ""
    echo "請執行："
    echo "  cd /path/to/new_arc_project"
    echo "  ./start.sh"
    exit 1
fi

echo ""
echo "✅ 目錄檢查通過"
echo ""

# 安裝依賴
echo "📦 安裝 Backend 依賴..."
cd backend
npm install
cd ..

echo ""
echo "📦 安裝 Frontend 依賴..."
cd frontend
npm install
cd ..

echo ""
echo "📦 安裝 Contracts 依賴..."
cd contracts
npm install
cd ..

echo ""
echo "======================================"
echo "✅ 所有依賴安裝完成！"
echo "======================================"
echo ""
echo "🎯 下一步："
echo ""
echo "1. 啟動 Hardhat 本地節點（終端機 1）："
echo "   cd contracts && npx hardhat node"
echo ""
echo "2. 部署合約（終端機 2）："
echo "   cd contracts && npx hardhat run scripts/deploy-arc.js --network localhost"
echo ""
echo "3. 啟動 Backend（終端機 3）："
echo "   cd backend && npm run start:dev"
echo ""
echo "4. 啟動 Frontend（終端機 4）："
echo "   cd frontend && npm run dev"
echo ""
echo "======================================"
echo "📖 查看 LOCAL_TESTING_GUIDE.md 獲取完整說明"
echo "======================================"
