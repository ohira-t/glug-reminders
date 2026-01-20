'use client';

import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Bell,
  Settings,
  ClipboardList,
  Send,
  Building2,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import { cn } from '@/lib/utils';

export type TaskViewMode = 'my_tasks' | 'requested' | 'clients';

interface HeaderProps {
  viewMode: TaskViewMode;
  onViewModeChange: (mode: TaskViewMode) => void;
  user: User;
  myTasksCount: number;
  requestedCount: number;
  clientsCount: number;
  onAddTask: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSettings: () => void;
  onSignOut?: () => void;
}

export function Header({ viewMode, onViewModeChange, user, myTasksCount, requestedCount, clientsCount, onAddTask, searchQuery, onSearchChange, onOpenSettings, onSignOut }: HeaderProps) {
  return (
    <header className="h-16 border-b border-[#C6C6C8] bg-white/95 backdrop-blur-sm">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left section */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-white">G</span>
            </div>
            <span className="font-semibold text-lg text-[#1C1C1E] hidden lg:block">GLUG Tasks</span>
          </motion.div>

          {/* View Toggle - iOS Segmented Control Style */}
          <div className="flex items-center bg-[#E5E5EA] rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('my_tasks')}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                viewMode === 'my_tasks'
                  ? "bg-white text-[#007AFF] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                  : "text-[#8E8E93] hover:text-[#3C3C43]"
              )}
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">自分の課題</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-xs font-semibold",
                viewMode === 'my_tasks'
                  ? "bg-[#007AFF] text-white"
                  : "bg-[#C6C6C8] text-[#8E8E93]"
              )}>
                {myTasksCount}
              </span>
            </button>
            <button
              onClick={() => onViewModeChange('requested')}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                viewMode === 'requested'
                  ? "bg-white text-[#34C759] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                  : "text-[#8E8E93] hover:text-[#3C3C43]"
              )}
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">依頼した課題</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-xs font-semibold",
                viewMode === 'requested'
                  ? "bg-[#34C759] text-white"
                  : "bg-[#C6C6C8] text-[#8E8E93]"
              )}>
                {requestedCount}
              </span>
            </button>
            <button
              onClick={() => onViewModeChange('clients')}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                viewMode === 'clients'
                  ? "bg-white text-[#FF9500] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                  : "text-[#8E8E93] hover:text-[#3C3C43]"
              )}
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">クライアント別</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-xs font-semibold",
                viewMode === 'clients'
                  ? "bg-[#FF9500] text-white"
                  : "bg-[#C6C6C8] text-[#8E8E93]"
              )}>
                {clientsCount}
              </span>
            </button>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93]" />
            <Input
              placeholder="タスクを検索..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-64 pl-9 h-9 bg-[#E5E5EA] border-0 placeholder:text-[#8E8E93] focus-visible:ring-[#007AFF]"
            />
          </div>
          
          <Button className="h-9 gap-2 bg-[#007AFF] hover:bg-[#0056CC] shadow-sm" onClick={onAddTask}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">新規タスク</span>
          </Button>

          <div className="h-6 w-px bg-[#C6C6C8] mx-1" />

          <Button variant="ghost" size="icon" className="h-9 w-9 text-[#8E8E93] hover:text-[#3C3C43] hover:bg-[#E5E5EA]">
            <Bell className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" className="h-9 w-9 text-[#8E8E93] hover:text-[#3C3C43] hover:bg-[#E5E5EA]" onClick={onOpenSettings}>
            <Settings className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-[#C6C6C8] mx-1" />

          {/* ユーザー名 */}
          <span className="text-sm text-[#3C3C43] font-medium hidden sm:block">{user.name}</span>

          {/* ログアウト */}
          {onSignOut && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-red-50" 
              onClick={onSignOut}
              title="ログアウト"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
