'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTaskCard } from './SortableTaskCard';
import { TaskCard } from './TaskCard';
import { TaskWithUsers, Category } from '@/types';

interface MyTasksViewProps {
  tasks: TaskWithUsers[];
  completedTasks: TaskWithUsers[];
  categories: Category[];
  selectedTaskId: string | null;
  onTaskSelect: (task: TaskWithUsers) => void;
  onAddTask: (categoryId?: string) => void;
  onCompleteTask: (taskId: string, completed: boolean) => void;
  onReorderTasks?: (categoryId: string, taskIds: string[]) => void;
}

export function MyTasksView({ 
  tasks, 
  completedTasks,
  categories, 
  selectedTaskId, 
  onTaskSelect, 
  onAddTask,
  onCompleteTask,
  onReorderTasks,
}: MyTasksViewProps) {
  // クライアントサイドでのみDnDを有効化（ハイドレーションエラー回避）
  const [isMounted, setIsMounted] = useState(false);
  // 完了タスクの展開状態（カテゴリーごと）
  const [expandedCompleted, setExpandedCompleted] = useState<Record<string, boolean>>({});
  // ドラッグ中のタスク
  const [activeTask, setActiveTask] = useState<TaskWithUsers | null>(null);
  // カテゴリーごとのタスク順序を管理
  const [taskOrder, setTaskOrder] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // カテゴリーごとにタスクをグループ化
  const tasksByCategory = useMemo(() => {
    const grouped: { 
      category: { id: string; name: string; color: string }; 
      activeTasks: TaskWithUsers[];
      completedTasks: TaskWithUsers[];
    }[] = [];
    
    // カテゴリーごとにグループ化
    categories.forEach(cat => {
      const catActiveTasks = tasks.filter(t => t.category_id === cat.id);
      const catCompletedTasks = completedTasks.filter(t => t.category_id === cat.id);
      
      if (catActiveTasks.length > 0 || catCompletedTasks.length > 0) {
        // カスタム順序があればそれを使用、なければ納期順
        const order = taskOrder[cat.id];
        let sortedActiveTasks: TaskWithUsers[];
        
        if (order && order.length > 0) {
          // カスタム順序でソート
          sortedActiveTasks = [...catActiveTasks].sort((a, b) => {
            const indexA = order.indexOf(a.id);
            const indexB = order.indexOf(b.id);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
        } else {
          // デフォルト: 納期順
          sortedActiveTasks = catActiveTasks.sort((a, b) => {
            if (!a.due_date && !b.due_date) return 0;
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          });
        }
        
        grouped.push({
          category: cat,
          activeTasks: sortedActiveTasks,
          completedTasks: catCompletedTasks.sort((a, b) => {
            if (!a.completed_at && !b.completed_at) return 0;
            if (!a.completed_at) return 1;
            if (!b.completed_at) return -1;
            return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
          }),
        });
      }
    });

    // 未分類のタスク
    const uncategorizedActive = tasks.filter(t => !t.category_id);
    const uncategorizedCompleted = completedTasks.filter(t => !t.category_id);
    
    if (uncategorizedActive.length > 0 || uncategorizedCompleted.length > 0) {
      const order = taskOrder['uncategorized'];
      let sortedActiveTasks: TaskWithUsers[];
      
      if (order && order.length > 0) {
        sortedActiveTasks = [...uncategorizedActive].sort((a, b) => {
          const indexA = order.indexOf(a.id);
          const indexB = order.indexOf(b.id);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
      } else {
        sortedActiveTasks = uncategorizedActive.sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
      }
      
      grouped.push({
        category: { id: 'uncategorized', name: '未分類', color: '#94a3b8' },
        activeTasks: sortedActiveTasks,
        completedTasks: uncategorizedCompleted,
      });
    }

    return grouped;
  }, [tasks, completedTasks, categories, taskOrder]);

  const toggleCompletedExpanded = (categoryId: string) => {
    setExpandedCompleted(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    // どのカテゴリーのタスクかを特定
    const activeTask = tasks.find(t => t.id === active.id);
    const overTask = tasks.find(t => t.id === over.id);

    if (!activeTask || !overTask) return;

    // 同じカテゴリー内でのみ並び替え
    const categoryId = activeTask.category_id || 'uncategorized';
    if (categoryId !== (overTask.category_id || 'uncategorized')) return;

    // そのカテゴリーのタスクを取得
    const group = tasksByCategory.find(g => g.category.id === categoryId);
    if (!group) return;

    const oldIndex = group.activeTasks.findIndex(t => t.id === active.id);
    const newIndex = group.activeTasks.findIndex(t => t.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(
        group.activeTasks.map(t => t.id),
        oldIndex,
        newIndex
      );
      
      setTaskOrder(prev => ({
        ...prev,
        [categoryId]: newOrder,
      }));

      // 親コンポーネントに通知
      onReorderTasks?.(categoryId, newOrder);
    }
  };

  if (tasksByCategory.length === 0) {
    return (
      <div className="h-full flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="text-center">
          <Folder className="h-12 w-12 text-[#C6C6C8] mx-auto mb-3" />
          <p className="text-[#8E8E93]">担当タスクはありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto overflow-y-auto">
      <div className="flex gap-6 p-6 min-w-max h-full">
        {tasksByCategory.map((group, index) => (
          <motion.div
            key={group.category.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="w-[320px] flex-shrink-0"
          >
            {/* Category Header - iOS Section Header Style */}
            <div className="flex items-center gap-2.5 mb-4 py-2.5 px-3 border-b border-[#C6C6C8] sticky top-0 bg-[#F2F2F7] z-10 -mx-1 rounded-t-lg">
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: group.category.color }}
              />
              <h2 className="font-semibold text-[15px] text-[#1C1C1E]">
                {group.category.name}
              </h2>
              <span className="text-[13px] text-[#8E8E93] font-medium ml-auto">
                {group.activeTasks.length}件
              </span>
            </div>

            {/* Active Tasks with DnD */}
            {isMounted ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={group.activeTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {group.activeTasks.map(task => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          onClick={() => onTaskSelect(task)}
                          onComplete={onCompleteTask}
                          isSelected={selectedTaskId === task.id}
                          showRequester={true}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeTask ? (
                    <div className="opacity-90">
                      <TaskCard
                        task={activeTask}
                        onClick={() => {}}
                        isSelected={false}
                        showRequester={true}
                        isDraggable={false}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {group.activeTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskSelect(task)}
                      onComplete={onCompleteTask}
                      isSelected={selectedTaskId === task.id}
                      showRequester={true}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
            
            {/* Add Task Button */}
            <div className="mt-3">
              <button
                onClick={() => onAddTask(group.category.id === 'uncategorized' ? undefined : group.category.id)}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#C6C6C8] text-[#8E8E93] hover:border-[#8E8E93] hover:text-[#3C3C43] transition-all flex items-center justify-center"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Completed Tasks Section */}
            {group.completedTasks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#C6C6C8]">
                <button
                  onClick={() => toggleCompletedExpanded(group.category.id)}
                  className="flex items-center gap-2 text-sm text-[#8E8E93] hover:text-[#3C3C43] transition-colors w-full font-medium"
                >
                  {expandedCompleted[group.category.id] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span>完了済み</span>
                  <span className="text-xs">({group.completedTasks.length})</span>
                </button>
                
                <AnimatePresence>
                  {expandedCompleted[group.category.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 space-y-1 overflow-hidden"
                    >
                      {group.completedTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onClick={() => onTaskSelect(task)}
                          onComplete={onCompleteTask}
                          isSelected={selectedTaskId === task.id}
                          isCompact={true}
                          isCompleted={true}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            <div className="pb-6" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
