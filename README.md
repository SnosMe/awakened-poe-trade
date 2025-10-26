# 流放之路查价器 Awakened PoE Trade（简称apt）简体中文维护

原来维护的版本感觉有点难理解，不知道从何开始，现在基于原版重新二开一个

# 目前只支持国际服
# 目前只做了A大汉化
## 20251027 同步原版更新
上赛季应该没加啥东西，所以开赛应该暂时不会更新
## 20250624 加了点传奇、加了点词条



## 备注
nga叫四埜宫瑶，之前网传彼岸版本，凤梨群的彼岸，都是我搞得。
本职IT狗，996加班比较多，所以做的慢，主要是很多内容我玩不到，所以更新动力比较小

```
cd ./renderer
yarn --frozen-lockfile
yarn make-index-files
yarn lint
yarn build
cd ../main
yarn --frozen-lockfile
yarn build
yarn package
```
