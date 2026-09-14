# Node Atlas

浏览器中的抽象节点地图编辑器。TypeScript + React + SVG 二维编辑，Three.js 共用三维查看组件。

## 运行

```sh
npm install
npm run dev
```

打开终端给出的本地地址。`npm run typecheck` 执行严格类型检查；`npm run build` 先检查类型再输出静态文件到 `dist`；`npm test` 验证探索规则、历史记录和草稿存储。

生产构建将 React / React DOM 19.3.0 和 Three.js 0.180.0 排除出本地产物，通过 HTML import map 从 CDN 加载：React 使用 esm.sh，Three.js（含 OrbitControls）使用 jsDelivr。固定版本及入口映射集中在 `vite.config.ts`，升级依赖时需同步调整。部署后首次加载需要访问这些 CDN；`npm run dev` 仍使用本机安装的依赖。

## 代码结构

- `src/App.tsx`：组装编辑器页面；`main.tsx` 仅负责挂载。
- `src/components/`：按 `layout`、`sidebar`、`canvas`、`inspector`、`dialogs`、`ui` 拆分界面。`canvas/three` 负责三维场景构建与资源生命周期。
- `src/hooks/`：分别管理画布交互、节点操作、预览、快捷键、文件导入导出和历史记录；`useEditorController` 只负责组合。
- `src/domain/`：纯 TypeScript 数据类型、条件判定、探索规则、路由、校验、序列化和历史 reducer，不依赖 React。
- `src/services/`：浏览器草稿存储。
- `src/examples/`：显式加载的示例数据，默认启动不加载。
- `tests/`：TypeScript 测试。

## 使用

- 左侧添加节点；世界战斗区域创建时自动建立二级地图和默认入口。
- 拖动节点布局；空白处拖动画布，滚轮缩放。点击节点吸附点再点击目标吸附点完成连接，期间允许切层。
- 选中节点配置条件、奖励和出入口。选中连线切换单向／双向。出口绑定自动生成世界路线。
- Z 层支持任意整数和跨多层连接；平面视图使用可点击的跨层标记。
- 3D 为只读地图视图，支持旋转、平移、缩放；游玩预览中仍支持点击节点探索。
- V 选择，H 平移，Delete 删除，Ctrl+C / Ctrl+V 复制粘贴，Ctrl+Z 撤销，Ctrl+Shift+Z 重做，Esc 取消。
- 项目设置管理钥匙；预览调试切换持有钥匙；支持重置探索。
- 每次打开默认是空白项目，不自动加载示例或草稿。项目设置中的“加载示例地图”用于快速体验；示例模块按需加载。
- 编辑后自动保存到当前浏览器的 localStorage。空白启动不会覆盖旧草稿，可在项目设置中点击“恢复本机草稿”。导出 JSON 备份；导入先做格式校验，可撤销。

所有到达节点立即完成，奖励不消耗钥匙。发现和解锁永久保留，直到重置预览。完成节点可直接访问，未完成节点由已完成邻接节点开放。世界战斗区域不直接开放邻接节点，需经二级出口解锁目标。

基础地图校验检查入口、出口、无效引用和结构可达性，不求解任意条件组合。正交线保持端点轴向，最多两个转折点，不做自动障碍绕行。
