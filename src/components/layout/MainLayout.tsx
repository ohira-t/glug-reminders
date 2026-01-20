'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Header, TaskViewMode } from '@/components/tickets/Header';
import { MyTasksView } from '@/components/tickets/MyTasksView';
import { RequestedTasksView } from '@/components/tickets/RequestedTasksView';
import { ClientsView } from '@/components/tickets/ClientsView';
import { TicketDetail, EditData } from '@/components/tickets/TicketDetail';
import { AddTaskModal, NewTaskData } from '@/components/tickets/AddTaskModal';
import { SettingsModal } from '@/components/tickets/SettingsModal';
import { 
  mockTasks, 
  mockUsers,
  mockClients,
  currentUser, 
  categories as initialCategories,
  getAllTags,
  generateTicketId,
} from '@/lib/mock-data';
import { TaskWithUsers, TaskStatus, Category, User } from '@/types';

export function MainLayout() {
  const { signOut } = useAuth();
  const [viewMode, setViewMode] = useState<TaskViewMode>('my_tasks');
  const [selectedTask, setSelectedTask] = useState<TaskWithUsers | null>(null);
  const [tasks, setTasks] = useState<TaskWithUsers[]>(mockTasks);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [preSelectedCategoryId, setPreSelectedCategoryId] = useState<string | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // カテゴリー、社内メンバー、クライアントを状態管理
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [internalUsers, setInternalUsers] = useState<User[]>(mockUsers);
  const [clients, setClients] = useState<User[]>(mockClients);
  
  // 全ユーザー（社内 + クライアント）
  const allUsers = useMemo(() => [...internalUsers, ...clients], [internalUsers, clients]);

  // 自分が担当のタスク（自分宛の依頼 + 自分で作った自分用タスク）- アクティブ
  const myActiveTasks = useMemo(() => {
    return tasks.filter(t => 
      t.assignee_id === currentUser.id && 
      t.status !== 'done' && 
      t.status !== 'cancelled'
    );
  }, [tasks]);

  // 自分が担当のタスク - 完了済み
  const myCompletedTasks = useMemo(() => {
    return tasks.filter(t => 
      t.assignee_id === currentUser.id && 
      t.status === 'done'
    );
  }, [tasks]);

  // 自分が依頼したタスク（他の人に割り当てたもの）- アクティブ
  const requestedTasks = useMemo(() => {
    return tasks.filter(t => 
      t.creator_id === currentUser.id && 
      t.assignee_id && 
      t.assignee_id !== currentUser.id &&
      t.status !== 'done' && 
      t.status !== 'cancelled'
    );
  }, [tasks]);

  // 自分が依頼したタスク - 完了済み
  const requestedCompletedTasks = useMemo(() => {
    return tasks.filter(t => 
      t.creator_id === currentUser.id && 
      t.assignee_id && 
      t.assignee_id !== currentUser.id &&
      t.status === 'done'
    );
  }, [tasks]);

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

  // 全タグを取得
  const allTags = useMemo(() => getAllTags(), []);

  // Handle task selection
  const handleTaskSelect = (task: TaskWithUsers) => {
    setSelectedTask(task);
  };

  // Handle status change
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: newStatus,
          updated_at: new Date().toISOString(),
          completed_at: newStatus === 'done' ? new Date().toISOString() : undefined,
        };
      }
      return task;
    }));

    // Update selected task if it's the one being changed
    if (selectedTask?.id === taskId) {
      if (newStatus === 'done' || newStatus === 'cancelled') {
        setSelectedTask(null);
      } else {
        setSelectedTask(prev => prev ? {
          ...prev,
          status: newStatus,
          updated_at: new Date().toISOString(),
        } : null);
      }
    }
  };

  // Handle complete task (checkbox toggle)
  const handleCompleteTask = (taskId: string, completed: boolean) => {
    const newStatus: TaskStatus = completed ? 'done' : 'todo';
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: newStatus,
          updated_at: new Date().toISOString(),
          completed_at: completed ? new Date().toISOString() : undefined,
        };
      }
      return task;
    }));

    // Update selected task if it's the one being changed
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? {
        ...prev,
        status: newStatus,
        updated_at: new Date().toISOString(),
        completed_at: completed ? new Date().toISOString() : undefined,
      } : null);
    }
  };

  // Handle add new task
  const handleAddTask = (data: NewTaskData) => {
    const assignee = data.assignee_id 
      ? allUsers.find(u => u.id === data.assignee_id)
      : allUsers.find(u => u.id === currentUser.id);
    
    const category = data.category_id
      ? categories.find(c => c.id === data.category_id)
      : undefined;

    const newTask: TaskWithUsers = {
      id: `task-${Date.now()}`,
      ticket_id: generateTicketId(),
      title: data.title,
      description: data.description,
      status: 'todo',
      priority: data.priority,
      category_id: data.category_id,
      due_date: data.due_date?.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator_id: currentUser.id,
      assignee_id: data.assignee_id || currentUser.id,
      creator: currentUser,
      assignee: assignee,
      category: category,
      tags: data.tags,
    };

    setTasks(prev => [newTask, ...prev]);
  };

  // Handle save task (inline edit)
  const handleSaveTask = (taskId: string, data: EditData) => {
    const assignee = data.assignee_id 
      ? allUsers.find(u => u.id === data.assignee_id)
      : allUsers.find(u => u.id === currentUser.id);
    
    const category = data.category_id
      ? categories.find(c => c.id === data.category_id)
      : undefined;

    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updated = {
          ...task,
          title: data.title,
          description: data.description,
          assignee_id: data.assignee_id || currentUser.id,
          assignee: assignee,
          category_id: data.category_id,
          category: category,
          priority: data.priority,
          due_date: data.due_date?.toISOString(),
          tags: data.tags,
          updated_at: new Date().toISOString(),
        };
        
        // Update selected task if it's the one being edited
        if (selectedTask?.id === taskId) {
          setSelectedTask(updated);
        }
        
        return updated;
      }
      return task;
    }));
  };

  // Handle delete task
  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  // Handle add comment
  const handleAddComment = (taskId: string, content: string) => {
    const newComment = {
      id: `comment-${Date.now()}`,
      task_id: taskId,
      user_id: currentUser.id,
      user: currentUser,
      content,
      created_at: new Date().toISOString(),
    };

    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updated = {
          ...task,
          comments: [...(task.comments || []), newComment],
          updated_at: new Date().toISOString(),
        };
        
        // Update selected task if it's the one being commented on
        if (selectedTask?.id === taskId) {
          setSelectedTask(updated);
        }
        
        return updated;
      }
      return task;
    }));
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        user={currentUser}
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
            currentUserId={currentUser.id}
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
            currentUserId={currentUser.id}
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
        currentUser={currentUser}
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
        internalUsers={internalUsers}
        clients={clients}
        categories={categories}
        tags={allTags}
        currentUserId={currentUser.id}
        defaultCategoryId={preSelectedCategoryId}
      />

      {/* Settings Modal */}
      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        categories={categories}
        internalUsers={internalUsers}
        clients={clients}
        onCategoriesChange={setCategories}
        onInternalUsersChange={setInternalUsers}
        onClientsChange={setClients}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
