'use client';

import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Tag, User, Folder, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { User as UserType, Category, TaskPriority, TaskWithUsers } from '@/types';
import { cn } from '@/lib/utils';

interface EditTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithUsers | null;
  onSubmit: (taskId: string, data: EditTaskData) => void;
  onDelete: (taskId: string) => void;
  users: UserType[];
  categories: Category[];
  tags: string[];
  currentUserId: string;
}

export interface EditTaskData {
  title: string;
  description?: string;
  assignee_id?: string;
  category_id?: string;
  priority: TaskPriority;
  due_date?: Date;
  tags: string[];
}

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'urgent', label: '緊急', color: 'bg-red-500' },
  { value: 'high', label: '高', color: 'bg-orange-500' },
  { value: 'medium', label: '中', color: 'bg-yellow-500' },
  { value: 'low', label: '低', color: 'bg-slate-400' },
];

export function EditTaskModal({
  open,
  onOpenChange,
  task,
  onSubmit,
  onDelete,
  users,
  categories,
  tags: availableTags,
  currentUserId,
}: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // タスクが変更されたら初期値を設定
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setAssigneeId(task.assignee_id || '');
      setCategoryId(task.category_id || '');
      setPriority(task.priority);
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setSelectedTags(task.tags || []);
    }
  }, [task]);

  const handleSubmit = () => {
    if (!title.trim() || !task) return;

    onSubmit(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      assignee_id: assigneeId || currentUserId,
      category_id: categoryId || undefined,
      priority,
      due_date: dueDate,
      tags: selectedTags,
    });

    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!task) return;
    onDelete(task.id);
    onOpenChange(false);
    setShowDeleteConfirm(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}/${m}/${d}`;
  };

  const assignableUsers = users.filter(u => u.id !== currentUserId);

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 gap-0 bg-white rounded-2xl overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              タスクを編集
            </DialogTitle>
            <span className="text-sm font-mono text-slate-400">{task.ticket_id}</span>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* タスク名 */}
          <div>
            <Input
              placeholder="タスク名を入力..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium border-0 px-0 focus-visible:ring-0 placeholder:text-slate-300"
            />
          </div>

          {/* 説明 */}
          <div>
            <Textarea
              placeholder="説明を追加（任意）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] border-slate-200 resize-none focus-visible:ring-cyan-500"
            />
          </div>

          {/* メタ情報グリッド */}
          <div className="grid grid-cols-2 gap-4">
            {/* 担当者 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                担当者
              </label>
              <Select value={assigneeId || '_self'} onValueChange={(v) => setAssigneeId(v === '_self' ? '' : v)}>
                <SelectTrigger className="h-10 border-slate-200">
                  <SelectValue placeholder="自分（マイタスク）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_self">自分（マイタスク）</SelectItem>
                  {assignableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* カテゴリー */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5" />
                カテゴリー
              </label>
              <Select value={categoryId || '_none'} onValueChange={(v) => setCategoryId(v === '_none' ? '' : v)}>
                <SelectTrigger className="h-10 border-slate-200">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">なし</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 優先度 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">
                優先度
              </label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="h-10 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2.5 h-2.5 rounded-full", opt.color)} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 期限 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                期限
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-10 w-full justify-start font-normal border-slate-200",
                      !dueDate && "text-slate-400"
                    )}
                  >
                    {dueDate ? formatDate(dueDate) : "日付を選択"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* タグ */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              タグ
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-slate-100 hover:bg-slate-200 cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              
              {showTagInput ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTag();
                      if (e.key === 'Escape') setShowTagInput(false);
                    }}
                    placeholder="タグ名"
                    className="h-7 w-24 text-sm"
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleAddTag}>
                    追加
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-dashed"
                  onClick={() => setShowTagInput(true)}
                >
                  + タグを追加
                </Button>
              )}
            </div>
            
            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {availableTags
                  .filter(t => !selectedTags.includes(t))
                  .slice(0, 5)
                  .map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTags([...selectedTags, tag])}
                      className="text-xs px-2 py-0.5 rounded bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between bg-slate-50">
          <div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">削除しますか？</span>
                <Button size="sm" variant="destructive" onClick={handleDelete}>
                  削除
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                  キャンセル
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                削除
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
