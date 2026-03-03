# Romantic-Journey

一个旅行搭子社区原型（MVP）：

- 首页参考高信息密度平台布局，已接入品牌 Logo，右上角仅展示头像与昵称。
- 新增独立登录/注册页 `register.html`：输入昵称 + 密码，系统自动判断新注册或已有账号登录；新注册密码含复杂度校验。
- 首次登录会要求补全个人资料（含头像上传按钮、生日、MBTI、星座、技能标签、旅行偏好），再进入正常使用。
- 账户切换与注销入口已并入头像点击后的个人信息面板；每个账户的数据按昵称独立存储。
- 用户可发布行程帖（目的地、时间、预算、标签、景点、详细行程安排）。
- 行程支持点赞、评论（含头像、回复、作者标签、置顶、删除权限）、发布时间展示，并支持“综合/最新/最热”排序。
- 新增社交关系与聊天机制：点击行程卡头像可查看个人信息遮罩层并执行关注/取消关注、拉黑/取消拉黑、发起聊天；主页不常驻聊天模块，发起聊天后才会出现独立聊天页签（含“+”创建群组）；陌生人私聊仅 1 条消息，互相关注后可无限私聊。
- 新增消息页签：展示在首页右侧消息栏，支持查看聊天会话列表与系统消息（新增关注、谁赞了你的行程/主页、谁评论了你的行程）；消息标题会显示未读红点数字。
- 新增中英双语切换：登录页与首页右上支持中文/English 切换，语言偏好会保存在本地。
- 快速匹配卡片展示头像与搭子好评（评分/评价关键词）。
- 导航栏已移除“找搭子”；保留首页/行程广场/旅行社区/我的主页。
- 导航栏“我的主页”右侧新增简约放大镜（黑框白底）查询入口，可跳转到独立查询页面并模糊搜索用户与行程。
- 搜索页增加“搜索”按钮，结果分为“账户/行程/日记”；账户结果展示头像并可跳转到账户主页，行程结果可跳转到行程详情页，日记结果可跳转到日记详情页。
- 导航栏新增“我的主页”：旅行记忆墙、国家足迹与成就勋章在导航栏下方的独立“我的主页”页面展示；首页右侧固定展示消息栏。
- 国家足迹支持显示国家国旗，提升地区辨识度。
- 笔记展示创建日期与地点打卡信息，并支持删除已发布内容。

- 新增“管理后台”页面：汇总注册用户、行程/日记规模与关键互动日志，便于演示运营视角。

## Supabase 对接（MVP 注册落库）

前端已支持在本地 MVP 操作时同步写入 Supabase（注册、资料保存、发布行程、行程点赞/评论、发布笔记、笔记点赞、关注/拉黑、私聊/群聊消息）。

在浏览器控制台执行一次配置（会写入 localStorage）：

```js
localStorage.setItem('romanticJourneySupabaseUrl', 'https://<your-project-ref>.supabase.co');
localStorage.setItem('romanticJourneySupabaseAnonKey', '<your-anon-key>');
```

配置后重新打开页面并执行完整流程，即可在 Supabase 各表中看到同步数据。


AI 行程自动生成（Vue）默认使用 `gpt-5.2`，不向终端用户展示 Key 输入框。请在部署时配置：

```js
// 二选一：推荐 window 变量（页面加载前注入）
window.RJ_OPENAI_API_KEY = '<your-openai-key>';

// 或本地调试写入 localStorage
localStorage.setItem('romanticJourneyOpenAIKey', '<your-openai-key>');
```

数据库结构建议直接使用：`sql/mvp_schema.sql`（已覆盖当前前端所有写入行为的表结构）。


## Vue 重构版（简约 UI）

新增 Vue 单页版本：`vue-app.html`，覆盖注册/登录、资料编辑（含头像上传）、主页发布、搜索、账户主页、行程详情、日记九宫格详情、关注/拉黑、私聊、管理后台等核心流程，数据结构继续兼容现有 `localStorage` keys。

访问：`http://localhost:4173/vue-app.html#/register`

## 本地启动

```bash
python3 -m http.server 4173
```

访问：
- 登录/注册：`http://localhost:4173/register.html`
- 首页：`http://localhost:4173/index.html`
- 我的主页：`http://localhost:4173/my-home.html`
- 查询页：`http://localhost:4173/search.html`
- 管理后台：`http://localhost:4173/admin.html`
- 账户主页：`http://localhost:4173/account.html?user=<昵称>`
- 行程详情：`http://localhost:4173/trip-detail.html?id=<行程ID>&user=<昵称>`
- 日记详情：`http://localhost:4173/diary-detail.html?id=<日记ID>&user=<昵称>`
