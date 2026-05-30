# 市集同行 · Claude Code 工作区配置

## Obsidian 知识库

- **Vault 路径**: `/Users/will/Library/Mobile Documents/iCloud~md~obsidian/Documents/黑曜石知识库/`
- **集成模式**: 双向读写
  - 读取：开发时将从 vault 加载业务上下文（蜂巢知识库、合同、设计文档等）
  - 写入：AI 分析结果、架构决策、会议纪要自动写入 vault
- **命名规范**: AI 生成的文件使用 `AI-` 前缀以区分人工/机器生成内容

## 项目仓库

- **主仓库** (`/tmp/mywork`): 全栈权限管理系统 (MyWork RBAC)
  - 后端: Fastify + TypeScript + Prisma + SQLite
  - Web: React 19 + Vite + Tailwind CSS
  - 移动端: Expo + React Native
  - 小程序: 微信小程序原生
- **本地仓库** (`/Users/will/my-todo-app`): 市集同行业务文档 + Claude Code 技能/记忆

## 技能

- `shiji-tongxing` — 市集同行平台开发专用技能，自动激活于相关文件
- 45+ 社区技能已安装，覆盖全栈开发流程

## Hermes ↔ Claude Code 任务桥

Hermes 通过企业微信接收编码任务后，会将任务写入 `~/task-queue/inbox/`。
**每次会话开始时**必须检查该目录。发现有 `status: pending` 的任务文件时：

1. 读取任务文件，理解需求和上下文
2. 在 `/tmp/mywork/` 或相关仓库中实施代码变更
3. 完成后在 `~/task-queue/outbox/` 写入结果文件
4. 将原 inbox 文件 status 改为 done，移动到 `~/task-queue/archive/`

协议详见 `~/task-queue/PROTOCOL.md`。
