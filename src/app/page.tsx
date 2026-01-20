'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Settings, 
  Inbox, 
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  const pages = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      title: '社内スタッフ用',
      description: '自分のタスク管理と、社内メンバー・クライアントへの依頼管理',
      color: 'from-cyan-400 to-cyan-600',
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
    },
    {
      href: '/admin',
      icon: Settings,
      title: '管理画面',
      description: 'カテゴリー、社内メンバー、クライアントの管理',
      color: 'from-slate-600 to-slate-800',
      bgColor: 'bg-slate-100',
      iconColor: 'text-slate-600',
    },
    {
      href: '/client',
      icon: Inbox,
      title: 'クライアント用',
      description: '依頼されたタスクの確認・対応・コメント',
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* ヘッダー */}
      <header className="py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-transparent">
            GLUG Reminders
          </h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="max-w-4xl w-full">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-slate-500 mb-10"
          >
            アクセスするページを選択してください
          </motion.p>

          <div className="grid md:grid-cols-3 gap-6">
            {pages.map((page, index) => (
              <motion.div
                key={page.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={page.href}
                  className="block bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-lg hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className={`w-14 h-14 rounded-2xl ${page.bgColor} flex items-center justify-center mb-5`}>
                    <page.icon className={`h-7 w-7 ${page.iconColor}`} />
                  </div>
                  
                  <h2 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    {page.title}
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                  </h2>
                  
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {page.description}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <p className="text-xs text-slate-400">
              ※ 本番環境ではログイン機能により自動的に適切なページに遷移します
            </p>
          </motion.div>
        </div>
      </main>

      {/* フッター */}
      <footer className="py-6 text-center">
        <p className="text-xs text-slate-400">
          © 2026 GLUG Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
