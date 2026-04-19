// ============================================================
// AI 风险预警规则引擎
// v1: 基于规则 (rule-based) — 可解释、零成本、可快速迭代
// v2 (TODO): 接 LLM 对 remark 做语义分类 (排期/模具/材料/认可等)
// ============================================================

export type TrackingLike = {
  plannedDate: Date;
  actualDate: Date | null;
  status: string;
  remark: string | null;
};

export type RiskAssessment = {
  level: 'HIGH' | 'LOW';
  reason: string | null;
};

/**
 * 评估单条送样追踪记录的风险等级
 */
export function assessRisk(t: TrackingLike): RiskAssessment {
  const reasons: string[] = [];

  // --- 规则 1: 实际日期晚于计划日期 (已延期) ---
  if (t.actualDate && t.actualDate > t.plannedDate) {
    const days = Math.ceil(
      (t.actualDate.getTime() - t.plannedDate.getTime()) / 86400000
    );
    reasons.push(`实际送样较计划延期 ${days} 天`);
  }

  // --- 规则 2: 计划日已过但仍未到样 (预期延期) ---
  if (!t.actualDate && new Date() > t.plannedDate) {
    const days = Math.ceil((Date.now() - t.plannedDate.getTime()) / 86400000);
    reasons.push(`超过计划日 ${days} 天仍未到样`);
  }

  // --- 规则 3: 打回状态 + 备注含高风险关键词 ---
  const KEYWORDS = ['修模', '模具', '材料', '排期', '重新', '咬花', '补模', '换料'];
  if (t.status === '打回' && t.remark) {
    const hit = KEYWORDS.filter((k) => t.remark!.includes(k));
    if (hit.length) {
      reasons.push(`打回原因涉及 [${hit.join('/')}]，修复周期长`);
    }
  }

  return reasons.length > 0
    ? { level: 'HIGH', reason: reasons.join('；') }
    : { level: 'LOW', reason: null };
}
