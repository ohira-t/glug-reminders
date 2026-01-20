import { User, TaskWithUsers, Category, KanbanColumn } from '@/types';

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
  { id: 'backlog', title: 'Backlog', color: '#6B7280', tasks: [] },
  { id: 'todo', title: 'Todo', color: '#3B82F6', tasks: [] },
  { id: 'in_progress', title: 'In Progress', color: '#F59E0B', tasks: [] },
  { id: 'done', title: 'Done', color: '#10B981', tasks: [] },
];
