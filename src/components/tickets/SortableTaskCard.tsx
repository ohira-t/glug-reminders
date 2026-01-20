'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical, Check } from 'lucide-react';
import { TaskWithUsers } from '@/types';
import { cn } from '@/lib/utils';

export type ThemeColor = 'blue' | 'green' | 'orange';

interface SortableTaskCardProps {
  task: TaskWithUsers;
  onClick: () => void;
  onComplete: (taskId: string, completed: boolean) => void;
  isSelected: boolean;
  showRequester?: boolean;
  themeColor?: ThemeColor;
}

const themeColors = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
};

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
  const weekdays = ['日', '月', '火', '水', '木', '土'];
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
      label: `${due.getFullYear()}/${m}/${d}（${weekday}）まで`, 
      isOverdue: false, 
      isUrgent: diff <= 3 
    };
  }
  
  const m = String(due.getMonth() + 1).padStart(2, '0');
  const d = String(due.getDate()).padStart(2, '0');
  return { 
    label: `${due.getFullYear()}/${m}/${d}（${weekday}）まで`, 
    isOverdue: false, 
    isUrgent: false 
  };
}

export function SortableTaskCard({ 
  task, 
  onClick, 
  onComplete,
  isSelected,
  showRequester = true,
  themeColor = 'blue',
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const ringColor = themeColors[themeColor];

  const dueInfo = getDueInfo(task.due_date);
  const completed = task.status === 'done';

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete(task.id, !completed);
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        ...style,
        ...(isSelected ? { boxShadow: `0 0 0 2px ${ringColor}, 0 10px 15px -3px rgba(0, 0, 0, 0.1)` } : {})
      }}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        "group relative bg-white rounded-2xl p-4 transition-all",
        isSelected 
          ? "shadow-lg" 
          : "shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
        isDragging && "shadow-xl z-50 opacity-90"
      )}
    >
      {/* Drag handle */}
      <div 
        {...attributes}
        {...listeners}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-[#C6C6C8] hover:text-[#8E8E93] p-1"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="flex items-start gap-3">
        {/* チェックボックス */}
        <button
          onClick={handleCheckboxClick}
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
            completed
              ? "bg-[#34C759] border-[#34C759]"
              : "border-[#C6C6C8] hover:border-[#007AFF] hover:bg-blue-50"
          )}
        >
          {completed && <Check className="h-3 w-3 text-white" />}
        </button>

        {/* タスク内容 */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
          {/* タスク名 */}
          <h3 className={cn(
            "font-semibold text-[15px] leading-snug",
            completed ? "text-[#8E8E93] line-through" : "text-[#1C1C1E]"
          )}>
            {task.title}
          </h3>

          {/* タグ */}
          {task.tags && task.tags.length > 0 && !completed && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.slice(0, 3).map(tag => (
                <span 
                  key={tag}
                  className="text-[11px] px-1.5 py-0.5 rounded-md bg-[#E5E5EA] text-[#8E8E93]"
                >
                  {tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="text-[11px] text-[#AEAEB2]">
                  +{task.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* メタ情報 */}
          {!completed && (
            <div className="mt-2.5 flex items-center justify-between">
              {/* 期限 */}
              <div className="flex items-center gap-2">
                {dueInfo ? (
                  <span className={cn(
                    "text-[13px] font-medium",
                    dueInfo.isOverdue && "text-[#FF3B30]",
                    dueInfo.isUrgent && !dueInfo.isOverdue && "text-[#FF9500]",
                    !dueInfo.isUrgent && !dueInfo.isOverdue && "text-[#8E8E93]"
                  )}>
                    {dueInfo.label}
                  </span>
                ) : (
                  <span className="text-[13px] text-[#AEAEB2]">期限なし</span>
                )}
              </div>

              {/* 依頼主 */}
              {showRequester && task.creator && (
                <span className="text-[12px] text-[#8E8E93]">
                  from {task.creator.name.split(' ')[0]}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
