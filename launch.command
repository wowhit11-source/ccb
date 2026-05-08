#!/bin/zsh
set -e

cd "$(dirname "$0")"

if [ ! -x "node_modules/.bin/electron" ]; then
  echo "Electron 앱 실행에 필요한 패키지를 설치합니다..."
  npm install
fi

echo "Agent Desk Skeleton 앱을 실행합니다..."
npm run desktop
