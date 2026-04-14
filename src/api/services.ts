import type { AdminOverview, AdminReport, Comment, Notification, Post, ReportCategory, Topic, User } from '../types';
import { apiRequest, getAuthToken, normalizeAssetUrl, setAuthToken } from './http';

type ApiUser = {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  coverUrl?: string;
  bio?: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'BANNED';
  muteStatus: 'NORMAL' | 'MUTED';
  createdAt: string;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
};

type ApiPost = {
  id: string;
  authorId: string;
  author: ApiUser;
  content: string;
  images?: string[];
  status: 'ACTIVE' | 'WITHDRAWN' | 'DELETED';
  createdAt: string;
  likesCount: number;
  repostsCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isReposted?: boolean;
  isBookmarked?: boolean;
  tags?: string[];
};

type ApiComment = {
  id: string;
  postId: string;
  authorId: string;
  author: ApiUser;
  content: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
};

type LoginResult = {
  token: string;
  user: ApiUser;
};

type ApiAdminReport = {
  id: string;
  category: ReportCategory;
  details?: string | null;
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string | null;
  reporter: ApiUser;
  resolvedBy?: ApiUser | null;
  post?: {
    id: string;
    content: string;
    status: 'ACTIVE' | 'WITHDRAWN' | 'DELETED';
    createdAt: string;
    author: ApiUser;
  } | null;
};

const likedPostIds = new Set<string>();
const repostedPostIds = new Set<string>();
const bookmarkedPostIds = new Set<string>();
const cacheStore = new Map<string, { expiresAt: number; value: unknown }>();
const CACHE_TTL_MS = 60_000;

const readCache = <T>(key: string) => {
  const item = cacheStore.get(key);
  if (!item || item.expiresAt < Date.now()) {
    cacheStore.delete(key);
    return null;
  }
  return item.value as T;
};

const writeCache = <T>(key: string, value: T, ttl = CACHE_TTL_MS) => {
  cacheStore.set(key, {
    expiresAt: Date.now() + ttl,
    value,
  });
};

const clearCache = (key: string) => {
  cacheStore.delete(key);
};

const clearCacheByPrefix = (prefix: string) => {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
};

const mapUser = (user: ApiUser): User => ({
  ...user,
  avatar: normalizeAssetUrl(user.avatar),
  coverUrl: user.coverUrl ? normalizeAssetUrl(user.coverUrl) : undefined,
});

const mapPost = (post: ApiPost): Post => {
  const locallyLiked = likedPostIds.has(post.id);
  const isLiked = Boolean(post.isLiked) || locallyLiked;
  const locallyReposted = repostedPostIds.has(post.id);
  const isReposted = Boolean(post.isReposted) || locallyReposted;

  return {
    ...post,
    author: mapUser(post.author),
    images: post.images?.map((image) => normalizeAssetUrl(image)) || [],
    likesCount: post.likesCount + (locallyLiked && !post.isLiked ? 1 : 0),
    repostsCount: post.repostsCount + (locallyReposted && !post.isReposted ? 1 : 0),
    isLiked,
    isReposted,
    isBookmarked: Boolean(post.isBookmarked) || bookmarkedPostIds.has(post.id),
    tags: post.tags || [],
  };
};

const mapComment = (comment: ApiComment): Comment => ({
  ...comment,
  author: mapUser(comment.author),
});

const sortByCreatedAt = <T extends { createdAt: string }>(items: T[]) =>
  [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const authService = {
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const result = await apiRequest<LoginResult>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      },
      false,
    );

    setAuthToken(result.token);

    return {
      token: result.token,
      user: mapUser(result.user),
    };
  },

  async getCurrentUser(): Promise<User> {
    const user = await apiRequest<ApiUser>('/auth/me', { method: 'GET' }, 'required');
    return mapUser(user);
  },

  async register(username: string, nickname: string, password: string): Promise<{ token: string; user: User }> {
    const result = await apiRequest<LoginResult>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ username, nickname, password }),
      },
      false,
    );

    setAuthToken(result.token);

    return {
      token: result.token,
      user: mapUser(result.user),
    };
  },

  async resetPassword(username: string, nickname: string, password: string): Promise<void> {
    await apiRequest<{ message: string }>(
      '/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({ username, nickname, password }),
      },
      false,
    );
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiRequest<{ message: string }>(
      '/users/me/password',
      {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      },
      'required',
    );
  },

  logout() {
    setAuthToken(null);
    cacheStore.clear();
  },
};

