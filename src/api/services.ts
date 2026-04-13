import { User, Post, Comment, Notification, Topic } from '../types';
import { MOCK_USERS, MOCK_POSTS, MOCK_COMMENTS, MOCK_NOTIFICATIONS, MOCK_TOPICS } from './mockData';

// In-memory state
let users = [...MOCK_USERS];
let posts = [...MOCK_POSTS];
let comments = [...MOCK_COMMENTS];
let notifications = [...MOCK_NOTIFICATIONS];
let topics = [...MOCK_TOPICS];

export const postService = {
  getPosts: async (): Promise<Post[]> => {
    return [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  getPostById: async (id: string): Promise<Post | undefined> => {
    return posts.find(p => p.id === id);
  },
  createPost: async (author: User, content: string, images?: string[]): Promise<Post> => {
    const newPost: Post = {
      id: `p${Date.now()}`,
      authorId: author.id,
      author,
      content,
      images,
      createdAt: new Date().toISOString(),
      likesCount: 0,
      commentsCount: 0,
      tags: content.match(/#[^\s#]+/g)?.map(t => t.slice(1)) || [],
    };
    posts = [newPost, ...posts];
    return newPost;
  },
  likePost: async (postId: string, userId: string): Promise<void> => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      if (post.isLiked) {
        post.likesCount--;
        post.isLiked = false;
      } else {
        post.likesCount++;
        post.isLiked = true;
      }
    }
  },
  bookmarkPost: async (postId: string): Promise<void> => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      post.isBookmarked = !post.isBookmarked;
    }
  },
  getPostsByAuthor: async (authorId: string): Promise<Post[]> => {
    return posts.filter(p => p.authorId === authorId);
  },
  getPostsByTag: async (tag: string): Promise<Post[]> => {
    return posts.filter(p => p.tags?.includes(tag));
  },
  searchPosts: async (query: string): Promise<Post[]> => {
    const lowerQuery = query.toLowerCase();
    return posts.filter(p => 
      p.content.toLowerCase().includes(lowerQuery) || 
      p.author.nickname.toLowerCase().includes(lowerQuery)
    );
  }
};

export const commentService = {
  getCommentsByPostId: async (postId: string): Promise<Comment[]> => {
    return comments.filter(c => c.postId === postId);
  },
  addComment: async (postId: string, author: User, content: string): Promise<Comment> => {
    const newComment: Comment = {
      id: `c${Date.now()}`,
      postId,
      authorId: author.id,
      author,
      content,
      createdAt: new Date().toISOString(),
      likesCount: 0,
    };
    comments = [...comments, newComment];
    const post = posts.find(p => p.id === postId);
    if (post) post.commentsCount++;
    return newComment;
  }
};

export const userService = {
  getUserById: async (id: string): Promise<User | undefined> => {
    return users.find(u => u.id === id);
  },
  getUserByUsername: async (username: string): Promise<User | undefined> => {
    return users.find(u => u.username === username);
  },
  followUser: async (followerId: string, targetId: string): Promise<void> => {
    const target = users.find(u => u.id === targetId);
    if (target) {
      if (target.isFollowing) {
        target.followersCount--;
        target.isFollowing = false;
      } else {
        target.followersCount++;
        target.isFollowing = true;
      }
    }
  },
  getRecommendedUsers: async (): Promise<User[]> => {
    return users.slice(0, 3);
  }
};

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    return [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  markAsRead: async (id: string): Promise<void> => {
    const notification = notifications.find(n => n.id === id);
    if (notification) notification.read = true;
  },
  getUnreadCount: async (): Promise<number> => {
    return notifications.filter(n => !n.read).length;
  }
};

export const topicService = {
  getTrendingTopics: async (): Promise<Topic[]> => {
    return topics.sort((a, b) => b.postCount - a.postCount);
  }
};
