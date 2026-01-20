'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, ChevronRight, Building2, Users, Folder } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Category, User } from '@/types';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  internalUsers: User[];
  clients: User[];
  onCategoriesChange: (categories: Category[]) => void;
  onInternalUsersChange: (users: User[]) => void;
  onClientsChange: (clients: User[]) => void;
  currentUserId: string;
}

const colorPresets = [
  { color: '#ef4444', name: 'レッド' },
  { color: '#f97316', name: 'オレンジ' },
  { color: '#eab308', name: 'イエロー' },
  { color: '#22c55e', name: 'グリーン' },
  { color: '#14b8a6', name: 'ティール' },
  { color: '#0891b2', name: 'シアン' },
  { color: '#3b82f6', name: 'ブルー' },
  { color: '#6366f1', name: 'インディゴ' },
  { color: '#8b5cf6', name: 'パープル' },
  { color: '#ec4899', name: 'ピンク' },
];

type TabType = 'categories' | 'internal' | 'clients';

export function SettingsModal({
  open,
  onOpenChange,
  categories,
  internalUsers,
  clients,
  onCategoriesChange,
  onInternalUsersChange,
  onClientsChange,
  currentUserId,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  
  // カテゴリー追加/編集
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(colorPresets[5].color);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  
  // 社内メンバー追加/編集
  const [newInternalName, setNewInternalName] = useState('');
  const [newInternalEmail, setNewInternalEmail] = useState('');
  const [showInternalForm, setShowInternalForm] = useState(false);
  const [editingInternalId, setEditingInternalId] = useState<string | null>(null);
  
  // クライアント追加/編集
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // === カテゴリー ===
  const startEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color);
    setShowCategoryForm(false);
  };

  const handleSaveCategory = () => {
    if (!newCategoryName.trim()) return;
    
    if (editingCategoryId) {
      onCategoriesChange(categories.map(c => 
        c.id === editingCategoryId 
          ? { ...c, name: newCategoryName.trim(), color: newCategoryColor }
          : c
      ));
      setEditingCategoryId(null);
    } else {
      const newCategory: Category = {
        id: `cat-${Date.now()}`,
        name: newCategoryName.trim(),
        color: newCategoryColor,
      };
      onCategoriesChange([...categories, newCategory]);
      setShowCategoryForm(false);
    }
    
    setNewCategoryName('');
    setNewCategoryColor(colorPresets[5].color);
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setNewCategoryName('');
    setNewCategoryColor(colorPresets[5].color);
  };

  const handleDeleteCategory = (id: string) => {
    onCategoriesChange(categories.filter(c => c.id !== id));
    if (editingCategoryId === id) cancelEditCategory();
  };

  // === 社内メンバー ===
  const startEditInternal = (user: User) => {
    if (user.id === currentUserId) return;
    setEditingInternalId(user.id);
    setNewInternalName(user.name);
    setNewInternalEmail(user.email);
    setShowInternalForm(false);
  };

  const handleSaveInternal = () => {
    if (!newInternalName.trim()) return;
    
    if (editingInternalId) {
      onInternalUsersChange(internalUsers.map(u => 
        u.id === editingInternalId 
          ? { ...u, name: newInternalName.trim(), email: newInternalEmail.trim() || u.email }
          : u
      ));
      setEditingInternalId(null);
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: newInternalName.trim(),
        email: newInternalEmail.trim() || `${newInternalName.trim().toLowerCase().replace(/\s/g, '')}@glug.co.jp`,
        role: 'staff',
        type: 'internal',
      };
      onInternalUsersChange([...internalUsers, newUser]);
      setShowInternalForm(false);
    }
    
    setNewInternalName('');
    setNewInternalEmail('');
  };

  const cancelEditInternal = () => {
    setEditingInternalId(null);
    setNewInternalName('');
    setNewInternalEmail('');
  };

  const handleDeleteInternal = (id: string) => {
    if (id === currentUserId) return;
    onInternalUsersChange(internalUsers.filter(u => u.id !== id));
    if (editingInternalId === id) cancelEditInternal();
  };

  // === クライアント ===
  const startEditClient = (client: User) => {
    setEditingClientId(client.id);
    setNewClientName(client.name);
    setNewClientEmail(client.email);
    setNewClientCompany(client.company || '');
    setShowClientForm(false);
  };

  const handleSaveClient = () => {
    if (!newClientName.trim()) return;
    
    if (editingClientId) {
      onClientsChange(clients.map(c => 
        c.id === editingClientId 
          ? { 
              ...c, 
              name: newClientName.trim(), 
              email: newClientEmail.trim() || c.email,
              company: newClientCompany.trim() || undefined,
            }
          : c
      ));
      setEditingClientId(null);
    } else {
      const newClient: User = {
        id: `client-${Date.now()}`,
        name: newClientName.trim(),
        email: newClientEmail.trim() || `${newClientName.trim().toLowerCase().replace(/\s/g, '')}@example.com`,
        role: 'client',
        type: 'client',
        company: newClientCompany.trim() || undefined,
      };
      onClientsChange([...clients, newClient]);
      setShowClientForm(false);
    }
    
    setNewClientName('');
    setNewClientEmail('');
    setNewClientCompany('');
  };

  const cancelEditClient = () => {
    setEditingClientId(null);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientCompany('');
  };

  const handleDeleteClient = (id: string) => {
    onClientsChange(clients.filter(c => c.id !== id));
    if (editingClientId === id) cancelEditClient();
  };

  // タブ切り替え時にフォームをリセット
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    cancelEditCategory();
    cancelEditInternal();
    cancelEditClient();
    setShowCategoryForm(false);
    setShowInternalForm(false);
    setShowClientForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 bg-white rounded-3xl overflow-hidden [&>button]:hidden">
        <DialogTitle className="sr-only">設定</DialogTitle>
        
        {/* グラバー */}
        <div className="pt-3 pb-4">
          <div className="w-9 h-1 bg-slate-300 rounded-full mx-auto" />
        </div>

        {/* セグメントコントロール (3タブ) */}
        <div className="px-5 pb-4">
          <div className="bg-slate-100 p-1 rounded-xl flex">
            <button
              onClick={() => handleTabChange('categories')}
              className={cn(
                "flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5",
                activeTab === 'categories'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Folder className="h-4 w-4" />
              <span className="hidden sm:inline">カテゴリー</span>
            </button>
            <button
              onClick={() => handleTabChange('internal')}
              className={cn(
                "flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5",
                activeTab === 'internal'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">社内</span>
            </button>
            <button
              onClick={() => handleTabChange('clients')}
              className={cn(
                "flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5",
                activeTab === 'clients'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">クライアント</span>
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="px-5 pb-5 min-h-[360px] max-h-[50vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* === カテゴリータブ === */}
            {activeTab === 'categories' && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
              >
                <div className="space-y-2 mb-4">
                  {categories.map(category => (
                    <div key={category.id}>
                      {editingCategoryId === category.id ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-4 bg-cyan-50 rounded-xl space-y-4 border-2 border-cyan-200"
                        >
                          <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="h-11 bg-white"
                            autoFocus
                          />
                          <div>
                            <p className="text-xs text-slate-500 mb-2">カラーを選択</p>
                            <div className="flex flex-wrap gap-2">
                              {colorPresets.map(preset => (
                                <button
                                  key={preset.color}
                                  onClick={() => setNewCategoryColor(preset.color)}
                                  className={cn(
                                    "w-8 h-8 rounded-full transition-all flex items-center justify-center",
                                    newCategoryColor === preset.color 
                                      ? "ring-2 ring-offset-2 ring-cyan-400 scale-110" 
                                      : "hover:scale-105"
                                  )}
                                  style={{ backgroundColor: preset.color }}
                                >
                                  {newCategoryColor === preset.color && (
                                    <Check className="h-4 w-4 text-white drop-shadow" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="flex-1" onClick={cancelEditCategory}>
                              キャンセル
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                              onClick={handleSaveCategory}
                              disabled={!newCategoryName.trim()}
                            >
                              保存
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.button
                          layout
                          onClick={() => startEditCategory(category)}
                          className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-5 h-5 rounded-full shadow-sm"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-medium text-slate-700">{category.name}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </motion.button>
                      )}
                    </div>
                  ))}
                  
                  {categories.length === 0 && !showCategoryForm && (
                    <p className="text-center text-slate-400 py-8">カテゴリーがありません</p>
                  )}
                </div>

                <AnimatePresence>
                  {showCategoryForm && !editingCategoryId ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-slate-50 rounded-xl space-y-4">
                        <Input
                          placeholder="カテゴリー名"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="h-11 bg-white"
                          autoFocus
                        />
                        <div>
                          <p className="text-xs text-slate-500 mb-2">カラーを選択</p>
                          <div className="flex flex-wrap gap-2">
                            {colorPresets.map(preset => (
                              <button
                                key={preset.color}
                                onClick={() => setNewCategoryColor(preset.color)}
                                className={cn(
                                  "w-8 h-8 rounded-full transition-all flex items-center justify-center",
                                  newCategoryColor === preset.color 
                                    ? "ring-2 ring-offset-2 ring-slate-400 scale-110" 
                                    : "hover:scale-105"
                                )}
                                style={{ backgroundColor: preset.color }}
                              >
                                {newCategoryColor === preset.color && (
                                  <Check className="h-4 w-4 text-white drop-shadow" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button variant="ghost" className="flex-1" onClick={() => { setShowCategoryForm(false); setNewCategoryName(''); }}>
                            キャンセル
                          </Button>
                          <Button
                            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                            onClick={handleSaveCategory}
                            disabled={!newCategoryName.trim()}
                          >
                            追加する
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : !editingCategoryId ? (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setShowCategoryForm(true)}
                      className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-cyan-400 hover:text-cyan-500 hover:bg-cyan-50/50 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="font-medium">カテゴリーを追加</span>
                    </motion.button>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            )}

            {/* === 社内メンバータブ === */}
            {activeTab === 'internal' && (
              <motion.div
                key="internal"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <div className="space-y-2 mb-4">
                  {internalUsers.map(user => (
                    <div key={user.id}>
                      {editingInternalId === user.id ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-4 bg-cyan-50 rounded-xl space-y-3 border-2 border-cyan-200"
                        >
                          <Input
                            placeholder="名前"
                            value={newInternalName}
                            onChange={(e) => setNewInternalName(e.target.value)}
                            className="h-11 bg-white"
                            autoFocus
                          />
                          <Input
                            placeholder="メールアドレス"
                            type="email"
                            value={newInternalEmail}
                            onChange={(e) => setNewInternalEmail(e.target.value)}
                            className="h-11 bg-white"
                          />
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="flex-1" onClick={cancelEditInternal}>
                              キャンセル
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteInternal(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                              onClick={handleSaveInternal}
                              disabled={!newInternalName.trim()}
                            >
                              保存
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.button
                          layout
                          onClick={() => startEditInternal(user)}
                          disabled={user.id === currentUserId}
                          className={cn(
                            "w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl transition-colors text-left",
                            user.id === currentUserId ? "cursor-default" : "hover:bg-slate-100"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center text-cyan-700 font-medium text-sm">
                              {user.name.slice(0, 1)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-700 text-sm flex items-center gap-2">
                                {user.name}
                                {user.id === currentUserId && (
                                  <span className="text-xs text-cyan-600 font-normal">自分</span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400">{user.email}</p>
                            </div>
                          </div>
                          {user.id !== currentUserId && <ChevronRight className="h-4 w-4 text-slate-300" />}
                        </motion.button>
                      )}
                    </div>
                  ))}
                </div>

                <AnimatePresence>
                  {showInternalForm && !editingInternalId ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                        <Input
                          placeholder="名前"
                          value={newInternalName}
                          onChange={(e) => setNewInternalName(e.target.value)}
                          className="h-11 bg-white"
                          autoFocus
                        />
                        <Input
                          placeholder="メールアドレス（任意）"
                          type="email"
                          value={newInternalEmail}
                          onChange={(e) => setNewInternalEmail(e.target.value)}
                          className="h-11 bg-white"
                        />
                        <div className="flex gap-2 pt-2">
                          <Button variant="ghost" className="flex-1" onClick={() => { setShowInternalForm(false); setNewInternalName(''); setNewInternalEmail(''); }}>
                            キャンセル
                          </Button>
                          <Button
                            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                            onClick={handleSaveInternal}
                            disabled={!newInternalName.trim()}
                          >
                            追加する
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : !editingInternalId ? (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setShowInternalForm(true)}
                      className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-cyan-400 hover:text-cyan-500 hover:bg-cyan-50/50 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="font-medium">メンバーを追加</span>
                    </motion.button>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            )}

            {/* === クライアントタブ === */}
            {activeTab === 'clients' && (
              <motion.div
                key="clients"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <div className="space-y-2 mb-4">
                  {clients.map(client => (
                    <div key={client.id}>
                      {editingClientId === client.id ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-4 bg-cyan-50 rounded-xl space-y-3 border-2 border-cyan-200"
                        >
                          <Input
                            placeholder="担当者名"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            className="h-11 bg-white"
                            autoFocus
                          />
                          <Input
                            placeholder="会社名"
                            value={newClientCompany}
                            onChange={(e) => setNewClientCompany(e.target.value)}
                            className="h-11 bg-white"
                          />
                          <Input
                            placeholder="メールアドレス"
                            type="email"
                            value={newClientEmail}
                            onChange={(e) => setNewClientEmail(e.target.value)}
                            className="h-11 bg-white"
                          />
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="flex-1" onClick={cancelEditClient}>
                              キャンセル
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteClient(client.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                              onClick={handleSaveClient}
                              disabled={!newClientName.trim()}
                            >
                              保存
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.button
                          layout
                          onClick={() => startEditClient(client)}
                          className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-700 font-medium text-sm">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-700 text-sm">{client.company || client.name}</p>
                              <p className="text-xs text-slate-400">{client.company ? client.name : client.email}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </motion.button>
                      )}
                    </div>
                  ))}
                  
                  {clients.length === 0 && !showClientForm && (
                    <p className="text-center text-slate-400 py-8">クライアントがいません</p>
                  )}
                </div>

                <AnimatePresence>
                  {showClientForm && !editingClientId ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                        <Input
                          placeholder="担当者名"
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          className="h-11 bg-white"
                          autoFocus
                        />
                        <Input
                          placeholder="会社名（任意）"
                          value={newClientCompany}
                          onChange={(e) => setNewClientCompany(e.target.value)}
                          className="h-11 bg-white"
                        />
                        <Input
                          placeholder="メールアドレス（任意）"
                          type="email"
                          value={newClientEmail}
                          onChange={(e) => setNewClientEmail(e.target.value)}
                          className="h-11 bg-white"
                        />
                        <div className="flex gap-2 pt-2">
                          <Button variant="ghost" className="flex-1" onClick={() => { setShowClientForm(false); setNewClientName(''); setNewClientEmail(''); setNewClientCompany(''); }}>
                            キャンセル
                          </Button>
                          <Button
                            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                            onClick={handleSaveClient}
                            disabled={!newClientName.trim()}
                          >
                            追加する
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : !editingClientId ? (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setShowClientForm(true)}
                      className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-cyan-400 hover:text-cyan-500 hover:bg-cyan-50/50 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="font-medium">クライアントを追加</span>
                    </motion.button>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* フッター */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
