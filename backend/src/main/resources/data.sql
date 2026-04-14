INSERT INTO users (id, username, password, nickname, avatar_url, cover_url, bio, role, status, mute_status, created_at) VALUES
  (1, 'admin', '$2a$10$.K7ZcovHlVYAKBkH3UqdVOWT1PcJmeHFA9iJcaP9mIcG/uK10Bclm', 'HNUST Admin', 'https://picsum.photos/seed/admin/200', 'https://picsum.photos/seed/admin-cover/1200/400', 'Official admin of HNUST Easy WeiBo.', 'ADMIN', 'ACTIVE', 'NORMAL', DATE_SUB(NOW(), INTERVAL 120 DAY)),
  (2, 'johndoe', '$2a$10$.K7ZcovHlVYAKBkH3UqdVOWT1PcJmeHFA9iJcaP9mIcG/uK10Bclm', 'John Doe', 'https://picsum.photos/seed/john/200', 'https://picsum.photos/seed/john-cover/1200/400', 'Just a student at HNUST.', 'USER', 'ACTIVE', 'NORMAL', DATE_SUB(NOW(), INTERVAL 60 DAY)),
  (3, 'janedoe', '$2a$10$.K7ZcovHlVYAKBkH3UqdVOWT1PcJmeHFA9iJcaP9mIcG/uK10Bclm', 'Jane Doe', 'https://picsum.photos/seed/jane/200', 'https://picsum.photos/seed/jane-cover/1200/400', 'Loving life and coding.', 'USER', 'ACTIVE', 'NORMAL', DATE_SUB(NOW(), INTERVAL 30 DAY));

INSERT INTO posts (id, author_id, content, status, likes_count, reposts_count, comments_count, created_at) VALUES
  (1, 1, 'Welcome to HNUST Easy WeiBo! Share your thoughts and connect with others. #HNUST #Welcome', 'ACTIVE', 45, 0, 1, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (2, 2, 'The library is so crowded today! Does anyone know a quiet place to study? 📚', 'ACTIVE', 10, 0, 0, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
  (3, 3, 'Just finished my first React project! It was challenging but fun. 💻✨ #Coding #React', 'ACTIVE', 88, 0, 0, DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO post_images (post_id, image_url) VALUES
  (1, 'https://picsum.photos/seed/campus/800/400'),
  (3, 'https://picsum.photos/seed/code/800/400'),
  (3, 'https://picsum.photos/seed/react/800/400');

INSERT INTO comments (post_id, author_id, content, likes_count, created_at) VALUES
  (1, 2, 'Great to be here!', 2, DATE_SUB(NOW(), INTERVAL 1 HOUR));

INSERT INTO follows (follower_id, following_id, created_at) VALUES
  (2, 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (3, 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (1, 2, DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO post_likes (post_id, user_id, created_at) VALUES
  (1, 2, DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
  (1, 3, DATE_SUB(NOW(), INTERVAL 80 MINUTE)),
  (3, 1, DATE_SUB(NOW(), INTERVAL 12 HOUR));

INSERT INTO bookmarks (post_id, user_id, created_at) VALUES
  (1, 1, DATE_SUB(NOW(), INTERVAL 70 MINUTE)),
  (3, 1, DATE_SUB(NOW(), INTERVAL 10 HOUR));

INSERT INTO reposts (post_id, user_id, created_at) VALUES
  (1, 3, DATE_SUB(NOW(), INTERVAL 55 MINUTE));

INSERT INTO notifications (type, recipient_id, actor_id, post_id, message, action_label, action_url, is_read, created_at) VALUES
  ('like', 1, 2, 1, NULL, NULL, NULL, FALSE, DATE_SUB(NOW(), INTERVAL 50 MINUTE)),
  ('comment', 1, 2, 1, NULL, NULL, NULL, TRUE, DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
  ('follow', 1, 3, NULL, NULL, NULL, NULL, TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY));
