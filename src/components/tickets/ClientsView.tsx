'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { TaskWithUsers, User } from '@/types';
import { cn } from '@/lib/utils';

interface ClientsViewProps {
  tasks: TaskWithUsers[];           // アクティブなクライアント向けタスク（全社）
  completedTasks: TaskWithUsers[];  // 完了したクライアント向けタスク（全社）
  clients: User[];
  selectedTaskId: string | null;
  onTaskSelect: (task: TaskWithUsers) => void;
  onCompleteTask: (taskId: string, completed: boolean) => void;
  currentUserId: string;
}

function getDueInfo(dateString?: string): { 
  label: string; 
  isOverdue: boolean; 
  isUrgent: boolean;
} | null {
  if (!dateString) return null;
  
  const due = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[due.getDay()];
  
  if (diff < 0) {
    return { label: `${Math.abs(diff)}日超過`, isOverdue: true, isUrgent: true };
  } else if (diff === 0) {
    return { label: '今日まで', isOverdue: false, isUrgent: true };
  } else if (diff === 1) {
    return { label: '明日まで', isOverdue: false, isUrgent: true };
  } else if (diff <= 7) {
    const m = String(due.getMonth() + 1).padStart(2, '0');
    const d = String(due.getDate()).padStart(2, '0');
    return { 
      label: `${due.getFullYear()}/${m}/${d}（${weekday}）`, 
      isOverdue: false, 
      isUrgent: diff <= 3 
    };
  }
  
  const m = String(due.getMonth() + 1).padStart(2, '0');
  const d = String(due.getDate()).padStart(2, '0');
  return { 
    label: `${due.getFullYear()}/${m}/${d}（${weekday}）`, 
    isOverdue: false, 
    isUrgent: false 
  };
}

interface ClientTaskCardProps {
  task: TaskWithUsers;
  onClick: () => void;
  onComplete: (taskId: string, completed: boolean) => void;
  isSelected: boolean;
  isCurrentUserTask: boolean;
  isCompleted?: boolean;
}

