import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

// ============================================================
// GET /api/aar/export?trackingId=xxx
// 联查三张表 → 组装 Excel → 返回下载流
// ============================================================
export async function GET(req: NextRequest) {
  const trackingId = Number(req.nextUrl.searchParams.get('trackingId'));
  if (!trackingId) {
    return NextResponse.json({ error: 'trackingId 不能为空' }, { status: 400 });
  }

  const tracking = await prisma.sampleTracking.findUnique({
    where: { id: trackingId },
    include: { sml: true, result: true },
  });

  if (!tracking) {
    return NextResponse.json({ error: '未找到该送样记录' }, { status: 404 });
  }
  if (!tracking.result) {
    return NextResponse.json(
      { error: '尚未录入评审结果，无法生成 AAR' },
      { status: 404 }
    );
  }

  const { sml, result } = tracking;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'SML & AAR System';
  wb.created = new Date();
  const ws = wb.addWorksheet('AAR');
  ws.columns = [{ width: 22 }, { width: 45 }];

  // 标题
  ws.mergeCells('A1:B1');
  const title = ws.getCell('A1');
  title.value = '外观认可报告 (Appearance Approval Report)';
  title.font = { size: 14, bold: true, color: { argb: 'FF1F2937' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  title.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF5F5F4' },
  };
  ws.getRow(1).height = 32;

  ws.mergeCells('A2:B2');
  const subtitle = ws.getCell('A2');
  subtitle.value = `报告生成时间：${new Date().toLocaleString('zh-CN')}`;
  subtitle.font = { size: 9, color: { argb: 'FF78716C' }, italic: true };
  subtitle.alignment = { horizontal: 'center' };

  ws.addRow([]);

  const pairs: [string, string | number][] = [
    ['── 零件信息 ──', ''],
    ['零件号', sml.partNumber],
    ['零件名称', sml.partName],
    ['颜色/材质', sml.colorCode],
    ['配置等级', sml.configLevel],
    ['DRE 负责人', sml.dreOwner],
    ['供应商', sml.supplier],
    ['── 送样信息 ──', ''],
    ['送样轮次', tracking.round],
    ['计划日期', tracking.plannedDate.toISOString().slice(0, 10)],
    ['实际日期', tracking.actualDate?.toISOString().slice(0, 10) ?? '-'],
    ['当前状态', tracking.status],
    ['沟通备注', tracking.remark ?? '-'],
    ['── 评审结果 ──', ''],
    ['色差 ΔE', result.deltaE],
    ['光泽度 GU', result.glossValue],
    ['主观评价', result.subjectiveReview],
    ['认可结论', result.isApproved ? '✓ PASS (通过)' : '✗ NG (不通过)'],
  ];

  pairs.forEach(([k, v]) => {
    const row = ws.addRow([k, v]);
    const isSection = k.startsWith('──');

    if (isSection) {
      row.getCell(1).font = { bold: true, color: { argb: 'FF57534E' } };
      row.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFAFAF9' },
      };
      ws.mergeCells(`A${row.number}:B${row.number}`);
    } else {
      row.getCell(1).font = { bold: true };
      row.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F5F4' },
      };
      row.getCell(1).alignment = { vertical: 'middle' };
      row.getCell(2).alignment = { vertical: 'middle', wrapText: true };

      if (k === '认可结论') {
        row.getCell(2).font = {
          bold: true,
          color: { argb: result.isApproved ? 'FF059669' : 'FFDC2626' },
        };
      }
    }
    row.height = 20;
  });

  ws.addRow([]);
  const footerRow = ws.addRow(['本报告由 SML & AAR 智能管理系统自动生成', '']);
  ws.mergeCells(`A${footerRow.number}:B${footerRow.number}`);
  footerRow.getCell(1).font = {
    size: 8,
    color: { argb: 'FF9CA3AF' },
    italic: true,
  };
  footerRow.getCell(1).alignment = { horizontal: 'center' };

  // 边框
  const lastRow = ws.lastRow?.number || 0;
  for (let i = 4; i < lastRow; i++) {
    const row = ws.getRow(i);
    [1, 2].forEach((col) => {
      row.getCell(col).border = {
        top: { style: 'thin', color: { argb: 'FFE7E5E4' } },
        left: { style: 'thin', color: { argb: 'FFE7E5E4' } },
        bottom: { style: 'thin', color: { argb: 'FFE7E5E4' } },
        right: { style: 'thin', color: { argb: 'FFE7E5E4' } },
      };
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="AAR_${sml.partNumber}_${tracking.round}.xlsx"`,
    },
  });
}
