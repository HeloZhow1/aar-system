import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assessRisk } from '@/lib/risk';

// ============================================================
// GET /api/parts
// 返回所有零件 + 最新一轮送样状态 + AI 风险评估 + 仪表盘指标
// ============================================================
export async function GET() {
  try {
    // 1. 拉取所有 SML，并带上最新一轮 tracking + 评审结果
    const smls = await prisma.sml.findMany({
      orderBy: { id: 'asc' },
      include: {
        trackings: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { result: true },
        },
      },
    });

    // 2. 扁平化 + 跑风险评估
    const rows = smls.map((s) => {
      const latest = s.trackings[0];
      const risk = latest
        ? assessRisk(latest)
        : { level: 'LOW' as const, reason: null };

      return {
        id: s.id,
        partNumber: s.partNumber,
        partName: s.partName,
        colorCode: s.colorCode,
        configLevel: s.configLevel,
        dreOwner: s.dreOwner,
        supplier: s.supplier,
        latestRound: latest?.round ?? '-',
        latestStatus: latest?.status ?? '待收',
        plannedDate: latest?.plannedDate?.toISOString().slice(0, 10) ?? '',
        actualDate: latest?.actualDate?.toISOString().slice(0, 10) ?? null,
        remark: latest?.remark ?? null,
        riskLevel: risk.level,
        riskReason: risk.reason,
        trackingId: latest?.id ?? null,
        hasResult: Boolean(latest?.result),
      };
    });

    // 3. 仪表盘指标
    const stats = {
      total: rows.length,
      approvedRatio: rows.length
        ? rows.filter((r) => r.latestStatus === 'AAR签发').length / rows.length
        : 0,
      highRiskCount: rows.filter((r) => r.riskLevel === 'HIGH').length,
    };

    return NextResponse.json({ rows, stats });
  } catch (err) {
    console.error('[/api/parts] error:', err);
    return NextResponse.json(
      { error: '数据库查询失败，请检查是否已执行 npm run db:init' },
      { status: 500 }
    );
  }
}
