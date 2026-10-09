# Rad Raus! / Bike Jam

一个完整可玩的纯前端自行车停车解谜游戏。地点是虚构的慕尼黑 Rosenviertel 车站；所有标识、车辆和场景均为原创 SVG/CSS，没有使用真实交通公司或品牌素材。

## 启动

需要 **Node.js 20.19+**（推荐 Node 22），使用 npm。

换电脑后，先从 GitHub 获取完整项目：

```sh
git clone https://github.com/Logic-syd/bikeseeking.git
cd bikeseeking
```

然后安装依赖并启动：

```sh
nvm use 20  # 如使用 nvm；也可直接使用满足要求的 Node
npm install
npm run dev
```

打开终端输出的本地地址，默认为 http://127.0.0.1:5173 。开发服务器默认仅监听本机，不会部署到公网。

```sh
npm test                  # 规则、求解器、撤销、存档测试
npm run validate:levels   # 求解所有关卡，并逐步复核解路径合法性
npm run typecheck         # TypeScript 检查
npm run build             # 类型检查 + 生产构建，输出 dist/
npm run preview           # 本地预览生产构建
npm run test:e2e           # Playwright 交互回归（自动启动本地服务器）
npm run test:browser       # 启动 dev 后，真实拖动通关15关并生成截图
```

浏览器测试配置见 `playwright.config.ts`。macOS 上安装了 Chrome 时自动使用 Chrome，其他环境使用 Playwright Chromium；可通过 `PW_CHANNEL` 覆盖。没有浏览器时先执行 `npx playwright install chromium`。

已验证：25 项核心规则/求解器/存档测试、9 项真实 Chrome 交互回归、十五关逐步拖动完整通关；390px 手机和 1440px 桌面无横向溢出，德英布局、触摸不滚屏、动画期间快速输入、撤销离场、刷新恢复和当前状态提示均已检查。类型检查与生产构建通过。截图保存在 `artifacts/`，回归测试临时截图和跟踪位于 `test-results/`。自动化浏览器覆盖为 Chrome，尚未在实体 iOS/Safari 或 Firefox 上实测。

## 玩法与操作

- 普通自行车占连续 2 格，货运车占 3 格，宽度均为 1 格。每辆车只能沿长轴前后滑动，不能旋转。
- 按住车辆拖动，松手吸附到网格。选中后会显示合法移动范围，拖动时显示落点；受阻时出现轻微颜色反馈。
- 每段未明确开口的边界都是围栏。车只能通过与长轴和所在行/列对齐的 mint 绿色出口，整条离场路径必须畅通。
- 向出口外继续拖过约半格可完成一次离场。拖到新位置或离场算一步；点击、原位释放、取消拖动不计步。多格拖动算一步。
- 也可以点选车辆，用两个方向按钮逐格移动；到达出口边缘后再按一次即可离场。键盘用 Tab 选择车辆，然后按对应轴向的方向键。Escape 或系统 pointercancel 取消拖动。
- 所有车辆离场通关，没有倒计时、步数失败条件或锁定关卡。
- 撤销可恢复已离场车辆及步数；重开有确认窗口。提示在 Web Worker 内求解**当前**状态，标出下一辆车、方向和距离。
- 求解器明确区分“已找到完整解”“穷尽状态后无解”和“达到搜索上限”；达到上限不会误报无解。无解时提示撤销或重开。
- 当前规则下滑动可逆，移除车辆只会释放空间，因此从可解关卡合法到达的状态也可解。无解分支用独立障碍夹死的测试局面验证，便于未来添加关卡。
- 默认跟随浏览器德语/英语，其他语言回退英语。设置支持切换语言、关闭铃声、减少动画；首次进入也尊重系统减少动态效果偏好。

## 核心文件

