# 流放之路查价器 Awakened PoE Trade（简称apt）简体中文维护

原来维护的版本感觉有点难理解，不知道从何开始，现在基于原版重新二开一个

## 20250624 加了点传奇
加了点词条

cd ./renderer
yarn --frozen-lockfile
yarn make-index-files
yarn lint
yarn build
cd ../main
yarn --frozen-lockfile
yarn build
yarn package
cd ..