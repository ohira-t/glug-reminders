'use client';

import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Users,
  CheckCircle2,
  MessageSquare,
  Tag,
  Send,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Folder,
  X,
  Plus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { TaskWithUsers, TaskStatus, User as UserType, Category, TaskPriority } from '@/types';
import { cn } from '@/lib/utils';

interface TicketDetailProps {
  task: TaskWithUsers | null;
  onClose: () => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onSave: (taskId: string, data: EditData) => void;
  onDelete: (taskId: string) => void;
  onAddComment: (taskId: string, content: string) => void;
  currentUser: UserType;
  users: UserType[];
  categories: Category[];
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export interface EditData {
  title: string;
  description?: string;
  assignee_id?: string;
  category_id?: string;
  priority: TaskPriority;
  due_date?: Date;
  tags: string[];
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const w = weekdays[date.getDay()];
  return `${y}/${m}/${d}（${w}）`;
}

function getDaysRemaining(dateString?: string): string | null {
  if (!dateString) return null;
  
  const due = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diff < 0) return `${Math.abs(diff)}日超過`;
  if (diff === 0) return '今日が期限';
  if (diff === 1) return '明日が期限';
  return `残り${diff}日`;
}

function formatCommentTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  if (days < 7) return `${days}日前`;
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

export function TicketDetail({ 
  task, 
  onClose, 
  onStatusChange, 
  onSave,
  onDelete,
  onAddComment, 
  currentUser,
  users,
  categories,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: TicketDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  
  // 編集用の状態
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editDueDate, setEditDueDate] = useState<Date | undefined>();
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // タスクが変わったら編集モードで開始
  useEffect(() => {
    if (task) {
      setCommentText('');
      setShowCommentInput(false);
      // 編集データをセット
      setEditTitle(task.title);
      setEditDescription(task.description || '');
      setEditAssigneeId(task.assignee_id || '');
      setEditCategoryId(task.category_id || '');
      setEditPriority(task.priority);
      setEditDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setEditTags(task.tags || []);
      setIsEditing(true); // 常に編集モードで開始
    }
  }, [task?.id]);

  // 編集モードに入るときにデータをセット
  const startEditing = () => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditAssigneeId(task.assignee_id || '');
    setEditCategoryId(task.category_id || '');
    setEditPriority(task.priority);
    setEditDueDate(task.due_date ? new Date(task.due_date) : undefined);
    setEditTags(task.tags || []);
    setIsEditing(true);
  };

  // 編集をキャンセル
  const cancelEditing = () => {
    setIsEditing(false);
    setNewTagInput('');
  };

  // 保存
  const handleSave = () => {
    if (!task || !editTitle.trim()) return;
    onSave(task.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      assignee_id: editAssigneeId || undefined,
      category_id: editCategoryId || undefined,
      priority: editPriority,
      due_date: editDueDate,
      tags: editTags,
    });
    setIsEditing(false);
    setNewTagInput('');
  };

  // 削除
  const handleDelete = () => {
    if (!task) return;
    if (confirm('このタスクを削除しますか？')) {
      onDelete(task.id);
      onClose();
    }
  };

  const handleSubmitComment = () => {
    if (!task || !commentText.trim()) return;
    onAddComment(task.id, commentText.trim());
    setCommentText('');
    setShowCommentInput(false);
  };

  if (!task) return null;

  const daysText = getDaysRemaining(task.due_date);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  
  // 社内メンバーとクライアントを分けて取得
  const assignableInternals = users.filter(u => u.id !== currentUser.id && u.type === 'internal');
  const assignableClients = users.filter(u => u.type === 'client');

  return (
    <Dialog open={!!task} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 bg-white rounded-3xl overflow-hidden max-h-[85vh] flex flex-col [&>button]:hidden">
        {/* アクセシビリティ用のタイトル（視覚的に非表示） */}
        <DialogTitle className="sr-only">{task.title}</DialogTitle>
        
        {/* iOS-style grabber */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#C6C6C8]" />
        </div>
        
        {/* Header - iOS Style */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#C6C6C8]">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 text-[#FF3B30] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 text-[17px] font-normal"
            onClick={onClose}
          >
            キャンセル
          </Button>
          
          <span className="text-[17px] font-semibold text-[#1C1C1E]">
            タスク編集
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 text-[#007AFF] hover:text-[#007AFF] hover:bg-[#007AFF]/10 text-[17px] font-semibold disabled:opacity-40"
            onClick={handleSave}
            disabled={!editTitle.trim()}
          >
            保存
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pb-5 space-y-5">
            {isEditing ? (
              /* ========== 編集モード - iOS Style ========== */
              <>
                {/* タイトル */}
                <div>
                  <label className="text-[13px] font-medium text-[#8E8E93] mb-1.5 block">タスク名</label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="タスク名を入力"
                    className="h-12 text-[17px] font-medium bg-[#F2F2F7] border-0 rounded-xl px-4 focus-visible:ring-2 focus-visible:ring-[#007AFF] placeholder:text-[#C6C6C8]"
                  />
                </div>

                {/* 説明 */}
                <div>
                  <label className="text-[13px] font-medium text-[#8E8E93] mb-1.5 block">説明（任意）</label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="説明を追加"
                    className="min-h-[100px] bg-[#F2F2F7] border-0 rounded-xl px-4 py-3 resize-none focus-visible:ring-2 focus-visible:ring-[#007AFF] placeholder:text-[#C6C6C8]"
                  />
                </div>

                {/* メタ情報 - iOS List Style */}
                <div className="bg-[#F2F2F7] rounded-xl overflow-hidden divide-y divide-[#C6C6C8]/50">
                  {/* カテゴリー */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white">
                    <label className="text-[15px] text-[#1C1C1E] flex items-center gap-2">
                      <Folder className="h-4 w-4 text-[#8E8E93]" />
                      カテゴリー
                    </label>
                    <Select value={editCategoryId || '_none'} onValueChange={(v) => setEditCategoryId(v === '_none' ? '' : v)}>
                      <SelectTrigger className="h-9 w-[160px] border border-[#C6C6C8] bg-[#F2F2F7] rounded-lg text-[#1C1C1E] focus:ring-2 focus:ring-[#007AFF]">
                        <SelectValue placeholder="選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">なし</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 担当者 */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white">
                    <label className="text-[15px] text-[#1C1C1E] flex items-center gap-2">
                      <User className="h-4 w-4 text-[#8E8E93]" />
                      担当者
                    </label>
                    <Select value={editAssigneeId || '_self'} onValueChange={(v) => setEditAssigneeId(v === '_self' ? currentUser.id : v)}>
                      <SelectTrigger className="h-9 w-[160px] border border-[#C6C6C8] bg-[#F2F2F7] rounded-lg text-[#1C1C1E] focus:ring-2 focus:ring-[#007AFF]">
                        <SelectValue placeholder="選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_self">自分</SelectItem>
                        
                        {assignableInternals.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-medium text-[#8E8E93] border-t mt-1 pt-2">
                              社内メンバー
                            </div>
                            {assignableInternals.map(user => (
                              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                            ))}
                          </>
                        )}
                        
                        {assignableClients.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-medium text-[#8E8E93] border-t mt-1 pt-2">
                              クライアント
                            </div>
                            {assignableClients.map(client => (
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

                  {/* 納期 */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white">
                    <label className="text-[15px] text-[#1C1C1E] flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-[#8E8E93]" />
                      納期
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className={cn(
                            "h-9 w-[160px] font-normal border border-[#C6C6C8] bg-[#F2F2F7] rounded-lg hover:bg-[#E5E5EA] justify-start",
                            editDueDate ? "text-[#1C1C1E]" : "text-[#8E8E93]"
                          )}
                        >
                          {editDueDate ? `${editDueDate.getFullYear()}/${String(editDueDate.getMonth() + 1).padStart(2, '0')}/${String(editDueDate.getDate()).padStart(2, '0')}` : "日付を選択"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar mode="single" selected={editDueDate} onSelect={setEditDueDate} />
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
                    {editTags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-[#E5E5EA] hover:bg-[#D1D1D6] text-[#3C3C43] pr-1 flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setEditTags(editTags.filter((_, i) => i !== index))}
                          className="ml-0.5 hover:bg-[#C6C6C8] rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <div className="flex items-center gap-1">
                      <Input
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTagInput.trim()) {
                            e.preventDefault();
                            if (!editTags.includes(newTagInput.trim())) {
                              setEditTags([...editTags, newTagInput.trim()]);
                            }
                            setNewTagInput('');
                          }
                        }}
                        placeholder="タグ名"
                        className="h-8 w-28 text-sm bg-[#F2F2F7] border-0 rounded-lg focus-visible:ring-2 focus-visible:ring-[#007AFF]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-[#007AFF]"
                        onClick={() => {
                          if (newTagInput.trim() && !editTags.includes(newTagInput.trim())) {
                            setEditTags([...editTags, newTagInput.trim()]);
                            setNewTagInput('');
                          }
                        }}
                      >
                        追加
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 削除ボタン - iOS Style */}
                <Button
                  variant="ghost"
                  className="w-full h-12 justify-center text-[#FF3B30] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 text-[15px]"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  このタスクを削除
                </Button>
              </>
            ) : (
              /* ========== 表示モード ========== */
              <>
                {/* Title & Category */}
                <div>
                  <h2 className={cn(
                    "text-xl font-semibold text-slate-900 leading-tight",
                    task.status === 'done' && "text-slate-400 line-through"
                  )}>
                    {task.title}
                  </h2>
                  {task.category && (
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium mt-2"
                      style={{
                        backgroundColor: `${task.category.color}15`,
                        color: task.category.color,
                      }}
                    >
                      {task.category.name}
                    </Badge>
                  )}
                  {task.description && (
                    <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  {/* 依頼日 */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-xs">依頼日</span>
                    </div>
                    <span className="text-sm text-slate-700">
                      {formatFullDate(task.created_at)}
                    </span>
                  </div>

                  {/* 納期 */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <span className="text-xs">納期</span>
                    </div>
                    {task.due_date ? (
                      <div>
                        <span className="text-sm text-slate-700">
                          {formatFullDate(task.due_date)}
                        </span>
                        {daysText && (
                          <span className={cn(
                            "ml-1.5 text-xs font-medium",
                            isOverdue ? "text-red-600" : "text-orange-600"
                          )}>
                            ({daysText})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">未設定</span>
                    )}
                  </div>

                  {/* 依頼主 */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-xs">依頼主</span>
                    </div>
                    <span className="text-sm text-slate-700">{task.creator.name}</span>
                  </div>

                  {/* 担当者 */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <User className="h-3.5 w-3.5" />
                      <span className="text-xs">担当者</span>
                    </div>
                    <span className="text-sm text-slate-700">
                      {task.assignee?.name || '未割当'}
                    </span>
                  </div>
                </div>

                {/* タグ */}
                {task.tags && task.tags.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Tag className="h-3.5 w-3.5" />
                      <span className="text-xs">タグ</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {task.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs bg-slate-100">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* コメントセクション */}
                <div className="pt-2">
                  <Separator className="mb-4" />
                  <div className="flex items-center gap-2 text-slate-500 mb-3">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm font-medium">コメント</span>
                    {task.comments && task.comments.length > 0 && (
                      <span className="text-xs text-slate-400">({task.comments.length})</span>
                    )}
                  </div>

                  {/* コメント一覧 */}
                  {task.comments && task.comments.length > 0 && (
                    <div className="space-y-2.5 mb-4">
                      {task.comments.map(comment => (
                        <div key={comment.id} className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-700">
                              {comment.user.name}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatCommentTime(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* コメント入力 */}
                  {showCommentInput ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="コメントを入力..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="min-h-[80px] text-sm resize-none"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowCommentInput(false);
                            setCommentText('');
                          }}
                        >
                          キャンセル
                        </Button>
                        <Button
                          size="sm"
                          className="bg-cyan-600 hover:bg-cyan-700"
                          disabled={!commentText.trim()}
                          onClick={handleSubmitComment}
                        >
                          <Send className="h-3.5 w-3.5 mr-1.5" />
                          送信
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCommentInput(true)}
                      className="w-full py-2.5 rounded-lg border border-dashed border-slate-200 text-slate-400 hover:border-cyan-400 hover:text-cyan-500 hover:bg-cyan-50/50 transition-all flex items-center justify-center gap-1.5 text-sm"
                    >
                      <MessageSquare className="h-4 w-4" />
                      コメントを追加
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer - 表示モードのみ */}
        {!isEditing && (
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="justify-center bg-white"
                onClick={() => onStatusChange(task.id, task.status === 'done' ? 'in_progress' : 'done')}
              >
                <CheckCircle2 className={cn(
                  "h-4 w-4 mr-2",
                  task.status === 'done' && "text-green-600"
                )} />
                {task.status === 'done' ? '未完了に戻す' : '完了にする'}
              </Button>
              <Button 
                variant="outline"
                className="justify-center bg-white"
                onClick={startEditing}
              >
                編集する
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
