'use client';

import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Tag, User, Folder, Flag } from 'lucide-react';
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
import { User as UserType, Category, TaskPriority } from '@/types';
import { cn } from '@/lib/utils';

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: NewTaskData) => void;
  internalUsers: UserType[];
  clients: UserType[];
  categories: Category[];
  tags: string[];
  currentUserId: string;
  defaultCategoryId?: string;
}

export interface NewTaskData {
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

export function AddTaskModal({
  open,
  onOpenChange,
  onSubmit,
  internalUsers,
  clients,
  categories,
  tags: availableTags,
  currentUserId,
  defaultCategoryId,
}: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  
  // 自分以外の社内メンバー
  const assignableInternals = internalUsers.filter(u => u.id !== currentUserId);

  // モーダルが開いたときにデフォルトカテゴリーを設定
  useEffect(() => {
    if (open) {
      setCategoryId(defaultCategoryId || '');
    }
  }, [open, defaultCategoryId]);

  const handleSubmit = () => {
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      assignee_id: assigneeId || currentUserId, // 未選択なら自分
      category_id: categoryId || undefined,
      priority,
      due_date: dueDate,
      tags: selectedTags,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setAssigneeId('');
    setCategoryId('');
    setPriority('medium');
    setDueDate(undefined);
    setSelectedTags([]);
    onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 gap-0 bg-white rounded-3xl overflow-hidden">
        {/* iOS-style grabber */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#C6C6C8]" />
        </div>
        
        <DialogHeader className="px-6 py-3 border-b border-[#C6C6C8]">
          <DialogTitle className="text-[17px] font-semibold text-[#1C1C1E] text-center">
            新規タスク
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* タスク名 - iOS風 */}
          <div>
            <label className="text-[13px] font-medium text-[#8E8E93] mb-1.5 block">タスク名</label>
            <Input
              placeholder="タスク名を入力"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 text-[17px] font-medium bg-[#F2F2F7] border-0 rounded-xl px-4 focus-visible:ring-2 focus-visible:ring-[#007AFF] placeholder:text-[#C6C6C8]"
              autoFocus
            />
          </div>

          {/* 説明 */}
          <div>
            <label className="text-[13px] font-medium text-[#8E8E93] mb-1.5 block">説明（任意）</label>
            <Textarea
              placeholder="説明を追加"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] bg-[#F2F2F7] border-0 rounded-xl px-4 py-3 resize-none focus-visible:ring-2 focus-visible:ring-[#007AFF] placeholder:text-[#C6C6C8]"
            />
          </div>

          {/* メタ情報グリッド - iOS List Style */}
          <div className="bg-[#F2F2F7] rounded-xl overflow-hidden divide-y divide-[#C6C6C8]/50">
            {/* 担当者 */}
            <div className="flex items-center justify-between px-4 py-3 bg-white">
              <label className="text-[15px] text-[#1C1C1E] flex items-center gap-2">
                <User className="h-4 w-4 text-[#8E8E93]" />
                担当者
              </label>
              <Select value={assigneeId || '_self'} onValueChange={(v) => setAssigneeId(v === '_self' ? '' : v)}>
                <SelectTrigger className="h-9 w-[160px] border border-[#C6C6C8] bg-[#F2F2F7] rounded-lg text-[#1C1C1E] focus:ring-2 focus:ring-[#007AFF]">
                  <SelectValue placeholder="自分" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_self">自分</SelectItem>
                  
                  {assignableInternals.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-medium text-[#8E8E93] border-t mt-1 pt-2">
                        社内メンバー
                      </div>
                      {assignableInternals.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  
                  {clients.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-medium text-[#8E8E93] border-t mt-1 pt-2">
                        クライアント
                      </div>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company ? (
                            <>
                              <span>{client.company}</span>
                              <span className="text-[#8E8E93] ml-1">（{client.name}）</span>
                            </>
                          ) : (
                            <span>{client.name}</span>
                          )}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* カテゴリー */}
            <div className="flex items-center justify-between px-4 py-3 bg-white">
              <label className="text-[15px] text-[#1C1C1E] flex items-center gap-2">
                <Folder className="h-4 w-4 text-[#8E8E93]" />
                カテゴリー
              </label>
              <Select value={categoryId || '_none'} onValueChange={(v) => setCategoryId(v === '_none' ? '' : v)}>
                <SelectTrigger className="h-9 w-[160px] border border-[#C6C6C8] bg-[#F2F2F7] rounded-lg text-[#1C1C1E] focus:ring-2 focus:ring-[#007AFF]">
                  <SelectValue placeholder="選択" />
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
            <div className="flex items-center justify-between px-4 py-3 bg-white">
              <label className="text-[15px] text-[#1C1C1E] flex items-center gap-2">
                <Flag className="h-4 w-4 text-[#8E8E93]" />
                優先度
              </label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="h-9 w-[160px] border border-[#C6C6C8] bg-[#F2F2F7] rounded-lg text-[#1C1C1E] focus:ring-2 focus:ring-[#007AFF]">
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
            <div className="flex items-center justify-between px-4 py-3 bg-white">
              <label className="text-[15px] text-[#1C1C1E] flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-[#8E8E93]" />
                期限
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 w-[160px] font-normal border border-[#C6C6C8] bg-[#F2F2F7] rounded-lg hover:bg-[#E5E5EA] justify-start",
                      dueDate ? "text-[#1C1C1E]" : "text-[#8E8E93]"
                    )}
                  >
                    {dueDate ? formatDate(dueDate) : "日付を選択"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
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
            <label className="text-[13px] font-medium text-[#8E8E93] flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              タグ
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-[#E5E5EA] hover:bg-[#D1D1D6] text-[#3C3C43] cursor-pointer pr-1"
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
                    className="h-8 w-28 text-sm bg-[#F2F2F7] border-0 rounded-lg focus-visible:ring-2 focus-visible:ring-[#007AFF]"
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" className="h-8 px-3 text-[#007AFF]" onClick={handleAddTag}>
                    追加
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[13px] text-[#007AFF] hover:bg-[#007AFF]/10"
                  onClick={() => setShowTagInput(true)}
                >
                  + タグを追加
                </Button>
              )}
            </div>
            
            {/* 既存タグの候補 */}
            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {availableTags
                  .filter(t => !selectedTags.includes(t))
                  .slice(0, 5)
                  .map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTags([...selectedTags, tag])}
                      className="text-[12px] px-2.5 py-1 rounded-full bg-[#F2F2F7] text-[#8E8E93] hover:bg-[#E5E5EA] hover:text-[#3C3C43] transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* フッター - iOS Style */}
        <div className="px-6 py-4 border-t border-[#C6C6C8] flex justify-between gap-3">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 text-[17px] text-[#FF3B30] hover:bg-[#FF3B30]/10"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex-1 h-12 text-[17px] bg-[#007AFF] hover:bg-[#0056CC] disabled:opacity-40"
          >
            作成
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