function ClientTaskCard({ 
  task, 
  onClick, 
  onComplete, 
  isSelected, 
  isCurrentUserTask,
  isCompleted = false,
}: ClientTaskCardProps) {
  const dueInfo = getDueInfo(task.due_date);
  const completed = isCompleted || task.status === 'done';

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete(task.id, !completed);
  };

  // 完了タスク（コンパクト表示）
  if (completed) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex items-center gap-3 py-2 px-1 group"
      >
        <button
          onClick={handleCheckboxClick}
          className="w-5 h-5 rounded-full bg-[#34C759] flex items-center justify-center flex-shrink-0 hover:bg-[#30B350] transition-colors"
        >
          <Check className="h-3 w-3 text-white" />
        </button>
        <div className="flex-1 min-w-0" onClick={onClick}>
          <span className="text-sm text-[#8E8E93] line-through cursor-pointer hover:text-[#3C3C43] truncate block">
            {task.title}
          </span>
          <span className="text-[11px] text-[#AEAEB2]">
            {task.creator?.name.split(' ')[0]}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative bg-white rounded-2xl p-4 transition-all",
        isSelected 
          ? "ring-2 ring-[#FF9500] shadow-lg" 
          : "shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
        isCurrentUserTask && "ring-2 ring-[#FF9500]/30"
      )}
    >
      <div className="flex items-start gap-3">
        {/* チェックボックス */}
        <button
          onClick={handleCheckboxClick}
          className="w-5 h-5 rounded-full border-2 border-[#C6C6C8] hover:border-[#FF9500] hover:bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
        />

        {/* タスク内容 */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
          {/* タスク名 */}
          <h3 className="font-semibold text-[15px] text-[#1C1C1E] leading-snug">
            {task.title}
          </h3>

          {/* 依頼者 */}
          <div className="mt-1.5 flex items-center gap-2">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              isCurrentUserTask 
                ? "bg-[#FF9500]/15 text-[#FF9500]" 
                : "bg-[#E5E5EA] text-[#8E8E93]"
            )}>
              {task.creator?.name.split(' ')[0]}
            </span>
            {task.category && (
              <span 
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: `${task.category.color}15`,
                  color: task.category.color,
                }}
              >
                {task.category.name}
              </span>
            )}
          </div>

          {/* 期限 */}
          {dueInfo && (
            <div className="mt-2">
              <span className={cn(
                "text-[13px] font-medium",
                dueInfo.isOverdue && "text-[#FF3B30]",
                dueInfo.isUrgent && !dueInfo.isOverdue && "text-[#FF9500]",
                !dueInfo.isUrgent && !dueInfo.isOverdue && "text-[#8E8E93]"
              )}>
                {dueInfo.label}まで
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ClientsView({ 
  tasks, 
  completedTasks,
  clients, 
  selectedTaskId, 
  onTaskSelect,
  onCompleteTask,
  currentUserId,
}: ClientsViewProps) {
  const [expandedCompleted, setExpandedCompleted] = useState<Record<string, boolean>>({});

  // クライアントごとにタスクをグループ化
  const tasksByClient = useMemo(() => {
    const grouped: { 
      client: User; 
      activeTasks: TaskWithUsers[];
      completedTasks: TaskWithUsers[];
    }[] = [];
    
    clients.forEach(client => {
      const clientActiveTasks = tasks.filter(t => t.assignee_id === client.id);
      const clientCompletedTasks = completedTasks.filter(t => t.assignee_id === client.id);
      
      if (clientActiveTasks.length > 0 || clientCompletedTasks.length > 0) {
        grouped.push({
          client,
          activeTasks: clientActiveTasks.sort((a, b) => {
            if (!a.due_date && !b.due_date) return 0;
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          }),
          completedTasks: clientCompletedTasks.sort((a, b) => {
            if (!a.completed_at && !b.completed_at) return 0;
            if (!a.completed_at) return 1;
            if (!b.completed_at) return -1;
            return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
          }),
        });
      }
    });

    // タスクがあるクライアントをアクティブタスク数で降順ソート
    return grouped.sort((a, b) => b.activeTasks.length - a.activeTasks.length);
  }, [tasks, completedTasks, clients]);

  const toggleCompletedExpanded = (clientId: string) => {
    setExpandedCompleted(prev => ({
      ...prev,
      [clientId]: !prev[clientId],
    }));
  };

  if (tasksByClient.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-[#C6C6C8] mx-auto mb-3" />
          <p className="text-[#8E8E93]">クライアントへの依頼タスクはありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto overflow-y-auto">
      <div className="flex gap-6 p-6 min-w-max h-full">
        {tasksByClient.map((group, index) => (
          <motion.div
            key={group.client.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="w-[320px] flex-shrink-0"
          >
            {/* Client Header - iOS Section Header Style */}
            <div className="flex items-center gap-2.5 mb-4 py-2.5 px-3 border-b border-[#C6C6C8] sticky top-0 bg-[#F2F2F7] z-10 -mx-1 rounded-t-lg">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF9500]/20 to-[#FF9500]/30 flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5 text-[#FF9500]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-[15px] text-[#1C1C1E] truncate">
                  {group.client.company || group.client.name}
                </h2>
                {group.client.company && (
                  <p className="text-[11px] text-[#8E8E93] truncate">{group.client.name}</p>
                )}
              </div>
              <span className="text-[13px] text-[#8E8E93] font-medium flex-shrink-0">
                {group.activeTasks.length}件
              </span>
            </div>

            {/* Active Tasks */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {group.activeTasks.map(task => (
                  <ClientTaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskSelect(task)}
                    onComplete={onCompleteTask}
                    isSelected={selectedTaskId === task.id}
                    isCurrentUserTask={task.creator_id === currentUserId}
                  />
                ))}
              </AnimatePresence>

              {group.activeTasks.length === 0 && (
                <p className="text-center text-[#8E8E93] text-sm py-4">
                  アクティブなタスクはありません
                </p>
              )}

              {/* Completed Tasks Section */}
              {group.completedTasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#C6C6C8]">
                  <button
                    onClick={() => toggleCompletedExpanded(group.client.id)}
                    className="flex items-center gap-2 text-sm text-[#8E8E93] hover:text-[#3C3C43] transition-colors w-full font-medium"
                  >
                    {expandedCompleted[group.client.id] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span>完了済み</span>
                    <span className="text-xs">({group.completedTasks.length})</span>
                  </button>
                  
                  <AnimatePresence>
                    {expandedCompleted[group.client.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 space-y-1 overflow-hidden"
                      >
                        {group.completedTasks.map(task => (
                          <ClientTaskCard
                            key={task.id}
                            task={task}
                            onClick={() => onTaskSelect(task)}
                            onComplete={onCompleteTask}
                            isSelected={selectedTaskId === task.id}
                            isCurrentUserTask={task.creator_id === currentUserId}
                            isCompleted={true}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
            <div className="pb-6" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
