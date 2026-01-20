'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { TaskWithUsers, User } from '@/types';

interface RequestedTasksViewProps {
  tasks: TaskWithUsers[];  // 自分が依頼したタスク
  allTasks: TaskWithUsers[];  // 全タスク（他の人からの依頼も含む）
  users: User[];
  selectedTaskId: string | null;
  onTaskSelect: (task: TaskWithUsers) => void;
  currentUserId: string;
}

export function RequestedTasksView({ tasks, allTasks, users, selectedTaskId, onTaskSelect, currentUserId }: RequestedTasksViewProps) {
  // 依頼先ごとにタスクをグループ化（自分の依頼と他の人の依頼を分ける）
  const tasksByAssignee = useMemo(() => {
    const grouped = new Map<string, { 
      user: User; 
      myRequests: TaskWithUsers[];  // 自分が依頼したタスク
      otherRequests: TaskWithUsers[];  // 他の人が依頼したタスク
      totalCount: number;
    }>();
    
    // 自分が依頼したタスクでグループ化の初期化
    tasks.forEach(task => {
      if (!task.assignee_id || !task.assignee) return;
      
      const existing = grouped.get(task.assignee_id);
      if (existing) {
        existing.myRequests.push(task);
      } else {
        grouped.set(task.assignee_id, {
          user: task.assignee,
          myRequests: [task],
          otherRequests: [],
          totalCount: 0,
        });
      }
    });

    // 他の人からの依頼を追加（同じ依頼先のみ）
    allTasks.forEach(task => {
      if (!task.assignee_id || !task.assignee) return;
      // 自分以外が依頼したタスクで、既にグループがある依頼先のみ
      if (task.creator_id !== currentUserId && grouped.has(task.assignee_id)) {
        // 完了・キャンセル以外のタスクのみ
        if (task.status !== 'done' && task.status !== 'cancelled') {
          const group = grouped.get(task.assignee_id)!;
          group.otherRequests.push(task);
        }
      }
    });

    // 各グループ内で納期順にソート＆総数を計算
    grouped.forEach(group => {
      const sortByDueDate = (a: TaskWithUsers, b: TaskWithUsers) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      };
      
      group.myRequests.sort(sortByDueDate);
      group.otherRequests.sort(sortByDueDate);
      group.totalCount = group.myRequests.length + group.otherRequests.length;
    });

    return grouped;
  }, [tasks, allTasks, currentUserId]);

  const assigneeGroups = Array.from(tasksByAssignee.values());

  if (assigneeGroups.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Send className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">依頼中のタスクはありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto overflow-y-auto">
      <div className="flex gap-6 p-6 min-w-max h-full">
        {assigneeGroups.map((group, index) => (
          <motion.div
            key={group.user.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="w-[320px] flex-shrink-0"
          >
            {/* Assignee Header - iOS Section Header Style */}
            <div className="flex items-center gap-2.5 mb-4 py-2.5 px-3 border-b border-[#C6C6C8] sticky top-0 bg-[#F2F2F7] z-10 -mx-1 rounded-t-lg">
              <div 
                className="w-2.5 h-2.5 rounded-full bg-[#8E8E93]"
              />
              <h2 className="font-semibold text-[15px] text-[#1C1C1E]">
                {group.user.name}
              </h2>
              <span className="text-[13px] text-[#8E8E93] font-medium ml-auto">
                全{group.totalCount}件
              </span>
            </div>

            {/* 自分の依頼 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-[#34C759]">自分の依頼</span>
                <span className="text-xs text-[#8E8E93] font-medium">{group.myRequests.length}件</span>
              </div>
              <AnimatePresence mode="popLayout">
                {group.myRequests.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskSelect(task)}
                    isSelected={selectedTaskId === task.id}
                    showRequester={false}
                    isDraggable={false}
                    themeColor="green"
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* 区切り線と他の人の依頼 */}
            {group.otherRequests.length > 0 && (
              <div className="mt-4 pt-4 border-t border-dashed border-[#C6C6C8]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-[#8E8E93]">他の人からの依頼</span>
                  <span className="text-xs text-[#AEAEB2] font-medium">{group.otherRequests.length}件</span>
                </div>
                <div className="space-y-2 opacity-70">
                  <AnimatePresence mode="popLayout">
                    {group.otherRequests.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => onTaskSelect(task)}
                        isSelected={selectedTaskId === task.id}
                        showRequester={true}
                        isDraggable={false}
                        isCompact={true}
                        themeColor="green"
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
            
            <div className="pb-6" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
