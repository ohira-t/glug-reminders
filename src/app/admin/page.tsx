'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Folder, 
  Users, 
  Building2, 
  Plus, 
  Trash2, 
  Check, 
  ChevronRight,
  Settings,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Category, User } from '@/types';
import { 
  categories as initialCategories, 
  mockUsers as initialUsers,
  mockClients as initialClients,
  mockTasks,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

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

type TabType = 'overview' | 'categories' | 'internal' | 'clients';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [internalUsers, setInternalUsers] = useState<User[]>(initialUsers);
  const [clients, setClients] = useState<User[]>(initialClients);
  
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

  // 統計情報
  const stats = useMemo(() => {
    const allTasks = mockTasks;
    const activeTasks = allTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
    const completedTasks = allTasks.filter(t => t.status === 'done');
    const overdueTasks = activeTasks.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date();
    });
    
    return {
      totalTasks: allTasks.length,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      totalCategories: categories.length,
      totalInternalUsers: internalUsers.length,
      totalClients: clients.length,
    };
  }, [categories.length, internalUsers.length, clients.length]);

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
      setCategories(categories.map(c => 
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
      setCategories([...categories, newCategory]);
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
    setCategories(categories.filter(c => c.id !== id));
    if (editingCategoryId === id) cancelEditCategory();
  };

  // === 社内メンバー ===
  const startEditInternal = (user: User) => {
    setEditingInternalId(user.id);
    setNewInternalName(user.name);
    setNewInternalEmail(user.email);
    setShowInternalForm(false);
  };

  const handleSaveInternal = () => {
    if (!newInternalName.trim()) return;
    
    if (editingInternalId) {
      setInternalUsers(internalUsers.map(u => 
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
      setInternalUsers([...internalUsers, newUser]);
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
    setInternalUsers(internalUsers.filter(u => u.id !== id));
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
      setClients(clients.map(c => 
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
      setClients([...clients, newClient]);
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
    setClients(clients.filter(c => c.id !== id));
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

  const menuItems = [
    { id: 'overview' as TabType, label: '概要', icon: BarChart3 },
    { id: 'categories' as TabType, label: 'カテゴリー', icon: Folder, count: categories.length },
    { id: 'internal' as TabType, label: '社内メンバー', icon: Users, count: internalUsers.length },
    { id: 'clients' as TabType, label: 'クライアント', icon: Building2, count: clients.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">管理画面</h1>
                <p className="text-xs text-slate-400">GLUG Reminders</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* サイドバー */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all",
                    activeTab === item.id
                      ? "bg-cyan-50 text-cyan-700"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <Badge variant="secondary" className={cn(
                      "text-xs",
                      activeTab === item.id ? "bg-cyan-100 text-cyan-700" : "bg-slate-100"
                    )}>
                      {item.count}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* メインコンテンツ */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* === 概要タブ === */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-slate-900">ダッシュボード概要</h2>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200">
                      <p className="text-sm text-slate-500 mb-1">全タスク</p>
                      <p className="text-3xl font-bold text-slate-900">{stats.totalTasks}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-200">
                      <p className="text-sm text-slate-500 mb-1">進行中</p>
                      <p className="text-3xl font-bold text-cyan-600">{stats.activeTasks}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-200">
                      <p className="text-sm text-slate-500 mb-1">完了済み</p>
                      <p className="text-3xl font-bold text-green-600">{stats.completedTasks}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-200">
                      <p className="text-sm text-slate-500 mb-1">期限超過</p>
                      <p className="text-3xl font-bold text-red-500">{stats.overdueTasks}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => handleTabChange('categories')}
                      className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-cyan-300 hover:shadow-sm transition-all text-left"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                          <Folder className="h-5 w-5 text-pink-600" />
                        </div>
                        <span className="font-medium text-slate-700">カテゴリー</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{stats.totalCategories}</p>
                    </button>
                    <button
                      onClick={() => handleTabChange('internal')}
                      className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-cyan-300 hover:shadow-sm transition-all text-left"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-cyan-600" />
                        </div>
                        <span className="font-medium text-slate-700">社内メンバー</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{stats.totalInternalUsers}</p>
                    </button>
                    <button
                      onClick={() => handleTabChange('clients')}
                      className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-cyan-300 hover:shadow-sm transition-all text-left"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-orange-600" />
                        </div>
                        <span className="font-medium text-slate-700">クライアント</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{stats.totalClients}</p>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* === カテゴリータブ === */}
              {activeTab === 'categories' && (
                <motion.div
                  key="categories"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">カテゴリー管理</h2>
                    {!showCategoryForm && !editingCategoryId && (
                      <Button
                        onClick={() => setShowCategoryForm(true)}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        新規追加
                      </Button>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
                    <AnimatePresence>
                      {showCategoryForm && !editingCategoryId && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-5 bg-cyan-50 space-y-4">
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
                      )}
                    </AnimatePresence>
                    
                    {categories.map(category => (
                      <div key={category.id}>
                        {editingCategoryId === category.id ? (
                          <div className="p-5 bg-cyan-50 space-y-4">
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
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditCategory(category)}
                            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className="w-6 h-6 rounded-full shadow-sm"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="font-medium text-slate-700">{category.name}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {categories.length === 0 && !showCategoryForm && (
                      <p className="text-center text-slate-400 py-12">カテゴリーがありません</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* === 社内メンバータブ === */}
              {activeTab === 'internal' && (
                <motion.div
                  key="internal"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">社内メンバー管理</h2>
                    {!showInternalForm && !editingInternalId && (
                      <Button
                        onClick={() => setShowInternalForm(true)}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        新規追加
                      </Button>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
                    <AnimatePresence>
                      {showInternalForm && !editingInternalId && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-5 bg-cyan-50 space-y-4">
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
                      )}
                    </AnimatePresence>
                    
                    {internalUsers.map(user => (
                      <div key={user.id}>
                        {editingInternalId === user.id ? (
                          <div className="p-5 bg-cyan-50 space-y-4">
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
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditInternal(user)}
                            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center text-cyan-700 font-medium">
                                {user.name.slice(0, 1)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-700">{user.name}</p>
                                <p className="text-sm text-slate-400">{user.email}</p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* === クライアントタブ === */}
              {activeTab === 'clients' && (
                <motion.div
                  key="clients"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">クライアント管理</h2>
                    {!showClientForm && !editingClientId && (
                      <Button
                        onClick={() => setShowClientForm(true)}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        新規追加
                      </Button>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
                    <AnimatePresence>
                      {showClientForm && !editingClientId && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-5 bg-cyan-50 space-y-4">
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
                      )}
                    </AnimatePresence>
                    
                    {clients.map(client => (
                      <div key={client.id}>
                        {editingClientId === client.id ? (
                          <div className="p-5 bg-cyan-50 space-y-4">
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
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditClient(client)}
                            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-700">
                                <Building2 className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-700">{client.company || client.name}</p>
                                <p className="text-sm text-slate-400">{client.company ? client.name : client.email}</p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {clients.length === 0 && !showClientForm && (
                      <p className="text-center text-slate-400 py-12">クライアントがいません</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