export const uploadService = {
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiRequest<{ url: string }>(
      '/uploads/images',
      {
        method: 'POST',
        body: formData,
      },
      'required',
    );

    return normalizeAssetUrl(response.url);
  },
};

export const postService = {
  async getPosts(): Promise<Post[]> {
    const posts = await apiRequest<ApiPost[]>('/posts', { method: 'GET' }, 'optional');
    return sortByCreatedAt(posts.map(mapPost));
  },

  async getPostById(id: string): Promise<Post | undefined> {
    try {
      const post = await apiRequest<ApiPost>(`/posts/${id}`, { method: 'GET' }, 'optional');
      return mapPost(post);
    } catch (error) {
      if ((error as Error & { status?: number }).status === 404) {
        return undefined;
      }
      throw error;
    }
  },

  async createPost(content: string, files: File[] = []): Promise<Post> {
    const imageUrls = await Promise.all(files.map((file) => uploadService.uploadImage(file)));
    const post = await apiRequest<ApiPost>(
      '/posts',
      {
        method: 'POST',
        body: JSON.stringify({
          content,
          imageUrls,
        }),
      },
      'required',
    );

    clearCacheByPrefix('admin:recent-posts');
    return mapPost(post);
  },

  async updatePost(postId: string, content: string): Promise<Post> {
    const post = await apiRequest<ApiPost>(
      `/posts/${postId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      },
      'required',
    );
    clearCacheByPrefix('admin:recent-posts');
    return mapPost(post);
  },

  async republishPost(postId: string, content: string): Promise<Post> {
    const post = await apiRequest<ApiPost>(
      `/posts/${postId}/republish`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      },
      'required',
    );
    clearCacheByPrefix('admin:recent-posts');
    return mapPost(post);
  },

  async deletePost(postId: string): Promise<void> {
    await apiRequest<{ message: string }>(`/posts/${postId}`, { method: 'DELETE' }, 'required');
    likedPostIds.delete(postId);
    repostedPostIds.delete(postId);
    bookmarkedPostIds.delete(postId);
    clearCacheByPrefix('admin:recent-posts');
  },

  async likePost(postId: string): Promise<Post> {
    const post = await apiRequest<ApiPost>(
      `/posts/${postId}/like`,
      { method: 'POST' },
      'required',
    );

    if (post.isLiked) {
      likedPostIds.add(postId);
    } else {
      likedPostIds.delete(postId);
    }

    return mapPost(post);
  },

  async bookmarkPost(postId: string): Promise<Post> {
    const post = await apiRequest<ApiPost>(
      `/posts/${postId}/bookmark`,
      { method: 'POST' },
      'required',
    );

    if (post.isBookmarked) {
      bookmarkedPostIds.add(postId);
    } else {
      bookmarkedPostIds.delete(postId);
    }

    return mapPost(post);
  },

  async repostPost(postId: string): Promise<Post> {
    const post = await apiRequest<ApiPost>(
      `/posts/${postId}/repost`,
      { method: 'POST' },
      'required',
    );

    if (post.isReposted) {
      repostedPostIds.add(postId);
    } else {
      repostedPostIds.delete(postId);
    }

    return mapPost(post);
  },

  async getPostsByAuthor(authorId: string): Promise<Post[]> {
    const posts = await apiRequest<ApiPost[]>(`/users/${authorId}/posts`, { method: 'GET' }, 'optional');
    return sortByCreatedAt(posts.map(mapPost));
  },

  async getLikedPostsByUser(userId: string): Promise<Post[]> {
    const posts = await apiRequest<ApiPost[]>(`/users/${userId}/likes`, { method: 'GET' }, 'optional');
    return sortByCreatedAt(posts.map(mapPost));
  },

  async getBookmarkedPostsByUser(userId: string): Promise<Post[]> {
    const posts = await apiRequest<ApiPost[]>(`/users/${userId}/bookmarks`, { method: 'GET' }, 'optional');
    return sortByCreatedAt(posts.map(mapPost));
  },

  async getRepostedPostsByUser(userId: string): Promise<Post[]> {
    const posts = await apiRequest<ApiPost[]>(`/users/${userId}/reposts`, { method: 'GET' }, 'optional');
    return sortByCreatedAt(posts.map(mapPost));
  },

  async getPostsByTag(tag: string): Promise<Post[]> {
    const normalizedTag = tag.replace(/^#/, '');
    const posts = await apiRequest<ApiPost[]>(`/posts/tag/${encodeURIComponent(normalizedTag)}`, { method: 'GET' }, 'optional');
    return sortByCreatedAt(posts.map(mapPost));
  },

  async searchPosts(query: string): Promise<Post[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    if (normalizedQuery.startsWith('#')) {
      return postService.getPostsByTag(normalizedQuery);
    }

    const posts = await apiRequest<ApiPost[]>(
      `/posts/search?q=${encodeURIComponent(normalizedQuery)}`,
      { method: 'GET' },
      'optional',
    );

    return sortByCreatedAt(posts.map(mapPost));
  },

  async hidePost(postId: string): Promise<void> {
    await apiRequest<{ message: string }>(`/posts/${postId}/hide`, { method: 'POST' }, 'required');
  },

  async reportPost(postId: string, payload: { category: ReportCategory; details?: string }): Promise<void> {
    await apiRequest<{ message: string }>(
      `/posts/${postId}/report`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      'required',
    );
  },
};

export const commentService = {
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const comments = await apiRequest<ApiComment[]>(`/posts/${postId}/comments`, { method: 'GET' }, 'optional');
    return sortByCreatedAt(comments.map(mapComment));
  },

  async addComment(postId: string, content: string): Promise<Comment> {
    const comment = await apiRequest<ApiComment>(
      `/posts/${postId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      },
      'required',
    );

    return mapComment(comment);
  },

  async getCommentsByAuthorId(authorId: string): Promise<Comment[]> {
    const comments = await apiRequest<ApiComment[]>(`/users/${authorId}/comments`, { method: 'GET' }, 'optional');
    return sortByCreatedAt(comments.map(mapComment));
  },
};

