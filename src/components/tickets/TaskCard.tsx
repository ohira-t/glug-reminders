'use client';

import { motion } from 'framer-motion';
import { GripVertical, Check } from 'lucide-react';
import { TaskWithUsers } from '@/types';
import { cn } from '@/lib/utils';

export type ThemeColor = 'blue' | 'green' | 'orange';

interface TaskCardProps {
  task: TaskWithUsers;
  onClick: () => void;
  onComplete?: (taskId: string, completed: boolean) => void;
  isSelected?: boolean;
  showRequester?: boolean;
  showAssignee?: boolean;
  isDraggable?: boolean;
  isCompact?: boolean;
  isCompleted?: boolean;
  themeColor?: ThemeColor;
}

const themeColors = {
  blue: { ring: '#007AFF', hover: 'hover:border-[#007AFF] hover:bg-blue-50' },
  green: { ring: '#34C759', hover: 'hover:border-[#34C759] hover:bg-green-50' },
  orange: { ring: '#FF9500', hover: 'hover:border-[#FF9500] hover:bg-orange-50' },
};

function formatNaturalDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diff < 0) {
    return `${Math.abs(diff)}日前`;
  } else if (diff === 0) {
    return '今日';
  } else if (diff === 1) {
    return '昨日';
  }
  
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
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
  
  // 曜日
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[due.getDay()];
  
  if (diff < 0) {
    return { 
      label: `${Math.abs(diff)}日超過`, 
      isOverdue: true, 
      isUrgent: true 
    };
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

export function TaskCard({ 
  task, 
  onClick, 
  onComplete,
  isSelected,
  showRequester = true,
  isDraggable = true,
  isCompact = false,
  isCompleted = false,
  themeColor = 'blue',
}: TaskCardProps) {
  const dueInfo = getDueInfo(task.due_date);
  const completed = isCompleted || task.status === 'done';
  const theme = themeColors[themeColor];

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete?.(task.id, !completed);
  };

  // 完了タスク用のコンパクト表示
  if (completed && isCompact) {
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
        <span 
          onClick={onClick}
          className="text-sm text-[#8E8E93] line-through cursor-pointer hover:text-[#3C3C43] truncate flex-1"
        >
          {task.title}
        </span>
      </motion.div>
    );
  }

  // コンパクト表示（他の人からの依頼用）
  if (isCompact) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        onClick={onClick}
        className={cn(
          "group relative bg-white rounded-xl px-3 py-2.5 cursor-pointer transition-all",
          isSelected 
            ? `ring-2` 
            : "shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
        )}
        style={isSelected ? { boxShadow: `0 0 0 2px ${theme.ring}` } : undefined}
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-[13px] text-[#3C3C43] truncate flex-1">
            {task.title}
          </h3>
          {dueInfo && (
            <span className={cn(
              "text-[11px] font-medium flex-shrink-0",
              dueInfo.isOverdue && "text-[#FF3B30]",
              dueInfo.isUrgent && !dueInfo.isOverdue && "text-[#FF9500]",
              !dueInfo.isUrgent && !dueInfo.isOverdue && "text-[#8E8E93]"
            )}>
              {dueInfo.label.replace('まで', '')}
            </span>
          )}
        </div>
        {showRequester && task.creator && (
          <span className="text-[11px] text-[#8E8E93] mt-0.5 block">
            from {task.creator.name}
          </span>
        )}
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
          ? "shadow-lg" 
          : "shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
      )}
      style={isSelected ? { boxShadow: `0 0 0 2px ${theme.ring}, 0 10px 15px -3px rgba(0, 0, 0, 0.1)` } : undefined}
    >
      {/* Drag handle - 左端に縦線として表示 */}
      {isDraggable && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-[#C6C6C8] hover:text-[#8E8E93]">
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* チェックボックス */}
        <button
          onClick={handleCheckboxClick}
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
            completed
              ? "bg-[#34C759] border-[#34C759]"
              : `border-[#C6C6C8]`
          )}
          style={!completed ? { ['--hover-border' as string]: theme.ring } : undefined}
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

          {/* メタ情報 - 2行目 */}
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
