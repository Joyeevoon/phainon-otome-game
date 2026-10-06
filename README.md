# 夏日贴纸 · 人鱼泡澡

纯静态网页小游戏，直接部署到 GitHub Pages 即可。

## 部署步骤

### 方式一：仓库根目录
1. 新建一个 GitHub 仓库（Public）
2. 把这个文件夹里的**所有文件**上传到仓库根目录（含 `.nojekyll`）
3. 仓库 Settings → Pages → Source 选 `Deploy from a branch`，分支选 `main`、目录选 `/ (root)`，保存
4. 等 1 分钟左右，访问 `https://<你的用户名>.github.io/<仓库名>/`

### 方式二：作为子目录
把 `summer-sticker-bath/` 整个文件夹放进仓库，路径访问 `https://<用户名>.github.io/<仓库名>/summer-sticker-bath/`

## 本地预览
必须用本地服务器打开（用了 ES 模块，直接双击 html 会被浏览器拦）：
```bash
python3 -m http.server 8000
# 然后访问 http://localhost:8000
```

## 说明
- 无后端、无外部依赖，全部素材在 `assets/` 里
- 手机端需先点一下页面（浏览器要求用户手势才允许出声）
- 加载页会等首页视频攒够缓冲再显示首页（最多 6 秒），避免网络差时卡顿
- 目录结构：`index.html` / `style.css` / `script.js` / `data.js` / `assets/`
