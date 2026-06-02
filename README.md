<p align="center">
  <img src="resources/icon.png" width="96" alt="SmartIME">
</p>

<h1 align="center">SmartIME</h1>
<p align="center"><strong>不打扰你的效率输入法</strong></p>
<p align="center">打字 · 计算 · 翻译 — 一个面板搞定，无广告，无追踪</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.2.0-purple">
  <img src="https://img.shields.io/badge/platform-Windows-blue">
  <img src="https://img.shields.io/badge/license-MIT-green">
</p>

---

## 为什么做这个

市面上的输入法越来越重：弹窗广告、新闻推送、皮肤商城、云同步……而你只想安静地打字。

SmartIME 是一个反其道而行之的输入法——**没有广告，没有云端词库，没有任何打扰**。它只做一件事：在你需要的时候出现，用完就消失。

## 和传统输入法有什么不同

| | 搜狗/微软拼音 | SmartIME |
|---|---|---|
| 广告 | 常见 | **零广告** |
| 数据上传 | 云端词库 | **完全本地** |
| 计算 | 需要打开计算器 | **直接输入算式出结果** |
| 翻译 | 需要切到浏览器 | **`/trans hello` → 你好** |
| 快捷指令 | 无 | **`/date` `/time` `/clip`** |
| 皮肤 | 图片换肤 | **CSS 级定制，毛玻璃/发光/动画** |
| 自定义扩展 | 无 | **自定义 `/email` 等快捷指令** |

## 功能一览

### 拼音输入
全拼 (`nihao`) 和简拼 (`nh`) 都支持，2500+ 汉字本地词库，智能频率排序。

### 数学直算
无需切换计算器，直接输入表达式：
```
23*47+15 → 1096
(100-20)/4 → 20
2**10 → 1024
```

### 快捷指令
| 指令 | 说明 |
|------|------|
| `/date` | 当前日期 |
| `/time` | 当前时间 |
| `/datetime` | 日期 + 时间 |
| `/calc 表达式` | 计算 |
| `/trans hello` | 英译中（2000+ 词汇） |
| `/clip` | 粘贴剪贴板内容 |

支持**自定义指令**：例如 `/email` 自动补全 `@gmail.com`。

### 13 套内置皮肤
5 套经典风格 + 8 套彩色毛玻璃，可视化编辑器支持导入导出。

### 其他
- **后悔模式**：2 秒内 `Ctrl+Z` 撤回重选
- **自动隐藏**：无操作后自动消失，可配置 0-10 秒
- **系统托盘**：常驻右下角，不占任务栏

## 快速开始

```bash
git clone https://github.com/Jaden-Song-27/solid-goggles.git
cd solid-goggles/smart-ime
npm install
npm run dev
```

启动后按 `Alt + =` 呼出面板，输入拼音即可。

> **Windows 打包**：`npm run electron:build:win`，在 `release/` 目录生成安装程序。

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Electron 28 + React 18 |
| 语言 | TypeScript |
| 构建 | Vite 5 |
| 状态管理 | Zustand |
| 系统交互 | koffi (Win32 SendInput API) |
| NLP | 自研拼音切分 + 本地词频排序 |

## 项目结构

```
smart-ime/
├── electron/           # Electron 主进程
│   ├── main.ts         # 入口、单实例锁、全局快捷键
│   ├── preload.ts      # contextBridge API
│   ├── window.ts       # 悬浮窗定位 & 自动隐藏
│   ├── tray.ts         # 系统托盘菜单
│   ├── native-injector.ts  # Win32 SendInput 跨应用文字注入
│   └── ipc/index.ts    # IPC 通信处理
├── src/                # React 渲染进程
│   ├── App.tsx         # 主界面 — 输入面板 + 页面路由
│   ├── store/          # Zustand 状态管理
│   ├── services/       # 拼音引擎 · 命令系统 · 安全数学解析器 · 翻译
│   ├── hooks/          # useImeBridge / useSkin / useAutoHide / useKeyboard
│   ├── skins/          # 皮肤引擎 + 13 套内置皮肤
│   ├── components/     # SkinEditor / SettingsPage / CommandsPage
│   └── styles/         # 全局样式 & CSS 动画
└── resources/          # 图标资源
```

## 许可

MIT License

---

<p align="center">
  <sub>Made with ❤️ for people who just want to type.</sub>
</p>
