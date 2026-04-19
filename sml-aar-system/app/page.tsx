'use client';

import { useEffect, useState } from 'react';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Download,
  Eye,
} from 'lucide-react';

type PartRow = {
  id: number;
  partNumber: string;
  partName: string;
  colorCode: string;
  configLevel: string;
  dreOwner: string;
  supplier: string;
  latestRound: string;
  latestStatus: string;
  plannedDate: string;
  actualDate: string | null;
  remark: string | null;
  riskLevel: 'HIGH' | 'LOW';
  riskReason: string | null;
  trackingId: number | null;
  hasResult: boolean;
};

type Stats = {
  total: number;
  approvedRatio: number;
  highRiskCount: number;
};

export default function Dashboard() {
  const [rows, setRows] = useState<PartRow[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    approvedRatio: 0,
    highRiskCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDre, setFilterDre] = useState<string>('ALL');
  const [filterSupplier, setFilterSupplier] = useState<string>('ALL');

  useEffect(() => {
    fetch('/api/parts')
      .then((r) => r.json())
      .then((data) => {
        setRows(data.rows || []);
        setStats(data.stats || { total: 0, approvedRatio: 0, highRiskCount: 0 });
        setLoading(false);
      })
      .catch((err) => {
        console.error('加载失败:', err);
        setLoading(false);
      });
  }, []);

  const filtered = rows.filter(
    (r) =>
      (filterStatus === 'ALL' || r.latestStatus === filterStatus) &&
      (filterDre === 'ALL' || r.dreOwner === filterDre) &&
      (filterSupplier === 'ALL' || r.supplier === filterSupplier)
  );

  const dreOptions = Array.from(new Set(rows.map((r) => r.dreOwner)));
  const supplierOptions = Array.from(new Set(rows.map((r) => r.supplier)));
  const highRiskRows = rows.filter((r) => r.riskLevel === 'HIGH');

  const handleExportAAR = async (row: PartRow) => {
    if (!row.trackingId) return;
    if (!row.hasResult) {
      alert('该零件尚未录入评审数据，无法生成 AAR');
      return;
    }
    try {
      const res = await fetch(`/api/aar/export?trackingId=${row.trackingId}`);
      if (!res.ok) {
        const err = await res.json();
        alert(`导出失败：${err.error || '未知错误'}`);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AAR_${row.partNumber}_${row.latestRound}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('导出异常，请检查控制台');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-8 py-10">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          SML & AAR 智能管理系统
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          单一数据源 · 异常管理 · AI 风险预警
        </p>
      </header>

      {loading ? (
        <div className="text-center py-20 text-stone-400 text-sm">加载中...</div>
      ) : (
        <>
          <section className="grid grid-cols-3 gap-4 mb-10">
            <StatCard
              icon={<Package size={18} />}
              label="总零件数"
              value={stats.total.toString()}
              tone="neutral"
            />
            <StatCard
              icon={<CheckCircle2 size={18} />}
              label="AAR 已签发比例"
              value={`${(stats.approvedRatio * 100).toFixed(0)}%`}
              tone="positive"
            />
            <StatCard
              icon={<AlertTriangle size={18} />}
              label="高风险预警"
              value={stats.highRiskCount.toString()}
              tone="warning"
            />
          </section>

          {highRiskRows.length > 0 && (
            <section className="mb-10 rounded-xl border border-amber-200 bg-amber-50/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-amber-600" />
                <h2 className="text-sm font-medium text-amber-900">AI 风险看板</h2>
                <span className="text-xs text-amber-700 ml-1">
                  · 共 {highRiskRows.length} 项需关注
                </span>
              </div>
              <div className="space-y-2">
                {highRiskRows.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start justify-between py-2 border-b border-amber-100 last:border-0">
                    <div>
                      <div className="text-sm font-medium">
                        {r.partName}{' '}
                        <span className="text-stone-400 font-normal">
                          · {r.partNumber}
                        </span>
                      </div>
                      <div className="text-xs text-stone-600 mt-0.5">
                        {r.riskReason}
                      </div>
                    </div>
                    <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded whitespace-nowrap">
                      {r.latestRound} · {r.latestStatus}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium">SML 数据台</h2>
              <div className="flex gap-2 text-xs">
                <FilterSelect
                  label="状态"
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={['ALL', '待收', '待审', '打回', 'AAR签发']}
                />
                <FilterSelect
                  label="DRE"
                  value={filterDre}
                  onChange={setFilterDre}
                  options={['ALL', ...dreOptions]}
                />
                <FilterSelect
                  label="供应商"
                  value={filterSupplier}
                  onChange={setFilterSupplier}
                  options={['ALL', ...supplierOptions]}
                />
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-stone-600 text-xs">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">零件</th>
                    <th className="text-left px-4 py-3 font-medium">颜色/材质</th>
                    <th className="text-left px-4 py-3 font-medium">配置</th>
                    <th className="text-left px-4 py-3 font-medium">DRE</th>
                    <th className="text-left px-4 py-3 font-medium">供应商</th>
                    <th className="text-left px-4 py-3 font-medium">轮次</th>
                    <th className="text-left px-4 py-3 font-medium">状态</th>
                    <th className="text-right px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-stone-100 hover:bg-stone-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.partName}</div>
                        <div className="text-xs text-stone-400">
                          {r.partNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stone-600">{r.colorCode}</td>
                      <td className="px-4 py-3 text-stone-600">{r.configLevel}</td>
                      <td className="px-4 py-3 text-stone-600">{r.dreOwner}</td>
                      <td className="px-4 py-3 text-stone-600">{r.supplier}</td>
                      <td className="px-4 py-3 text-stone-600">{r.latestRound}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.latestStatus} risk={r.riskLevel} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-100 rounded transition">
                            <Eye size={12} /> 录入评审
                          </button>
                          <button
                            onClick={() => handleExportAAR(r)}
                            disabled={!r.hasResult}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-900 hover:text-white rounded transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-stone-700">
                            <Download size={12} /> 生成AAR
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-10 text-stone-400 text-sm">
                  无匹配数据
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'neutral' | 'positive' | 'warning';
}) {
  const toneClass = {
    neutral: 'text-stone-700 bg-stone-100',
    positive: 'text-emerald-700 bg-emerald-50',
    warning: 'text-amber-700 bg-amber-50',
  }[tone];
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-stone-500">{label}</span>
        <span className={`p-1.5 rounded-lg ${toneClass}`}>{icon}</span>
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-stone-200 rounded-md px-2.5 py-1.5 bg-white hover:border-stone-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-stone-400">
      {options.map((o) => (
        <option key={o} value={o}>
          {label}: {o === 'ALL' ? '全部' : o}
        </option>
      ))}
    </select>
  );
}

function StatusBadge({
  status,
  risk,
}: {
  status: string;
  risk: 'HIGH' | 'LOW';
}) {
  const map: Record<string, string> = {
    待收: 'bg-stone-100 text-stone-600',
    待审: 'bg-blue-50 text-blue-700',
    打回: 'bg-red-50 text-red-700',
    AAR签发: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`px-2 py-0.5 rounded text-xs ${map[status] || 'bg-stone-100'}`}>
        {status}
      </span>
      {risk === 'HIGH' && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="高风险" />
      )}
    </span>
  );
}
