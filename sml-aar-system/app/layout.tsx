import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SML & AAR 智能管理系统',
  description: '单一数据源 · 异常管理 · AI 风险预警',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