export const userService = {
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await apiRequest<ApiUser>(`/users/${encodeURIComponent(username)}`, { method: 'GET' }, 'optional');
      return mapUser(user);
    } catch (error) {
      if ((error as Error & { status?: number }).status === 404) {
        return undefined;
      }
      throw error;
    }
  },

  async followUser(targetId: string): Promise<void> {
    await apiRequest<{ message: string }>(`/users/${targetId}/follow`, { method: 'POST' }, 'required');
    clearCache('recommended-users');
  },

  async updateProfile(payload: { nickname: string; bio: string; avatar?: string; coverUrl?: string }): Promise<User> {
    const user = await apiRequest<ApiUser>(
      '/users/me',
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      'required',
    );
    return mapUser(user);
  },

  async searchUsers(query: string): Promise<User[]> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery || normalizedQuery.startsWith('#')) {
      return [];
    }

    const users = await apiRequest<ApiUser[]>(
      `/users/search?q=${encodeURIComponent(normalizedQuery)}`,
      { method: 'GET' },
      'optional',
    );

    return users.map(mapUser);
  },

  async getRecommendedUsers(): Promise<User[]> {
    const cached = readCache<User[]>('recommended-users');
    if (cached) {
      return cached;
    }

    const users = await apiRequest<ApiUser[]>('/users/recommended?limit=5', { method: 'GET' }, 'optional');
    const mapped = users.map(mapUser);
    writeCache('recommended-users', mapped);
    return mapped;
  },
};

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    try {
      const items = await apiRequest<Array<{
        id: string;
        type: Notification['type'];
        fromUser: ApiUser;
        postId?: string | null;
        message?: string | null;
        actionLabel?: string | null;
        actionUrl?: string | null;
        createdAt: string;
        read: boolean;
      }>>('/notifications', { method: 'GET' }, 'required');

      return sortByCreatedAt(items.map((item) => ({
        ...item,
        fromUser: mapUser(item.fromUser),
        postId: item.postId || undefined,
        message: item.message || undefined,
        actionLabel: item.actionLabel || undefined,
        actionUrl: item.actionUrl || undefined,
      })));
    } catch (error) {
      if ((error as Error).message === '请先登录') {
        return [];
      }
      throw error;
    }
  },

  async markAsRead(id: string): Promise<void> {
    await apiRequest<{ message: string }>(`/notifications/${id}/read`, { method: 'POST' }, 'required');
  },

  async markAllAsRead(): Promise<void> {
    await apiRequest<{ message: string }>('/notifications/read-all', { method: 'POST' }, 'required');
  },

  async getUnreadCount(): Promise<number> {
    const items = await this.getNotifications();
    return items.filter((item) => !item.read).length;
  },
};

