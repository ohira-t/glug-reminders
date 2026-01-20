'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, ChevronRight, Building2, Users, Folder, Loader2, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Category, User } from '@/types';
import { cn } from '@/lib/utils';
import { 
  inviteUser, 
  createUserWithPassword, 
  updateUserProfile, 
  deleteUser 
} from '@/lib/supabase/admin';

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
  onRefresh?: () => void;
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
  onRefresh,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // カテゴリー追加/編集
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(colorPresets[5].color);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  
  // 社内メンバー追加/編集
  const [newInternalName, setNewInternalName] = useState('');
  const [newInternalEmail, setNewInternalEmail] = useState('');
  const [newInternalPassword, setNewInternalPassword] = useState('');
  const [showInternalForm, setShowInternalForm] = useState(false);
  const [editingInternalId, setEditingInternalId] = useState<string | null>(null);
  const [useInvite, setUseInvite] = useState(false);
  
  // クライアント追加/編集
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('');
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [useClientInvite, setUseClientInvite] = useState(false);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

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

  const handleSaveInternal = async () => {
    if (!newInternalName.trim() || !newInternalEmail.trim()) return;
    
    setIsLoading(true);
    
    try {
      if (editingInternalId) {
        // 既存ユーザーの更新
        const result = await updateUserProfile(editingInternalId, {
          name: newInternalName.trim(),
        });
        
        if (result.success) {
          showMessage('success', result.message);
          onRefresh?.();
        } else {
          showMessage('error', result.message);
        }
        setEditingInternalId(null);
      } else {
        // 新規ユーザーの作成
        let result;
        if (useInvite) {
          result = await inviteUser({
            email: newInternalEmail.trim(),
            name: newInternalName.trim(),
            type: 'internal',
            role: 'staff',
          });
        } else {
          if (!newInternalPassword) {
            showMessage('error', 'パスワードを入力してください');
            setIsLoading(false);
            return;
          }
          result = await createUserWithPassword({
            email: newInternalEmail.trim(),
            name: newInternalName.trim(),
            type: 'internal',
            role: 'staff',
            password: newInternalPassword,
          });
        }
        
        if (result.success) {
          showMessage('success', result.message);
          onRefresh?.();
          setShowInternalForm(false);
        } else {
          showMessage('error', result.message);
        }
      }
    } catch (err) {
      showMessage('error', 'エラーが発生しました');
    } finally {
      setIsLoading(false);
      setNewInternalName('');
      setNewInternalEmail('');
      setNewInternalPassword('');
    }
  };

  const cancelEditInternal = () => {
    setEditingInternalId(null);
    setNewInternalName('');
    setNewInternalEmail('');
    setNewInternalPassword('');
  };

  const handleDeleteInternal = async (id: string) => {
    if (id === currentUserId) return;
    
    if (!confirm('このユーザーを削除しますか？')) return;
    
    setIsLoading(true);
    try {
      const result = await deleteUser(id);
      if (result.success) {
        showMessage('success', result.message);
        onRefresh?.();
      } else {
        showMessage('error', result.message);
      }
    } catch (err) {
      showMessage('error', 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
    
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

  const handleSaveClient = async () => {
    if (!newClientName.trim() || !newClientEmail.trim()) return;
    
    setIsLoading(true);
    
    try {
      if (editingClientId) {
        // 既存クライアントの更新
        const result = await updateUserProfile(editingClientId, {
          name: newClientName.trim(),
          company: newClientCompany.trim() || undefined,
        });
        
        if (result.success) {
          showMessage('success', result.message);
          onRefresh?.();
        } else {
          showMessage('error', result.message);
        }
        setEditingClientId(null);
      } else {
        // 新規クライアントの作成
        let result;
        if (useClientInvite) {
          result = await inviteUser({
            email: newClientEmail.trim(),
            name: newClientName.trim(),
            type: 'client',
            role: 'staff',
            company: newClientCompany.trim() || undefined,
          });
        } else {
          if (!newClientPassword) {
            showMessage('error', 'パスワードを入力してください');
            setIsLoading(false);
            return;
          }
          result = await createUserWithPassword({
            email: newClientEmail.trim(),
            name: newClientName.trim(),
            type: 'client',
            role: 'staff',
            company: newClientCompany.trim() || undefined,
            password: newClientPassword,
          });
        }
        
        if (result.success) {
          showMessage('success', result.message);
          onRefresh?.();
          setShowClientForm(false);
        } else {
          showMessage('error', result.message);
        }
      }
    } catch (err) {
      showMessage('error', 'エラーが発生しました');
    } finally {
      setIsLoading(false);
      setNewClientName('');
      setNewClientEmail('');
      setNewClientCompany('');
      setNewClientPassword('');
    }
  };

  const cancelEditClient = () => {
    setEditingClientId(null);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientCompany('');
    setNewClientPassword('');
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('このクライアントを削除しますか？')) return;
    
    setIsLoading(true);
    try {
      const result = await deleteUser(id);
      if (result.success) {
        showMessage('success', result.message);
        onRefresh?.();
      } else {
        showMessage('error', result.message);
      }
    } catch (err) {
      showMessage('error', 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
    
    if (editingClientId === id) cancelEditClient();
  };

  const tabs = [
    { id: 'categories' as TabType, label: 'カテゴリー', icon: Folder },
    { id: 'internal' as TabType, label: '社内メンバー', icon: Users },
    { id: 'clients' as TabType, label: 'クライアント', icon: Building2 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 bg-white rounded-3xl overflow-hidden [&>button]:hidden">
        <DialogTitle className="sr-only">設定</DialogTitle>
        
        {/* グラバー */}
        <div className="pt-3 pb-2">
          <div className="w-9 h-1 bg-[#C6C6C8] rounded-full mx-auto" />
        </div>

        {/* メッセージ */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "mx-4 mb-2 px-4 py-2 rounded-xl text-sm font-medium",
                message.type === 'success' 
                  ? "bg-[#34C759]/10 text-[#34C759]" 
                  : "bg-[#FF3B30]/10 text-[#FF3B30]"
              )}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* iOS風セグメントコントロール */}
        <div className="px-4 pb-4">
          <div className="bg-[#F2F2F7] rounded-xl p-1 flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5",
                  activeTab === tab.id
                    ? "bg-white text-[#1C1C1E] shadow-sm"
                    : "text-[#8E8E93] hover:text-[#1C1C1E]"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* コンテンツ */}
        <div className="px-4 pb-6 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* カテゴリータブ */}
            {activeTab === 'categories' && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                {/* カテゴリー一覧 */}
                <div className="space-y-2 mb-4">
                  {categories.map((category) => (
                    <div key={category.id}>
                      {editingCategoryId === category.id ? (
                        <div className="bg-[#F2F2F7] rounded-xl p-3 space-y-3">
                          <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="カテゴリー名"
                            className="bg-white border-[#C6C6C8]"
                            autoFocus
                          />
                          <div className="flex flex-wrap gap-2">
                            {colorPresets.map((preset) => (
                              <button
                                key={preset.color}
                                type="button"
                                onClick={() => setNewCategoryColor(preset.color)}
                                className={cn(
                                  "w-8 h-8 rounded-full transition-all flex items-center justify-center",
                                  newCategoryColor === preset.color && "ring-2 ring-offset-2 ring-[#007AFF]"
                                )}
                                style={{ backgroundColor: preset.color }}
                              >
                                {newCategoryColor === preset.color && (
                                  <Check className="h-4 w-4 text-white" />
                                )}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditCategory}
                              className="flex-1 text-[#8E8E93]"
                            >
                              キャンセル
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-[#FF3B30]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveCategory}
                              className="flex-1 bg-[#007AFF] hover:bg-[#007AFF]/90"
                            >
                              保存
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditCategory(category)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F2F2F7] transition-colors text-left"
                        >
                          <div 
                            className="w-5 h-5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="flex-1 text-[#1C1C1E]">{category.name}</span>
                          <ChevronRight className="h-4 w-4 text-[#C6C6C8]" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* カテゴリー追加フォーム */}
                <AnimatePresence>
                  {showCategoryForm ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-[#F2F2F7] rounded-xl p-3 space-y-3"
                    >
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="カテゴリー名"
                        className="bg-white border-[#C6C6C8]"
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-2">
                        {colorPresets.map((preset) => (
                          <button
                            key={preset.color}
                            type="button"
                            onClick={() => setNewCategoryColor(preset.color)}
                            className={cn(
                              "w-8 h-8 rounded-full transition-all flex items-center justify-center",
                              newCategoryColor === preset.color && "ring-2 ring-offset-2 ring-[#007AFF]"
                            )}
                            style={{ backgroundColor: preset.color }}
                          >
                            {newCategoryColor === preset.color && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowCategoryForm(false);
                            setNewCategoryName('');
                          }}
                          className="flex-1 text-[#8E8E93]"
                        >
                          キャンセル
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveCategory}
                          className="flex-1 bg-[#007AFF] hover:bg-[#007AFF]/90"
                        >
                          追加
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => setShowCategoryForm(true)}
                      className="w-full justify-start text-[#007AFF] hover:bg-[#007AFF]/5"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      カテゴリーを追加
                    </Button>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* 社内メンバータブ */}
            {activeTab === 'internal' && (
              <motion.div
                key="internal"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                {/* メンバー一覧 */}
                <div className="space-y-2 mb-4">
                  {internalUsers.map((user) => (
                    <div key={user.id}>
                      {editingInternalId === user.id ? (
                        <div className="bg-[#F2F2F7] rounded-xl p-3 space-y-3">
                          <Input
                            value={newInternalName}
                            onChange={(e) => setNewInternalName(e.target.value)}
                            placeholder="名前"
                            className="bg-white border-[#C6C6C8]"
                            autoFocus
                          />
                          <Input
                            value={newInternalEmail}
                            disabled
                            className="bg-[#E5E5EA] border-[#C6C6C8] text-[#8E8E93]"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditInternal}
                              className="flex-1 text-[#8E8E93]"
                              disabled={isLoading}
                            >
                              キャンセル
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteInternal(user.id)}
                              className="text-[#FF3B30]"
                              disabled={isLoading || user.id === currentUserId}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveInternal}
                              className="flex-1 bg-[#007AFF] hover:bg-[#007AFF]/90"
                              disabled={isLoading}
                            >
                              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '保存'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditInternal(user)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left",
                            user.id === currentUserId 
                              ? "bg-[#007AFF]/5 cursor-default" 
                              : "hover:bg-[#F2F2F7]"
                          )}
                        >
                          <div className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {user.name.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[#1C1C1E] truncate">
                              {user.name}
                              {user.id === currentUserId && (
                                <span className="text-xs text-[#007AFF] ml-2">（自分）</span>
                              )}
                            </p>
                            <p className="text-xs text-[#8E8E93] truncate">{user.email}</p>
                          </div>
                          {user.id !== currentUserId && (
                            <ChevronRight className="h-4 w-4 text-[#C6C6C8] flex-shrink-0" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* メンバー追加フォーム */}
                <AnimatePresence>
                  {showInternalForm ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-[#F2F2F7] rounded-xl p-3 space-y-3"
                    >
                      <Input
                        value={newInternalName}
                        onChange={(e) => setNewInternalName(e.target.value)}
                        placeholder="名前"
                        className="bg-white border-[#C6C6C8]"
                        autoFocus
                      />
                      <Input
                        type="email"
                        value={newInternalEmail}
                        onChange={(e) => setNewInternalEmail(e.target.value)}
                        placeholder="メールアドレス"
                        className="bg-white border-[#C6C6C8]"
                      />
                      
                      {/* 招待/直接作成の切り替え */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setUseInvite(!useInvite)}
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                            useInvite 
                              ? "bg-[#007AFF] border-[#007AFF]" 
                              : "border-[#C6C6C8]"
                          )}
                        >
                          {useInvite && <Check className="h-3 w-3 text-white" />}
                        </button>
                        <span className="text-sm text-[#8E8E93] flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          招待メールを送信
                        </span>
                      </div>

                      {!useInvite && (
                        <Input
                          type="password"
                          value={newInternalPassword}
                          onChange={(e) => setNewInternalPassword(e.target.value)}
                          placeholder="初期パスワード"
                          className="bg-white border-[#C6C6C8]"
                        />
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowInternalForm(false);
                            setNewInternalName('');
                            setNewInternalEmail('');
                            setNewInternalPassword('');
                          }}
                          className="flex-1 text-[#8E8E93]"
                          disabled={isLoading}
                        >
                          キャンセル
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveInternal}
                          className="flex-1 bg-[#007AFF] hover:bg-[#007AFF]/90"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : useInvite ? (
                            '招待を送信'
                          ) : (
                            '追加'
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => setShowInternalForm(true)}
                      className="w-full justify-start text-[#007AFF] hover:bg-[#007AFF]/5"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      メンバーを追加
                    </Button>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* クライアントタブ */}
            {activeTab === 'clients' && (
              <motion.div
                key="clients"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                {/* クライアント一覧 */}
                <div className="space-y-2 mb-4">
                  {clients.map((client) => (
                    <div key={client.id}>
                      {editingClientId === client.id ? (
                        <div className="bg-[#F2F2F7] rounded-xl p-3 space-y-3">
                          <Input
                            value={newClientCompany}
                            onChange={(e) => setNewClientCompany(e.target.value)}
                            placeholder="会社名（任意）"
                            className="bg-white border-[#C6C6C8]"
                          />
                          <Input
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            placeholder="担当者名"
                            className="bg-white border-[#C6C6C8]"
                            autoFocus
                          />
                          <Input
                            value={newClientEmail}
                            disabled
                            className="bg-[#E5E5EA] border-[#C6C6C8] text-[#8E8E93]"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditClient}
                              className="flex-1 text-[#8E8E93]"
                              disabled={isLoading}
                            >
                              キャンセル
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClient(client.id)}
                              className="text-[#FF3B30]"
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveClient}
                              className="flex-1 bg-[#007AFF] hover:bg-[#007AFF]/90"
                              disabled={isLoading}
                            >
                              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '保存'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditClient(client)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F2F2F7] transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#FF9500] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {client.name.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[#1C1C1E] truncate">
                              {client.company ? `${client.company}（${client.name}）` : client.name}
                            </p>
                            <p className="text-xs text-[#8E8E93] truncate">{client.email}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-[#C6C6C8] flex-shrink-0" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* クライアント追加フォーム */}
                <AnimatePresence>
                  {showClientForm ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-[#F2F2F7] rounded-xl p-3 space-y-3"
                    >
                      <Input
                        value={newClientCompany}
                        onChange={(e) => setNewClientCompany(e.target.value)}
                        placeholder="会社名（任意）"
                        className="bg-white border-[#C6C6C8]"
                      />
                      <Input
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="担当者名"
                        className="bg-white border-[#C6C6C8]"
                        autoFocus
                      />
                      <Input
                        type="email"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        placeholder="メールアドレス"
                        className="bg-white border-[#C6C6C8]"
                      />
                      
                      {/* 招待/直接作成の切り替え */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setUseClientInvite(!useClientInvite)}
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                            useClientInvite 
                              ? "bg-[#007AFF] border-[#007AFF]" 
                              : "border-[#C6C6C8]"
                          )}
                        >
                          {useClientInvite && <Check className="h-3 w-3 text-white" />}
                        </button>
                        <span className="text-sm text-[#8E8E93] flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          招待メールを送信
                        </span>
                      </div>

                      {!useClientInvite && (
                        <Input
                          type="password"
                          value={newClientPassword}
                          onChange={(e) => setNewClientPassword(e.target.value)}
                          placeholder="初期パスワード"
                          className="bg-white border-[#C6C6C8]"
                        />
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowClientForm(false);
                            setNewClientName('');
                            setNewClientEmail('');
                            setNewClientCompany('');
                            setNewClientPassword('');
                          }}
                          className="flex-1 text-[#8E8E93]"
                          disabled={isLoading}
                        >
                          キャンセル
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveClient}
                          className="flex-1 bg-[#007AFF] hover:bg-[#007AFF]/90"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : useClientInvite ? (
                            '招待を送信'
                          ) : (
                            '追加'
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => setShowClientForm(true)}
                      className="w-full justify-start text-[#007AFF] hover:bg-[#007AFF]/5"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      クライアントを追加
                    </Button>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
