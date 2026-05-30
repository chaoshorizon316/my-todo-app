---
title: 心汐 · 微信小程序技术方案
version: 1.0
created: 2026-05-13
---

## 架构总览

```
┌──────────────┐     HTTPS      ┌──────────────────┐
│  微信小程序   │ ◀────────────▶ │   Backend API     │
│  (Frontend)  │   wx.login()   │  Fastify+Prisma   │
│              │   REST API     │  SQLite           │
└──────────────┘                └──────────────────┘
```

## 前端：微信小程序

### 页面
| 页面 | 路径 | 功能 |
|------|------|------|
| 心湖 | pages/lake/ | 湖面状态+记录此刻+投石动画 |
| 涟漪 | pages/ripple/ | 情绪时间线+趋势图 |
| 回响 | pages/echo/ | 关怀卡片列表 |
| 宿缘 | pages/bond/ | 羁绊双Tab |

### 组件
| 组件 | 用途 |
|------|------|
| lake-canvas | 湖面渲染（不同状态+水纹图+涟漪动画） |
| stone-splash | 投石墨滴动画 |
| mood-picker | 情绪选择器 |
| toast | 轻提示 |

### 关键API依赖
- `wx.login()` → 获取 code → 后端换取 openid
- `wx.request()` → REST API 通信
- `wx.createInnerAudioContext()` → 投石音效
- `wx.setStorageSync()` → 本地缓存引导完成状态

## 后端：Fastify + Prisma + SQLite

### 部署
- 目录：`/Users/will/my-todo-app/xinxi-server/`
- 使用现有 Prisma + SQLite 基础设施

### 数据模型
```prisma
model User {
  id        String   @id @default(uuid())
  openid    String   @unique
  nickname  String?
  avatar    String?
  mbti      String?
  role      String?  // 关系状态
  createdAt DateTime @default(now())
  
  moods     Mood[]
  bonds     Bond[]
  messages  Message[]
}

model Mood {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  state     String   // 开心/平静/疲惫/焦虑/低落/充满活力
  lakeState String   // mirror/breeze/ripples/storm
  note      String?
  createdAt DateTime @default(now())
}

model Bond {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  name      String   // 对方名字
  relation  String   // 男友/闺蜜/家人
  type      String   // 守护光点/相伴/遥望/微光
  silent    Boolean  @default(false) // 静默守望?
  createdAt DateTime @default(now())
}

model Message {
  id        String   @id @default(uuid())
  fromUserId String
  toUserId  String
  text      String
  status    String   @default("pending") // pending/accepted/rejected
  createdAt DateTime @default(now())
}
```

### API 端点
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/login | wx.login() code换token |
| GET | /api/user/me | 获取当前用户信息 |
| PUT | /api/user/me | 更新个人信息 |
| POST | /api/moods | 记录心情 |
| GET | /api/moods | 获取心情历史 |
| GET | /api/lake-state | 获取当前湖面状态 |
| GET | /api/bonds | 获取羁绊列表 |
| POST | /api/bonds | 添加羁绊 |
| DELETE | /api/bonds/:id | 删除羁绊 |
| GET | /api/messages | 获取消息列表 |
| POST | /api/messages | 发送关怀消息 |
| PUT | /api/messages/:id/accept | 接纳回响 |
| PUT | /api/messages/:id/reject | 婉拒回响 |
