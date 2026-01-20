'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LayoutGrid, Settings, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  const cards = [
    {
      title: '社内スタッフ用',
      description: '自分のタスク管理と、社内メンバー・クライアントへの依頼管理',
      href: '/dashboard',
      icon: LayoutGrid,
      color: 'from-[#007AFF]/80 to-[#007AFF]',
      bgColor: 'bg-[#007AFF]/5',
    },
    {
      title: '管理画面',
      description: 'カテゴリー、社内メンバー、クライアントの管理',
      href: '/admin',
      icon: Settings,
      color: 'from-slate-500 to-slate-700',
      bgColor: 'bg-slate-100',
    },
    {
      title: 'クライアント用',
      description: '依頼されたタスクの確認・対応・コメント',
      href: '/client',
      icon: Mail,
      color: 'from-[#FF9500]/80 to-[#FF9500]',
      bgColor: 'bg-[#FF9500]/5',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col">
      {/* Header */}
      <header className="pt-12 pb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#007AFF]/80 to-[#007AFF] flex items-center justify-center shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#007AFF]">GLUG Reminders</h1>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[#8E8E93] mb-12 text-center"
        >
          アクセスするページを選択してください
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          {cards.map((card, index) => (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
            >
              <Link
                href={card.href}
                className="group block bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 h-full"
              >
                <div className={`w-14 h-14 rounded-2xl ${card.bgColor} flex items-center justify-center mb-5`}>
                  <card.icon className={`h-7 w-7 bg-gradient-to-br ${card.color} bg-clip-text`} style={{ color: card.color.includes('007AFF') ? '#007AFF' : card.color.includes('FF9500') ? '#FF9500' : '#64748b' }} />
                </div>
                <h2 className="text-lg font-semibold text-[#1C1C1E] mb-2 flex items-center gap-2">
                  {card.title}
                  <ArrowRight className="h-4 w-4 text-[#C6C6C8] group-hover:text-[#007AFF] group-hover:translate-x-1 transition-all" />
                </h2>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  {card.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[#C6C6C8] text-sm mt-12 text-center"
        >
          ※ 本番環境ではログイン機能により自動的に適切なページに遷移します
        </motion.p>
      </main>
    </div>
  );
}
