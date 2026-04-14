# API 文档

基础地址：`http://localhost:8080/api`

认证方式：
- 需要登录的接口统一使用 `Authorization: Bearer <token>`
- 返回错误统一为：

```json
{
  "message": "错误说明"
}
```

## 通用数据说明

### 用户状态
- `role`: `ADMIN | USER`
- `status`: `ACTIVE | BANNED`
- `muteStatus`: `NORMAL | MUTED`

### 帖子状态
- `status`: `ACTIVE | WITHDRAWN | DELETED`

### 通知类型
- `like`
- `comment`
- `follow`
- `mention`
- `system`

系统通知额外可能返回：
- `message`
- `actionLabel`
- `actionUrl`

## 认证

### POST `/auth/login`

请求：

```json
{
  "username": "admin",
  "password": "password123"
}
```

返回：`token + user`

### POST `/auth/register`

请求：

```json
{
  "username": "newuser",
  "nickname": "New User",
  "password": "password123"
}
```

返回：`token + user`

### POST `/auth/reset-password`

请求：

```json
{
  "username": "admin",
  "nickname": "HNUST Admin",
  "password": "new-password"
}
```

### GET `/auth/me`

返回当前登录用户。

## 用户

### GET `/users/{username}`

查看用户主页信息。

### GET `/users/search?q=关键词`

搜索用户。

### GET `/users/recommended?limit=5`

获取推荐用户。

### PATCH `/users/me`

更新当前用户资料。

支持字段：

```json
{
  "nickname": "HNUST Admin",
  "bio": "个人简介",
  "avatar": "/uploads/avatar.png",
  "coverUrl": "/uploads/cover.png"
}
```

### PATCH `/users/me/password`

修改密码。

### POST `/users/{id}/follow`

关注 / 取消关注。

### GET `/users/{id}/comments`

获取用户回复列表。

### GET `/users/{id}/posts`

获取用户帖子列表。

### GET `/users/{id}/likes`

获取用户点赞列表。

### GET `/users/{id}/bookmarks`

获取用户收藏列表。

### GET `/users/{id}/reposts`

获取用户转发列表。

## 帖子

### GET `/posts`

首页信息流。

### GET `/posts/{id}`

帖子详情。

### POST `/posts`

发布帖子。

```json
{
  "content": "Hello #HNUST @admin",
  "imageUrls": ["/uploads/a.png"]
}
```

### PATCH `/posts/{id}`

编辑自己的帖子。

### POST `/posts/{id}/republish`

重新发布一条被管理员撤回的帖子。

### DELETE `/posts/{id}`

删除自己的帖子。

### POST `/posts/{id}/like`

点赞 / 取消点赞。

### POST `/posts/{id}/bookmark`

收藏 / 取消收藏。

### POST `/posts/{id}/repost`

转发 / 取消转发。

### POST `/posts/{id}/hide`

隐藏这条帖子，仅对当前用户生效。

### POST `/posts/{id}/report`

举报帖子。

```json
{
  "category": "spam",
  "details": "存在重复刷屏"
}
```

举报类型：
- `spam`
- `abuse`
- `misinformation`
- `copyright`
- `other`

### GET `/posts/search?q=关键词`

搜索帖子。

### GET `/posts/tag/{tag}`

按标签查看帖子。

## 评论

### GET `/posts/{id}/comments`

获取帖子评论。

### POST `/posts/{id}/comments`

发表评论。

## 通知

### GET `/notifications`

获取通知列表。

### POST `/notifications/{id}/read`

标记单条已读。

### POST `/notifications/read-all`

全部标记已读。

## 话题

### GET `/topics/trending?limit=6`

获取热门话题。

## 上传

### POST `/uploads/images`

- 表单字段名：`file`
- 支持图片上传
- 文件保存在本地 `uploads/`
- 数据库只保存 URL，不直接保存图片二进制

## 管理员

仅 `role = ADMIN` 可访问。

### GET `/admin/overview`

获取后台统计卡片数据。

### GET `/admin/users`

获取用户列表。

支持查询参数：
- `q`
- `status`
- `muteStatus`

### GET `/admin/posts`

获取帖子列表。

支持查询参数：
- `q`
- `status`

### GET `/admin/comments`

获取评论列表。

支持查询参数：
- `q`

### GET `/admin/reports`

获取举报列表。

### GET `/admin/posts/recent?limit=8`

获取最近帖子。

### POST `/admin/reports/{id}/resolve`

标记举报已处理。

请求：

```json
{
  "reason": "已核查并完成处理"
}
```

### POST `/admin/users/{id}/ban`

封禁用户。

### POST `/admin/users/{id}/unban`

解除封禁。

### POST `/admin/users/{id}/mute`

禁言用户。

### POST `/admin/users/{id}/unmute`

解除禁言。

### POST `/admin/posts/{id}/withdraw`

撤回帖子。帖子会从公共流隐藏，并给作者发送带“重新编辑”入口的系统通知。

### DELETE `/admin/posts/{id}`

管理员删除帖子。帖子从前台隐藏，并给作者发送系统通知。

### DELETE `/admin/comments/{id}`

管理员删除评论。

## 安全与实现说明

- SQL 注入：使用 MyBatis 参数绑定，不做字符串拼接 SQL。
- XSS：前端帖子内容按文本片段渲染，不直接把用户输入当 HTML 注入页面。
- 密码：使用 BCrypt 哈希保存，不再使用明文密码。
- 跨域：后端已配置 CORS，允许本地开发环境 `localhost` / `127.0.0.1` 访问。
- 性能：
  - 路由组件按需懒加载
  - 图片使用 `loading=\"lazy\"`
  - 热门话题、推荐用户、后台最近帖子等接口有轻量内存缓存
