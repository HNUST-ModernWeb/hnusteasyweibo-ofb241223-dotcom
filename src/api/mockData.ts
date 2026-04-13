import { User, Post, Comment, Notification, Topic } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    nickname: 'HNUST Admin',
    avatar: 'https://picsum.photos/seed/admin/200',
    bio: 'Official admin of HNUST Easy WeiBo.',
    followersCount: 1200,
    followingCount: 50,
  },
  {
    id: '2',
    username: 'johndoe',
    nickname: 'John Doe',
    avatar: 'https://picsum.photos/seed/john/200',
    bio: 'Just a student at HNUST.',
    followersCount: 150,
    followingCount: 200,
  },
  {
    id: '3',
    username: 'janedoe',
    nickname: 'Jane Doe',
    avatar: 'https://picsum.photos/seed/jane/200',
    bio: 'Loving life and coding.',
    followersCount: 300,
    followingCount: 100,
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    authorId: '1',
    author: MOCK_USERS[0],
    content: 'Welcome to HNUST Easy WeiBo! Share your thoughts and connect with others. #HNUST #Welcome',
    images: ['https://picsum.photos/seed/campus/800/400'],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    likesCount: 45,
    commentsCount: 12,
    tags: ['HNUST', 'Welcome'],
  },
  {
    id: 'p2',
    authorId: '2',
    author: MOCK_USERS[1],
    content: 'The library is so crowded today! Does anyone know a quiet place to study? 📚',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    likesCount: 10,
    commentsCount: 5,
  },
  {
    id: 'p3',
    authorId: '3',
    author: MOCK_USERS[2],
    content: 'Just finished my first React project! It was challenging but fun. 💻✨ #Coding #React',
    images: ['https://picsum.photos/seed/code/800/400', 'https://picsum.photos/seed/react/800/400'],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    likesCount: 88,
    commentsCount: 20,
    tags: ['Coding', 'React'],
  }
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    postId: 'p1',
    authorId: '2',
    author: MOCK_USERS[1],
    content: 'Great to be here!',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    likesCount: 2,
  }
];

export const MOCK_TOPICS: Topic[] = [
  { id: 't1', name: 'HNUST', postCount: 1200 },
  { id: 't2', name: 'Coding', postCount: 850 },
  { id: 't3', name: 'CampusLife', postCount: 640 },
  { id: 't4', name: 'React', postCount: 430 },
  { id: 't5', name: 'Vite', postCount: 210 },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'like',
    fromUser: MOCK_USERS[1],
    postId: 'p1',
    createdAt: new Date(Date.now() - 600000).toISOString(),
    read: false,
  },
  {
    id: 'n2',
    type: 'follow',
    fromUser: MOCK_USERS[2],
    createdAt: new Date(Date.now() - 1200000).toISOString(),
    read: true,
  }
];