export const topicService = {
  async getTrendingTopics(): Promise<Topic[]> {
    const cached = readCache<Topic[]>('trending-topics');
    if (cached) {
      return cached;
    }

    const topics = await apiRequest<Topic[]>('/topics/trending?limit=6', { method: 'GET' }, 'optional');
    writeCache('trending-topics', topics);
    return topics;
  },
};

export const adminService = {
  async getOverview(): Promise<AdminOverview> {
    return apiRequest<AdminOverview>('/admin/overview', { method: 'GET' }, 'required');
  },

  async getReports(): Promise<AdminReport[]> {
    const reports = await apiRequest<ApiAdminReport[]>('/admin/reports', { method: 'GET' }, 'required');
    return reports.map((item) => ({
      ...item,
      details: item.details || undefined,
      resolvedAt: item.resolvedAt || undefined,
      reporter: mapUser(item.reporter),
      resolvedBy: item.resolvedBy ? mapUser(item.resolvedBy) : undefined,
      post: item.post
        ? {
            ...item.post,
            author: mapUser(item.post.author),
          }
        : undefined,
    }));
  },

  async getUsers(query = '', status = '', muteStatus = ''): Promise<User[]> {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (status) params.set('status', status);
    if (muteStatus) params.set('muteStatus', muteStatus);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const users = await apiRequest<ApiUser[]>(`/admin/users${suffix}`, { method: 'GET' }, 'required');
    return users.map(mapUser);
  },

  async getPosts(query = '', status = ''): Promise<Post[]> {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (status) params.set('status', status);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const posts = await apiRequest<ApiPost[]>(`/admin/posts${suffix}`, { method: 'GET' }, 'required');
    return posts.map(mapPost);
  },

  async getComments(query = ''): Promise<Comment[]> {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const comments = await apiRequest<ApiComment[]>(`/admin/comments${suffix}`, { method: 'GET' }, 'required');
    return comments.map(mapComment);
  },

  async getRecentPosts(limit = 8): Promise<Post[]> {
    const key = `admin:recent-posts:${limit}`;
    const cached = readCache<Post[]>(key);
    if (cached) {
      return cached;
    }

    const posts = await apiRequest<ApiPost[]>(`/admin/posts/recent?limit=${limit}`, { method: 'GET' }, 'required');
    const mapped = posts.map(mapPost);
    writeCache(key, mapped, 20_000);
    return mapped;
  },

  async resolveReport(id: string): Promise<void> {
    await apiRequest<{ message: string }>(`/admin/reports/${id}/resolve`, { method: 'POST' }, 'required');
    clearCacheByPrefix('admin:recent-posts');
  },

  async banUser(id: string, reason: string): Promise<void> {
    await apiRequest<{ message: string }>(
      `/admin/users/${id}/ban`,
      { method: 'POST', body: JSON.stringify({ reason }) },
      'required',
    );
  },

  async unbanUser(id: string, reason: string): Promise<void> {
    await apiRequest<{ message: string }>(
      `/admin/users/${id}/unban`,
      { method: 'POST', body: JSON.stringify({ reason }) },
      'required',
    );
  },

  async muteUser(id: string, reason: string): Promise<void> {
    await apiRequest<{ message: string }>(
      `/admin/users/${id}/mute`,
      { method: 'POST', body: JSON.stringify({ reason }) },
      'required',
    );
  },

  async unmuteUser(id: string, reason: string): Promise<void> {
    await apiRequest<{ message: string }>(
      `/admin/users/${id}/unmute`,
      { method: 'POST', body: JSON.stringify({ reason }) },
      'required',
    );
  },

  async withdrawPost(id: string, reason: string): Promise<void> {
    await apiRequest<{ message: string }>(
      `/admin/posts/${id}/withdraw`,
      { method: 'POST', body: JSON.stringify({ reason }) },
      'required',
    );
    clearCacheByPrefix('admin:recent-posts');
  },

  async deletePost(id: string, reason: string): Promise<void> {
    await apiRequest<{ message: string }>(
      `/admin/posts/${id}`,
      { method: 'DELETE', body: JSON.stringify({ reason }) },
      'required',
    );
    clearCacheByPrefix('admin:recent-posts');
  },

  async deleteComment(id: string, reason: string): Promise<void> {
    await apiRequest<{ message: string }>(
      `/admin/comments/${id}`,
      { method: 'DELETE', body: JSON.stringify({ reason }) },
      'required',
    );
    clearCacheByPrefix('admin:recent-posts');
  },
};

export const authSession = {
  hasToken() {
    return Boolean(getAuthToken());
  },
};
