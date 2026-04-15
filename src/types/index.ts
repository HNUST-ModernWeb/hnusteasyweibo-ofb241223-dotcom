export interface User {
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
}

export interface Post {
  id: string;
  authorId: string;
  author: User;
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
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system';
  fromUser: User;
  postId?: string;
  message?: string;
  actionLabel?: string;
  actionUrl?: string;
  createdAt: string;
  read: boolean;
}

export interface Topic {
  id: string;
  name: string;
  postCount: number;
}

export type ReportCategory = 'spam' | 'abuse' | 'misinformation' | 'copyright' | 'other';

export interface AdminOverview {
  usersCount: number;
  postsCount: number;
  commentsCount: number;
  openReportsCount: number;
}

export interface AdminReportPost {
  id: string;
  content: string;
  status: 'ACTIVE' | 'WITHDRAWN' | 'DELETED';
  createdAt: string;
  author: User;
}

export interface AdminReport {
  id: string;
  category: ReportCategory;
  details?: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
  reporter: User;
  resolvedBy?: User;
  post?: AdminReportPost;
}

export interface AiConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  preview: string;
}

export type AiModelId =
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro';

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  model: AiModelId;
}
