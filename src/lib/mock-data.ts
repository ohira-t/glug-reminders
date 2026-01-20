import { User, TaskWithUsers, Category, KanbanColumn, TaskStatus } from '@/types';

// Current user - 認証から取得するためのダミー（ログイン後は上書きされる）
export const currentUser: User = {
  id: 'user-1',
  name: 'ゲストユーザー',
  email: 'guest@example.com',
  role: 'staff',
  type: 'internal',
};

// 社内メンバー（空から開始）
export const mockUsers: User[] = [];

// クライアント（空から開始）
export const mockClients: User[] = [];

// カテゴリー（空から開始）
export const categories: Category[] = [];

// タスク（空から開始）
export const mockTasks: TaskWithUsers[] = [];

// タグ候補
export const getAllTags = (): string[] => {
  return [];
};

// チケットID生成
let ticketCounter = 1;
export function generateTicketId(): string {
  const id = `GLUG-${String(ticketCounter).padStart(4, '0')}`;
  ticketCounter++;
  return id;
}

// Kanban columns
export const defaultColumns: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog', status: 'backlog' as TaskStatus },
  { id: 'todo', title: 'Todo', status: 'todo' as TaskStatus },
  { id: 'in_progress', title: 'In Progress', status: 'in_progress' as TaskStatus },
  { id: 'done', title: 'Done', status: 'done' as TaskStatus },
];
