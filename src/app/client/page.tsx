'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  Send,
  AlertCircle,
  Inbox,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { TaskWithUsers, TaskStatus, Comment, User } from '@/types';
import { mockTasks, mockClients } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

// デモ用：最初のクライアントとしてログイン（空の場合はダミーユーザー）
const currentClient: User = mockClients[0] || {
  id: 'demo-client',
  name: 'ゲストクライアント',
  email: 'guest@client.com',
  role: 'staff',
  type: 'client',
  company: 'デモ会社',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function getDaysInfo(dateString?: string): { text: string; color: string } | null {
  if (!dateString) return null;
  
  const due = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diff < 0) return { text: `${Math.abs(diff)}日超過`, color: 'text-red-500' };
  if (diff === 0) return { text: '今日まで', color: 'text-orange-500' };
  if (diff === 1) return { text: '明日まで', color: 'text-orange-500' };
  if (diff <= 3) return { text: `残り${diff}日`, color: 'text-yellow-600' };
  return { text: `残り${diff}日`, color: 'text-slate-500' };
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

type FilterType = 'all' | 'active' | 'completed';

export default function ClientPage() {
  const [tasks, setTasks] = useState<TaskWithUsers[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<TaskWithUsers | null>(null);
  const [filter, setFilter] = useState<FilterType>('active');
  const [newComment, setNewComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

  // クライアント宛のタスクをフィルタリング
  const clientTasks = useMemo(() => {
    return tasks
      .filter(t => t.assignee_id === currentClient.id)
      .sort((a, b) => {
        // 期限が近い順にソート
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'active':
        return clientTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
      case 'completed':
        return clientTasks.filter(t => t.status === 'done');
      default:
        return clientTasks;
    }
  }, [clientTasks, filter]);

  const activeCount = clientTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled').length;
  const completedCount = clientTasks.filter(t => t.status === 'done').length;

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    setTasks(tasks.map(t => 
      t.id === taskId 
        ? { ...t, status, completed_at: status === 'done' ? new Date().toISOString() : undefined }
        : t
    ));
    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...selectedTask, status, completed_at: status === 'done' ? new Date().toISOString() : undefined });
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedTask) return;
    
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      task_id: selectedTask.id,
      user_id: currentClient.id,
      user: currentClient,
      content: newComment.trim(),
      created_at: new Date().toISOString(),
    };
    
    setTasks(tasks.map(t => 
      t.id === selectedTask.id
        ? { ...t, comments: [...(t.comments || []), comment] }
        : t
    ));
    setSelectedTask({
      ...selectedTask,
      comments: [...(selectedTask.comments || []), comment],
    });
    setNewComment('');
    setShowCommentInput(false);
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">完了</Badge>;
      case 'in_progress':
        return <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100">対応中</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">未対応</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <Inbox className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">依頼タスク</h1>
                <p className="text-xs text-slate-400">{currentClient.company}（{currentClient.name}）</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* フィルタータブ */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('active')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              filter === 'active'
                ? "bg-cyan-100 text-cyan-700"
                : "text-slate-500 hover:bg-slate-100"
            )}
          >
            対応待ち
            {activeCount > 0 && (
              <span className="ml-2 bg-cyan-600 text-white text-xs px-2 py-0.5 rounded-full">
                {activeCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              filter === 'completed'
                ? "bg-green-100 text-green-700"
                : "text-slate-500 hover:bg-slate-100"
            )}
          >
            完了済み
            <span className="ml-2 text-xs opacity-60">{completedCount}</span>
          </button>
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              filter === 'all'
                ? "bg-slate-200 text-slate-700"
                : "text-slate-500 hover:bg-slate-100"
            )}
          >
            すべて
          </button>
        </div>

        {/* タスク一覧 */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-400">
                  {filter === 'active' ? '対応待ちのタスクはありません' : 
                   filter === 'completed' ? '完了済みのタスクはありません' : 
                   'タスクがありません'}
                </p>
              </motion.div>
            ) : (
              filteredTasks.map((task, index) => {
                const daysInfo = getDaysInfo(task.due_date);
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                
                return (
                  <motion.button
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setSelectedTask(task)}
                    className={cn(
                      "w-full bg-white rounded-2xl border p-5 text-left transition-all hover:shadow-md",
                      isOverdue ? "border-red-200" : "border-slate-200",
                      task.status === 'done' && "opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(task.status)}
                          {task.category && (
                            <Badge 
                              variant="outline" 
                              className="border-slate-200"
                              style={{ color: task.category.color }}
                            >
                              {task.category.name}
                            </Badge>
                          )}
                        </div>
                        <h3 className={cn(
                          "font-medium mb-2",
                          task.status === 'done' ? "text-slate-400 line-through" : "text-slate-900"
                        )}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                          {daysInfo && (
                            <span className={cn("flex items-center gap-1", daysInfo.color)}>
                              {isOverdue && <AlertCircle className="h-3.5 w-3.5" />}
                              <Clock className="h-3.5 w-3.5" />
                              {daysInfo.text}
                            </span>
                          )}
                          <span className="text-slate-400">
                            from {task.creator.name}
                          </span>
                          {(task.comments?.length || 0) > 0 && (
                            <span className="text-slate-400 flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {task.comments?.length}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 flex-shrink-0" />
                    </div>
                  </motion.button>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* タスク詳細モーダル */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="sm:max-w-[540px] p-0 gap-0 bg-white rounded-3xl overflow-hidden max-h-[85vh] overflow-y-auto [&>button]:hidden">
          <DialogTitle className="sr-only">タスク詳細</DialogTitle>
          
          {selectedTask && (
            <>
              {/* グラバー */}
              <div className="pt-3 pb-2 sticky top-0 bg-white z-10">
                <div className="w-9 h-1 bg-slate-300 rounded-full mx-auto" />
              </div>

              <div className="px-6 pb-6">
                {/* ステータスとカテゴリー */}
                <div className="flex items-center gap-2 mb-3">
                  {getStatusBadge(selectedTask.status)}
                  {selectedTask.category && (
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: selectedTask.category.color,
                        color: selectedTask.category.color,
                      }}
                    >
                      {selectedTask.category.name}
                    </Badge>
                  )}
                </div>

                {/* タイトル */}
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  {selectedTask.title}
                </h2>

                {/* 依頼者と期限 */}
                <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">依頼者</span>
                    <span className="font-medium text-slate-700">{selectedTask.creator.name}</span>
                  </div>
                  {selectedTask.due_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">期限</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">
                          {formatDate(selectedTask.due_date)}
                        </span>
                        {getDaysInfo(selectedTask.due_date) && (
                          <span className={cn("text-sm", getDaysInfo(selectedTask.due_date)?.color)}>
                            ({getDaysInfo(selectedTask.due_date)?.text})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">依頼日</span>
                    <span className="text-slate-600">{formatDate(selectedTask.created_at)}</span>
                  </div>
                </div>

                {/* 説明 */}
                {selectedTask.description && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-slate-500 mb-2">説明</h4>
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {selectedTask.description}
                    </p>
                  </div>
                )}

                <Separator className="my-6" />

                {/* アクションボタン */}
                {selectedTask.status !== 'done' && (
                  <div className="flex gap-2 mb-6">
                    {selectedTask.status !== 'in_progress' && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleStatusChange(selectedTask.id, 'in_progress')}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        対応中にする
                      </Button>
                    )}
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleStatusChange(selectedTask.id, 'done')}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      完了にする
                    </Button>
                  </div>
                )}

                {/* コメント */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    コメント
                    {(selectedTask.comments?.length || 0) > 0 && (
                      <span className="text-slate-400">({selectedTask.comments?.length})</span>
                    )}
                  </h4>

                  <div className="space-y-3 mb-4">
                    {selectedTask.comments?.map(comment => (
                      <div key={comment.id} className="bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-slate-700">
                            {comment.user.name}
                            {comment.user.type === 'client' && (
                              <span className="text-xs text-slate-400 ml-1">（クライアント）</span>
                            )}
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

                    {(!selectedTask.comments || selectedTask.comments.length === 0) && !showCommentInput && (
                      <p className="text-sm text-slate-400 text-center py-4">
                        コメントはありません
                      </p>
                    )}
                  </div>

                  {showCommentInput ? (
                    <div className="space-y-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="コメントを入力..."
                        className="min-h-[80px] resize-none"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          className="flex-1"
                          onClick={() => {
                            setShowCommentInput(false);
                            setNewComment('');
                          }}
                        >
                          キャンセル
                        </Button>
                        <Button
                          className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          送信
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowCommentInput(true)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      コメントを追加
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
