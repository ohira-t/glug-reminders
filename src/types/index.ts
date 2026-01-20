// User roles
export type UserRole = 'admin' | 'staff' | 'client';

// User types (internal = 社内メンバー, client = クライアント)
export type UserType = 'internal' | 'client';

// Task status for Kanban
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done' | 'cancelled';

// Task priority
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

// Category
export interface Category {
  id: string;
  name: string;
  color: string;
}

// User type
export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  type: UserType;       // 社内 or クライアント
  company?: string;     // クライアントの場合は会社名
}

// Task type
export interface Task {
  id: string;
  ticket_id: string; // e.g., "GLUG-001"
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category_id?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  creator_id: string;
  assignee_id?: string;
  completed_at?: string;
  tags?: string[];
}

// Comment type
export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  user: User;
  content: string;
  created_at: string;
}

// Task with user info
export interface TaskWithUsers extends Task {
  creator: User;
  assignee?: User;
  category?: Category;
  comments?: Comment[];
}

// Kanban Column
export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: TaskWithUsers[];
}

// View mode
export type ViewMode = 'board' | 'list';

// Filter options
export interface FilterOptions {
  priority?: TaskPriority[];
  assignee?: string[];
  category?: string[];
  search?: string;
}
