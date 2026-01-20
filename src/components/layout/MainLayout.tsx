'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Header, TaskViewMode } from '@/components/tickets/Header';
import { MyTasksView } from '@/components/tickets/MyTasksView';
import { RequestedTasksView } from '@/components/tickets/RequestedTasksView';
import { ClientsView } from '@/components/tickets/ClientsView';
import { TicketDetail, EditData } from '@/components/tickets/TicketDetail';
import { AddTaskModal, NewTaskData } from '@/components/tickets/AddTaskModal';
import { SettingsModal } from '@/components/tickets/SettingsModal';
import { TaskWithUsers, TaskStatus, Category, User } from '@/types';
import { Loader2 } from 'lucide-react';

export function MainLayout() {
  const { signOut } = useAuth();
  const {
    tasks,
    categories,
    users,
    clients,
    currentUser,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    addComment,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderTasks,
    refresh,
  } = useSupabaseData();

  const [viewMode, setViewMode] = useState<TaskViewMode>('my_tasks');
  const [selectedTask, setSelectedTask] = useState<TaskWithUsers | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [preSelectedCategoryId, setPreSelectedCategoryId] = useState<string | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // カテゴリー、社内メンバー、クライアントをローカル状態で管理（設定モーダル用）
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [localClients, setLocalClients] = useState<User[]>([]);

  // Supabaseデータが変わったらローカル状態を更新
  useMemo(() => {
    setLocalCategories(categories);
    setLocalUsers(users);
    setLocalClients(clients);
  }, [categories, users, clients]);
  
  // 全ユーザー（社内 + クライアント）
  const allUsers = useMemo(() => [...users, ...clients], [users, clients]);

  // ダミーユーザー（ログイン前のフォールバック）
  const displayUser: User = currentUser || {
    id: 'guest',
    name: 'ゲスト',
    email: 'guest@example.com',
    role: 'staff',
    type: 'internal',
  };

  // 自分が担当のタスク（自分宛の依頼 + 自分で作った自分用タスク）- アクティブ
  const myActiveTasks = useMemo(() => {
    if (!currentUser) return [];
    return tasks.filter(t => 
      t.assignee_id === currentUser.id && 
      t.status !== 'done' && 
      t.status !== 'cancelled'
    );
  }, [tasks, currentUser]);

  // 自分が担当のタスク - 完了済み
  const myCompletedTasks = useMemo(() => {
    if (!currentUser) return [];
    return tasks.filter(t => 
      t.assignee_id === currentUser.id && 
      t.status === 'done'
    );
  }, [tasks, currentUser]);

  // 自分が依頼したタスク（他の人に割り当てたもの）- アクティブ
  const requestedTasks = useMemo(() => {
    if (!currentUser) return [];
    return tasks.filter(t => 
      t.creator_id === currentUser.id && 
      t.assignee_id && 
      t.assignee_id !== currentUser.id &&
      t.status !== 'done' && 
      t.status !== 'cancelled'
    );
  }, [tasks, currentUser]);

  // 自分が依頼したタスク - 完了済み
  const requestedCompletedTasks = useMemo(() => {
    if (!currentUser) return [];
    return tasks.filter(t => 
      t.creator_id === currentUser.id && 
      t.assignee_id && 
      t.assignee_id !== currentUser.id &&
      t.status === 'done'
    );
  }, [tasks, currentUser]);

  // 検索フィルタリング
  const filteredMyTasks = useMemo(() => {
    if (!searchQuery.trim()) return myActiveTasks;
    const query = searchQuery.toLowerCase();
    return myActiveTasks.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      t.creator?.name.toLowerCase().includes(query) ||
      t.category?.name.toLowerCase().includes(query)
    );
  }, [myActiveTasks, searchQuery]);

  const filteredMyCompletedTasks = useMemo(() => {
    if (!searchQuery.trim()) return myCompletedTasks;
    const query = searchQuery.toLowerCase();
    return myCompletedTasks.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      t.creator?.name.toLowerCase().includes(query) ||
      t.category?.name.toLowerCase().includes(query)
    );
  }, [myCompletedTasks, searchQuery]);

  const filteredRequestedTasks = useMemo(() => {
    if (!searchQuery.trim()) return requestedTasks;
    const query = searchQuery.toLowerCase();
    return requestedTasks.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      t.assignee?.name.toLowerCase().includes(query) ||
      t.category?.name.toLowerCase().includes(query)
    );
  }, [requestedTasks, searchQuery]);

  const filteredRequestedCompletedTasks = useMemo(() => {
    if (!searchQuery.trim()) return requestedCompletedTasks;
    const query = searchQuery.toLowerCase();
    return requestedCompletedTasks.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      t.assignee?.name.toLowerCase().includes(query) ||
      t.category?.name.toLowerCase().includes(query)
    );
  }, [requestedCompletedTasks, searchQuery]);

  // クライアント向けタスク（全社）- アクティブ
  const clientActiveTasks = useMemo(() => {
    const clientIds = clients.map(c => c.id);
    return tasks.filter(t => 
      t.assignee_id && 
      clientIds.includes(t.assignee_id) &&
      t.status !== 'done' && 
      t.status !== 'cancelled'
    );
  }, [tasks, clients]);

  // クライアント向けタスク（全社）- 完了済み
  const clientCompletedTasks = useMemo(() => {
    const clientIds = clients.map(c => c.id);
    return tasks.filter(t => 
      t.assignee_id && 
      clientIds.includes(t.assignee_id) &&
      t.status === 'done'
    );
  }, [tasks, clients]);

  // クライアント向けタスクのフィルタリング
  const filteredClientTasks = useMemo(() => {
    if (!searchQuery.trim()) return clientActiveTasks;
    const query = searchQuery.toLowerCase();
    return clientActiveTasks.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      t.creator?.name.toLowerCase().includes(query) ||
      t.assignee?.name.toLowerCase().includes(query) ||
      t.assignee?.company?.toLowerCase().includes(query) ||
      t.category?.name.toLowerCase().includes(query)
    );
  }, [clientActiveTasks, searchQuery]);

  const filteredClientCompletedTasks = useMemo(() => {
    if (!searchQuery.trim()) return clientCompletedTasks;
    const query = searchQuery.toLowerCase();
    return clientCompletedTasks.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      t.creator?.name.toLowerCase().includes(query) ||
      t.assignee?.name.toLowerCase().includes(query) ||
      t.assignee?.company?.toLowerCase().includes(query) ||
      t.category?.name.toLowerCase().includes(query)
    );
  }, [clientCompletedTasks, searchQuery]);

  // 全タグを取得（タスクから抽出）
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach(t => {
      t.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [tasks]);

  // Handle task selection
  const handleTaskSelect = (task: TaskWithUsers) => {
    setSelectedTask(task);
  };

  // Handle status change
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const completed = newStatus === 'done';
    await completeTask(taskId, completed);

    // Update selected task if it's the one being changed
    if (selectedTask?.id === taskId) {
      if (newStatus === 'done' || newStatus === 'cancelled') {
        setSelectedTask(null);
      }
    }
  };

  // Handle complete task (checkbox toggle)
  const handleCompleteTask = async (taskId: string, completed: boolean) => {
    await completeTask(taskId, completed);

    // Update selected task if it's the one being changed
    if (selectedTask?.id === taskId) {
      const updatedTask = tasks.find(t => t.id === taskId);
      if (updatedTask) {
        setSelectedTask({
          ...updatedTask,
          status: completed ? 'done' : 'todo',
          completed_at: completed ? new Date().toISOString() : undefined,
        });
      }
    }
  };

  // Handle add new task
  const handleAddTask = async (data: NewTaskData) => {
    const newTask = await createTask({
      title: data.title,
      description: data.description,
      priority: data.priority,
      assignee_id: data.assignee_id || currentUser?.id,
      category_id: data.category_id,
      due_date: data.due_date?.toISOString(),
      tags: data.tags,
    });
    
    if (newTask) {
      setIsAddModalOpen(false);
    }
  };

  // Handle save task (inline edit)
  const handleSaveTask = async (taskId: string, data: EditData) => {
    await updateTask(taskId, {
      title: data.title,
      description: data.description,
      assignee_id: data.assignee_id || currentUser?.id || null,
      category_id: data.category_id || null,
      priority: data.priority,
      due_date: data.due_date?.toISOString() || null,
      tags: data.tags,
    });

    // Refresh to get updated data with relations
    await refresh();
    
    // Update selected task
    if (selectedTask?.id === taskId) {
      const updatedTask = tasks.find(t => t.id === taskId);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  };

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  // Handle add comment
  const handleAddComment = async (taskId: string, content: string) => {
    const newComment = await addComment(taskId, content);
    
    if (newComment && selectedTask?.id === taskId) {
      setSelectedTask({
        ...selectedTask,
        comments: [...(selectedTask.comments || []), newComment],
      });
    }
  };

  // Handle category changes from settings modal
  const handleCategoriesChange = async (newCategories: Category[]) => {
    // 新しく追加されたカテゴリーを作成
    for (const cat of newCategories) {
      const exists = categories.find(c => c.id === cat.id);
      if (!exists) {
        await createCategory(cat.name, cat.color);
      }
    }
    
    // 削除されたカテゴリーを削除
    for (const cat of categories) {
      const exists = newCategories.find(c => c.id === cat.id);
      if (!exists) {
        await deleteCategory(cat.id);
      }
    }
    
    // 更新されたカテゴリーを更新
    for (const cat of newCategories) {
      const original = categories.find(c => c.id === cat.id);
      if (original && (original.name !== cat.name || original.color !== cat.color)) {
        await updateCategory(cat.id, { name: cat.name, color: cat.color });
      }
    }
    
    await refresh();
  };

  // ローディング表示
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F2F2F7]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#007AFF] mx-auto mb-4" />
          <p className="text-[#8E8E93]">読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F2F2F7]">
        <div className="text-center">
          <p className="text-[#FF3B30] mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-[#007AFF] text-white rounded-lg hover:bg-[#007AFF]/90"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F2F2F7]">
      {/* Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        user={displayUser}
        myTasksCount={myActiveTasks.length}
        requestedCount={requestedTasks.length}
        clientsCount={clientActiveTasks.length}
        onAddTask={() => {
          setPreSelectedCategoryId(undefined);
          setIsAddModalOpen(true);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSignOut={signOut}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Task Views */}
        {viewMode === 'my_tasks' && (
          <MyTasksView
            tasks={filteredMyTasks}
            completedTasks={filteredMyCompletedTasks}
            categories={categories}
            selectedTaskId={selectedTask?.id || null}
            onTaskSelect={handleTaskSelect}
            onAddTask={(categoryId) => {
              setPreSelectedCategoryId(categoryId);
              setIsAddModalOpen(true);
            }}
            onCompleteTask={handleCompleteTask}
          />
        )}
        {viewMode === 'requested' && (
          <RequestedTasksView
            tasks={filteredRequestedTasks}
            allTasks={tasks}
            users={allUsers}
            selectedTaskId={selectedTask?.id || null}
            onTaskSelect={handleTaskSelect}
            currentUserId={displayUser.id}
          />
        )}
        {viewMode === 'clients' && (
          <ClientsView
            tasks={filteredClientTasks}
            completedTasks={filteredClientCompletedTasks}
            clients={clients}
            selectedTaskId={selectedTask?.id || null}
            onTaskSelect={handleTaskSelect}
            onCompleteTask={handleCompleteTask}
            currentUserId={displayUser.id}
          />
        )}
      </div>

      {/* Task Detail Modal */}
      <TicketDetail
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusChange={handleStatusChange}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onAddComment={handleAddComment}
        currentUser={displayUser}
        users={allUsers}
        categories={categories}
        onPrev={() => {
          const currentTasks = viewMode === 'my_tasks' ? filteredMyTasks : filteredRequestedTasks;
          const currentIndex = currentTasks.findIndex(t => t.id === selectedTask?.id);
          if (currentIndex > 0) {
            setSelectedTask(currentTasks[currentIndex - 1]);
          }
        }}
        onNext={() => {
          const currentTasks = viewMode === 'my_tasks' ? filteredMyTasks : filteredRequestedTasks;
          const currentIndex = currentTasks.findIndex(t => t.id === selectedTask?.id);
          if (currentIndex < currentTasks.length - 1) {
            setSelectedTask(currentTasks[currentIndex + 1]);
          }
        }}
        hasPrev={(() => {
          const currentTasks = viewMode === 'my_tasks' ? filteredMyTasks : filteredRequestedTasks;
          const currentIndex = currentTasks.findIndex(t => t.id === selectedTask?.id);
          return currentIndex > 0;
        })()}
        hasNext={(() => {
          const currentTasks = viewMode === 'my_tasks' ? filteredMyTasks : filteredRequestedTasks;
          const currentIndex = currentTasks.findIndex(t => t.id === selectedTask?.id);
          return currentIndex < currentTasks.length - 1;
        })()}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddTask}
        internalUsers={users}
        clients={clients}
        categories={categories}
        tags={allTags}
        currentUserId={displayUser.id}
        defaultCategoryId={preSelectedCategoryId}
      />

      {/* Settings Modal */}
      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        categories={localCategories}
        internalUsers={localUsers}
        clients={localClients}
        onCategoriesChange={handleCategoriesChange}
        onInternalUsersChange={setLocalUsers}
        onClientsChange={setLocalClients}
        currentUserId={displayUser.id}
        onRefresh={refresh}
      />
    </div>
  );
}
