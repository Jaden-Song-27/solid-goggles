# SmartIME — 桌面端智能输入法

Electron + React + TypeScript 全栈桌面应用。

## 功能

- **拼音输入**：音节切分 + 字典查字（~2500 汉字），支持首字母缩写扩展
- **快捷指令**：`/date` `/time` `/datetime` `/calc` `/trans` `/clip`
- **英译中**：`/trans hello` → 内置 2000+ 词汇词典 + 词形还原
- **后悔模式**：2 秒内 Ctrl+Z 回退上屏文字，重新选词
- **数学计算**：直接输入算式（如 `23*47+15`）出结果
- **自定义指令**：支持新建/编辑/删除，模板占位符 `$input`
- **5 套内置皮肤**：Ghost（暗色毛玻璃）/ Terminal（终端绿字）/ Frosted（iOS 风格）/ Ink（水墨竖排）/ Minimal（极简浮字）
- **皮肤编辑器**：可视化 WYSIWYG 编辑器 + 实时预览 + 导入导出
- **自动隐藏**：可配置延迟（含呼吸闪烁警告动画）
- **系统托盘**：右键菜单切换皮肤、导航页面

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Electron 30 |
| 前端 | React 18 + TypeScript + Vite 5 |
| 状态管理 | Zustand |
| 样式 | CSS Variables + 皮肤引擎 |
| 系统交互 | koffi（Win32 SendInput API） |
| 打包 | electron-builder（NSIS） |

## 快速开始

```bash
npm install
npm run dev        # 开发模式（Vite + Electron）
npm run build      # 仅构建
npm run electron:build:win  # 打包 Windows 安装程序
```

## 项目结构

```
smart-ime/
├── electron/           # Electron 主进程
│   ├── main.ts         # 入口、单实例锁、全局快捷键
│   ├── preload.ts      # contextBridge API
│   ├── window.ts       # 悬浮窗定位
│   ├── tray.ts         # 系统托盘
│   ├── native-injector.ts  # 跨平台模拟输入
│   └── ipc/index.ts    # IPC 处理
├── src/                # React 渲染进程
│   ├── App.tsx         # 主界面
│   ├── store/          # Zustand 状态管理
│   ├── services/       # 拼音引擎、命令、翻译
│   ├── hooks/          # useImeBridge / useSkin / useAutoHide / useKeyboard
│   ├── skins/          # 皮肤引擎 + 5 套内置皮肤
│   ├── components/     # SkinEditor / SettingsPage / CommandsPage
│   └── styles/         # 全局样式
└── resources/          # 图标资源
```

## 许可

MIT
