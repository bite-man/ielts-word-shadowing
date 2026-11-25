# IELTS Word Shadowing · 雅思单词跟读伴侣

[![IELTS](https://img.shields.io/badge/Exam-IELTS-blue.svg)](#)
[![Words](https://img.shields.io/badge/Words-3%2C489_MP3s-brightgreen.svg)](#词表统计-statistics)
[![Structure](https://img.shields.io/badge/Lists-7_Lists_%2F_35_Units-orange.svg)](#目录结构-directory-structure)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D18-339933.svg)](#快速开始-quick-start)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

专为 **雅思（IELTS）备考** 打造的本地单词跟读（Shadowing）网页伴侣与标准发音音频库：内置 **3,489** 个雅思核心词汇 MP3（7 个 Word List / 35 个 Unit），开箱即用，支持连续跟读、录音原音对比、生词本与全键盘盲操。

An out-of-the-box IELTS vocabulary shadowing web app paired with **3,489** MP3 pronunciation files across **7 Word Lists (35 Units)** — featuring auto-play shadowing, voice recording comparison, vocabulary notebook, and keyboard-first controls.

---

## ✨ 核心功能 (Features)

- **开箱即用音频库**：仓库自带 `audio/` 目录（3,489 个标准发音 MP3），无需额外配置路径即可启动。
- **自动连播跟读（Shadowing）**：支持按 Unit 连续播放、单句重播，配合间隔停顿跟读。
- **录音原音对比**：浏览器内一键录音并自动与原声对比，及时发现重音与尾音偏差。
- **生词本 & 掌握进度**：支持标星生词、标记已掌握、全库单词/序号快速检索。
- **全键盘盲操**：看纸质单词本时无需鼠标，纯键盘即可完成切词、复读、录音对比与标星。

---

## 🚀 快速开始 (Quick Start)

### 环境要求
- [Node.js](https://nodejs.org/) >= 18（或 [Bun](https://bun.sh/)）

### 1. 克隆并启动

```bash
git clone https://github.com/bite-man/ielts-word-shadowing.git
cd ielts-word-shadowing

# 安装依赖并构建前端
npm install
npm run build

# 启动服务（默认访问 http://127.0.0.1:4173）
npm start
```

> **macOS 用户**：构建后也可直接双击根目录的 `start.command` 一键启动并在浏览器中打开。

### 2. 开发模式（可选）

```bash
# 终端 1：启动音频与 API 后端（4173 端口）
npm start

# 终端 2：启动 Vite 前端热更新（5173 端口，已配置代理到 4173）
npm run dev
```

### 3. 自定义音频目录（可选）

服务默认读取项目内的 `audio/` 目录；如需指向其他本地音频目录，可通过 `AUDIO_ROOT` 环境变量指定：

```bash
AUDIO_ROOT=/path/to/your/audio npm start
```

---

## ⌨️ 键盘快捷键 (Shortcuts)

| 按键 | 功能 |
| :---: | :--- |
| `Space` | 播放 / 暂停当前单词 |
| `←` / `→` | 上一个 / 下一个单词并立即发音 |
| `R` | 重播当前单词 |
| `A` | 开启 / 关闭自动连播跟读 |
| `V` | 录音并自动原音对比 |
| `S` | 将当前词加入 / 移出生词本 |
| `M` | 将当前词标记 / 取消已掌握 |
| `/` | 快速搜索全库单词或序号 |
| `?` | 打开 / 关闭快捷键面板 |

---

## 📁 目录结构 (Directory Structure)

```text
.
├── audio/                  # 雅思核心词汇音频库（3,489 个 MP3）
│   ├── Word List 1/        # Unit 1 ~ Unit 5
│   ├── ...
│   └── Word List 7/        # Unit 1 ~ Unit 5
├── src/                    # React + TypeScript + Tailwind 前端源码
├── index.html              # 页面入口
├── server.mjs              # Node.js 音频流媒体（Range）与静态资源服务
├── server.test.mjs         # 服务端目录扫描与接口测试
├── start.command           # macOS 双击一键启动脚本
├── package.json
└── vite.config.ts
```

音频文件遵循 `<index>_<word>.mp3` 命名规范（例如：`001_rehabilitation.mp3`、`010_abrupt.mp3`）。

---

## 📊 词表统计 (Statistics)

| Word List | Units | Audio Files (`.mp3`) |
| :--- | :---: | :---: |
| Word List 1 | 5 | 499 |
| Word List 2 | 5 | 497 |
| Word List 3 | 5 | 499 |
| Word List 4 | 5 | 498 |
| Word List 5 | 5 | 500 |
| Word List 6 | 5 | 500 |
| Word List 7 | 5 | 496 |
| **Total** | **35** | **3,489** |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
