'use client';

import { useState, useEffect, useCallback } from 'react';
import { TaskWithUsers, User, Category, Comment } from '@/types';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getInternalUsers,
  getClients,
  getCurrentUser,
  addComment,
} from '@/lib/supabase/database';

export function useSupabaseData() {
  const [tasks, setTasks] = useState<TaskWithUsers[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初期データ取得
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tasksData, categoriesData, usersData, clientsData, userData] = await Promise.all([
        getTasks(),
        getCategories(),
        getInternalUsers(),
        getClients(),
        getCurrentUser(),
      ]);
      
      setTasks(tasksData);
      setCategories(categoriesData);
      setUsers(usersData);
      setClients(clientsData);
      setCurrentUser(userData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // タスク操作
  const handleCreateTask = async (task: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee_id?: string;
    category_id?: string;
    due_date?: string;
    tags?: string[];
  }) => {
    if (!currentUser) {
      console.error('Cannot create task: currentUser is null');
      alert('ユーザー情報が取得できません。ページをリロードしてください。');
      return null;
    }
    
    console.log('Creating task with creator_id:', currentUser.id);
    
    const newTask = await createTask({
      ...task,
      creator_id: currentUser.id,
    });
    
    console.log('Created task result:', newTask);
    
    if (newTask) {
      setTasks(prev => [newTask, ...prev]);
    } else {
      alert('タスクの作成に失敗しました。');
    }
    return newTask;
  };

  const handleUpdateTask = async (
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
  ) => {
    const success = await updateTask(id, updates);
    if (success) {
      setTasks(prev => prev.map(t => 
        t.id === id ? { ...t, ...updates } as TaskWithUsers : t
      ));
    }
    return success;
  };

  const handleDeleteTask = async (id: string) => {
    const success = await deleteTask(id);
    if (success) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
    return success;
  };

  const handleReorderTasks = async (taskOrders: { id: string; display_order: number }[]) => {
    // Optimistic update
    setTasks(prev => {
      const updated = [...prev];
      taskOrders.forEach(({ id, display_order }) => {
        const task = updated.find(t => t.id === id);
        if (task) {
          task.display_order = display_order;
        }
      });
      return updated;
    });
    
    await reorderTasks(taskOrders);
  };

  const handleCompleteTask = async (id: string, completed: boolean) => {
    const updates = completed
      ? { status: 'done', completed_at: new Date().toISOString() }
      : { status: 'todo', completed_at: null };
    
    return handleUpdateTask(id, updates);
  };

  // カテゴリー操作
  const handleCreateCategory = async (name: string, color: string) => {
    const newCategory = await createCategory(name, color);
    if (newCategory) {
      setCategories(prev => [...prev, newCategory]);
    }
    return newCategory;
  };

  const handleUpdateCategory = async (id: string, updates: Partial<Pick<Category, 'name' | 'color'>>) => {
    const success = await updateCategory(id, updates);
    if (success) {
      setCategories(prev => prev.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ));
    }
    return success;
  };

  const handleDeleteCategory = async (id: string) => {
    const success = await deleteCategory(id);
    if (success) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
    return success;
  };

  // コメント操作
  const handleAddComment = async (taskId: string, content: string) => {
    if (!currentUser) return null;
    
    const newComment = await addComment(taskId, currentUser.id, content);
    if (newComment) {
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, comments: [...(t.comments || []), newComment] }
          : t
      ));
    }
    return newComment;
  };

  return {
    // データ
    tasks,
    categories,
    users,
    clients,
    currentUser,
    isLoading,
    error,
    
    // タスク操作
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    reorderTasks: handleReorderTasks,
    completeTask: handleCompleteTask,
    
    // カテゴリー操作
    createCategory: handleCreateCategory,
    updateCategory: handleUpdateCategory,
    deleteCategory: handleDeleteCategory,
    
    // コメント操作
    addComment: handleAddComment,
    
    // リフレッシュ
    refresh: fetchData,
  };
}
