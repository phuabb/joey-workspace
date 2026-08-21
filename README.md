# Joey 工作台

一个移动端优先、本机保存、可安装到手机桌面并支持离线使用的项目工作台。

## 发布到 GitHub Pages

1. 登录 GitHub，点击右上角 `+` → `New repository`。
2. Repository name 填 `joey-workspace`，选择 `Public`，点击 `Create repository`。
3. 点击 `uploading an existing file`，上传本目录中的 `index.html`、`manifest.webmanifest`、`sw.js`、`icon.svg`。
4. 点击 `Commit changes`。
5. 进入 `Settings` → `Pages`，在 `Build and deployment` 中选择 `Deploy from a branch`。
6. Branch 选择 `main` 和 `/ (root)`，点击 `Save`。
7. 等待约 1–3 分钟，页面会显示网站地址，通常为 `https://你的用户名.github.io/joey-workspace/`。

## 离线说明

网站需要首次联网打开以缓存文件；之后即使断网，核心项目、待办、看板、时间轴、本地 AI 模板和数据导入导出仍可使用。实时营销热点必须联网获取。
