'use server';

import { createClient } from '@/lib/supabase/server';
import { TaskWithUsers, User, Category, Comment } from '@/types';

// =============================================
// プロファイル（ユーザー）関連
// =============================================

export async function getProfiles(): Promise<User[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }

  return data.map(profile => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role as 'admin' | 'staff',
    type: profile.type as 'internal' | 'client',
    company: profile.company,
  }));
}

export async function getInternalUsers(): Promise<User[]> {
  const profiles = await getProfiles();
  return profiles.filter(p => p.type === 'internal');
}

export async function getClients(): Promise<User[]> {
  const profiles = await getProfiles();
  return profiles.filter(p => p.type === 'client');
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // プロファイルを取得
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // プロファイルがなければ自動作成
  if (!profile) {
    const newProfile = {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー',
      email: user.email || '',
      role: 'staff',
      type: 'internal',
    };

    const { data: createdProfile, error } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      // プロファイル作成に失敗しても、基本情報で続行
      return {
        id: user.id,
        name: newProfile.name,
        email: newProfile.email,
        role: 'staff' as const,
        type: 'internal' as const,
      };
    }

    profile = createdProfile;
  }

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role as 'admin' | 'staff',
    type: profile.type as 'internal' | 'client',
    company: profile.company,
  };
}

export async function updateProfile(
  userId: string, 
  updates: Partial<Pick<User, 'name' | 'role' | 'type' | 'company'>>
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    return false;
  }
  return true;
}

// =============================================
// カテゴリー関連
// =============================================

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data.map(cat => ({
    id: cat.id,
    name: cat.name,
    color: cat.color,
  }));
}

export async function createCategory(name: string, color: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, color })
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    color: data.color,
  };
}

export async function updateCategory(
  id: string, 
  updates: Partial<Pick<Category, 'name' | 'color'>>
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating category:', error);
    return false;
  }
  return true;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    return false;
  }
  return true;
}

// =============================================
// タスク関連
// =============================================

export async function getTasks(): Promise<TaskWithUsers[]> {
  const supabase = await createClient();
  
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      creator:profiles!tasks_creator_id_fkey(*),
      assignee:profiles!tasks_assignee_id_fkey(*),
      category:categories(*),
      comments(*, user:profiles(*))
    `)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }

  return tasks.map(task => ({
    id: task.id,
    ticket_id: task.ticket_id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    creator_id: task.creator_id,
    creator: task.creator ? {
      id: task.creator.id,
      name: task.creator.name,
      email: task.creator.email,
      role: task.creator.role,
      type: task.creator.type,
      company: task.creator.company,
    } : null!,
    assignee_id: task.assignee_id,
    assignee: task.assignee ? {
      id: task.assignee.id,
      name: task.assignee.name,
      email: task.assignee.email,
      role: task.assignee.role,
      type: task.assignee.type,
      company: task.assignee.company,
    } : undefined,
    category_id: task.category_id,
    category: task.category ? {
      id: task.category.id,
      name: task.category.name,
      color: task.category.color,
    } : undefined,
    due_date: task.due_date,
    tags: task.tags || [],
    display_order: task.display_order,
    created_at: task.created_at,
    updated_at: task.updated_at,
    completed_at: task.completed_at,
    comments: task.comments?.map((c: any) => ({
      id: c.id,
      task_id: c.task_id,
      user_id: c.user_id,
      user: c.user ? {
        id: c.user.id,
        name: c.user.name,
        email: c.user.email,
        role: c.user.role,
        type: c.user.type,
        company: c.user.company,
      } : null!,
      content: c.content,
      created_at: c.created_at,
    })) || [],
  }));
}

export async function createTask(task: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  creator_id: string;
  assignee_id?: string;
  category_id?: string;
  due_date?: string;
  tags?: string[];
}): Promise<TaskWithUsers | null> {
  const supabase = await createClient();
  
  // チケットIDを生成
  const { data: lastTask } = await supabase
    .from('tasks')
    .select('ticket_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let ticketNum = 1;
  if (lastTask?.ticket_id) {
    const match = lastTask.ticket_id.match(/GLUG-(\d+)/);
    if (match) {
      ticketNum = parseInt(match[1], 10) + 1;
    }
  }
  const ticket_id = `GLUG-${String(ticketNum).padStart(4, '0')}`;

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ticket_id,
      title: task.title,
      description: task.description,
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      creator_id: task.creator_id,
      assignee_id: task.assignee_id || null,
      category_id: task.category_id || null,
      due_date: task.due_date || null,
      tags: task.tags || [],
    })
    .select(`
      *,
      creator:profiles!tasks_creator_id_fkey(*),
      assignee:profiles!tasks_assignee_id_fkey(*),
      category:categories(*)
    `)
    .single();

  if (error) {
    console.error('Error creating task:', error);
    return null;
  }

  return {
    id: data.id,
    ticket_id: data.ticket_id,
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    creator_id: data.creator_id,
    creator: data.creator ? {
      id: data.creator.id,
      name: data.creator.name,
      email: data.creator.email,
      role: data.creator.role,
      type: data.creator.type,
      company: data.creator.company,
    } : null!,
    assignee_id: data.assignee_id,
    assignee: data.assignee ? {
      id: data.assignee.id,
      name: data.assignee.name,
      email: data.assignee.email,
      role: data.assignee.role,
      type: data.assignee.type,
      company: data.assignee.company,
    } : undefined,
    category_id: data.category_id,
    category: data.category ? {
      id: data.category.id,
      name: data.category.name,
      color: data.category.color,
    } : undefined,
    due_date: data.due_date,
    tags: data.tags || [],
    display_order: data.display_order,
    created_at: data.created_at,
    updated_at: data.updated_at,
    completed_at: data.completed_at,
    comments: [],
  };
}

export async function updateTask(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    assignee_id: string | null;
    category_id: string | null;
    due_date: string | null;
    tags: string[];
    display_order: number;
    completed_at: string | null;
  }>
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating task:', error);
    return false;
  }
  return true;
}

export async function deleteTask(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting task:', error);
    return false;
  }
  return true;
}

export async function reorderTasks(
  taskOrders: { id: string; display_order: number }[]
): Promise<boolean> {
  const supabase = await createClient();
  
  for (const { id, display_order } of taskOrders) {
    const { error } = await supabase
      .from('tasks')
      .update({ display_order })
      .eq('id', id);
    
    if (error) {
      console.error('Error reordering task:', error);
      return false;
    }
  }
  return true;
}

// =============================================
// コメント関連
// =============================================

export async function addComment(
  taskId: string,
  userId: string,
  content: string
): Promise<Comment | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('comments')
    .insert({
      task_id: taskId,
      user_id: userId,
      content,
    })
    .select('*, user:profiles(*)')
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    return null;
  }

  return {
    id: data.id,
    task_id: data.task_id,
    user_id: data.user_id,
    user: data.user ? {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      type: data.user.type,
      company: data.user.company,
    } : null!,
    content: data.content,
    created_at: data.created_at,
  };
}