```text
src/game/types.ts           关卡、车辆、出口、移动的数据类型
src/game/engine.ts          合法范围、连续路径碰撞、离场和状态校验
src/game/solver.ts          提示求解器（BFS + 可安全提前移除的车辆归约）
src/game/levels.ts          首三关及完整关卡列表
src/game/additional-levels.ts 后十二关手工布局
src/game/level-data.ts      简写关卡工厂与配色
src/game/engine.test.ts     规则和求解器测试
src/session.ts             进度、完整撤销栈、localStorage 容错
src/session.test.ts         存档和撤销测试
src/solver.worker.ts       后台提示计算，防止主界面阻塞
src/components/Board.tsx    指针、触摸、键盘、合法位置和离场动画
src/components/Artwork.tsx  原创俯视自行车、货运车、车站和障碍 SVG
src/App.tsx                首页、选关、游戏、通关、设置与流程控制
src/i18n.ts                德英双语文案
src/audio.ts               Web Audio 合成柔和车铃，无需音频素材
src/styles.css             手机优先的自适应视觉
scripts/validate-levels.ts  全关卡解路径验证
```

## 关卡格式与扩展

所有坐标从 **0** 开始，左上角为 `(0, 0)`。运行时 `positions[i]` 是第 i 辆车的长轴起点；`-1` 代表已离场。车辆方向、长度和所在车道由关卡固定。车辆宽度均为一格，所以出口表示边界上的一格开口。

```ts
const example: Level = {
  id: 16,
  title: { de: 'Kleine Pause', en: 'A little break' },
  subtitle: { de: 'Schaffe Platz.', en: 'Make some room.' },
  size: 6,
  difficulty: 'medium', // easy | medium | hard
  bikes: [
    // 横车：lane 是 y，start 是 x，覆盖 (0,2)、(1,2)
    { id: 'A', axis: 'h', lane: 2, start: 0, length: 2, color: '#df7795' },
    // 纵向货运车：lane 是 x，start 是 y，覆盖 (3,1)..(3,3)
    { id: 'B', axis: 'v', lane: 3, start: 1, length: 3, color: '#73a993' },
  ],
  exits: [{ side: 'right', lane: 2 }, { side: 'bottom', lane: 3 }],
  obstacles: [{ x: 0, y: 5, kind: 'tree' }], // tree | bollard
};
```

增加车辆时在 `bikes` 里增加一条数据，使用关卡内唯一的 id。`length: 3` 自动使用货运车轮廓；`axis` 决定渲染与输入轴向，`color` 只是视觉区分，规则不依赖颜色。无需修改 UI 或求解器。

增加关卡可直接添加 `Level` 对象到列表，也可以使用 `level-data.ts` 的 `level(...)` 工厂；车辆简写是 `[axis, lane, start, length?]`，`L/R/T/B(lane)` 是四个边的出口。标题与说明都应提供德英版本。确保车、固定障碍没有重叠，并为每辆车提供至少一个与轴向和车道对齐的出口。

每次修改后执行 `npm run validate:levels` 和 `npm test`。验证器会检查初始状态、计算完整解，并逐步通过生产规则重新执行，确认最终所有车离场。新增关卡建议保持 5×5 或 6×6，以保证手机触控尺寸。首页显示的“15”和区域编号为当前版本文案，扩展数量时同步更新。

## 状态与限制

- 使用 `localStorage` 键 `rad-raus:v1` 保存设置、各关最佳步数、当前状态和撤销历史；同一浏览器刷新后可从首页继续，不跨设备同步。
- 多标签页各自运行，最后写入的存档生效；没有账户、服务器、排行榜、计时、随机生成或多人模式。
- 进度保存失败会明确提示，当前会话仍然可玩。浏览器的音频策略可能要求先进行一次用户操作。
- 动画期间同步锁住游戏移动；更新当前状态的引用后再渲染，避免快速点击丢失状态。提示回调带当前局面身份校验，切关或继续移动会终止旧 Worker。
- 搜索最多 350,000 个归约状态，超限提供继续尝试说明。现有手工关卡远低于此上限。
- 本版本没有服务工作线程；首次加载需要访问本地服务器，已打开页面中的规则和求解均在本机执行。没有外部字体、图像、分析或游戏 API 请求。
