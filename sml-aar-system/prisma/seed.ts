import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const daysFromNow = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

async function main() {
  console.log('🗑️  清空旧数据...');
  await prisma.aarResult.deleteMany();
  await prisma.sampleTracking.deleteMany();
  await prisma.sml.deleteMany();

  console.log('📦 正在写入 Mock 数据...');

  // 1. 前保险杠总成 · 珍珠白 · 已签发
  await prisma.sml.create({
    data: {
      partNumber: 'BM-1001-PW',
      partName: '前保险杠总成',
      colorCode: 'Pearl White',
      configLevel: 'Standard',
      dreOwner: '周宇航',
      supplier: '敏实集团',
      trackings: {
        create: {
          round: 'T2',
          plannedDate: daysFromNow(-20),
          actualDate: daysFromNow(-18),
          status: 'AAR签发',
          remark: '色差光泽均达标，批准认可',
          result: {
            create: {
              deltaE: 0.8,
              glossValue: 88.5,
              subjectiveReview: '光影流畅，无桔皮、无缩痕',
              isApproved: true,
            },
          },
        },
      },
    },
  });

  // 2. 真皮座椅面套 · 半苯胺皮 · 延期风险 (核心演示数据)
  await prisma.sml.create({
    data: {
      partNumber: 'ST-2003-BR',
      partName: '真皮座椅面套',
      colorCode: 'Semi-Aniline Brown',
      configLevel: 'GT',
      dreOwner: '周宇航',
      supplier: '旷达科技',
      trackings: {
        create: {
          round: 'T1',
          plannedDate: daysFromNow(-5),
          actualDate: null,
          status: '打回',
          remark: '表皮纹理深度不足，模具咬花需重新排期约 3 周',
        },
      },
    },
  });

  // 3. 碳纤维门板饰件 · 待审
  await prisma.sml.create({
    data: {
      partNumber: 'DP-3005-CF',
      partName: '门板饰件',
      colorCode: 'Carbon Fiber Twill',
      configLevel: 'Max',
      dreOwner: '李慕白',
      supplier: '亨睿碳纤',
      trackings: {
        create: {
          round: 'T1',
          plannedDate: daysFromNow(-2),
          actualDate: daysFromNow(-1),
          status: '待审',
          remark: '样件已到库，待安排评审',
        },
      },
    },
  });

  // 4. 电镀中控饰条 · 正常推进
  await prisma.sml.create({
    data: {
      partNumber: 'IP-4007-CR',
      partName: '中控装饰条',
      colorCode: 'Satin Chrome',
      configLevel: 'Standard',
      dreOwner: '陈思远',
      supplier: '华翔股份',
      trackings: {
        create: {
          round: 'T0',
          plannedDate: daysFromNow(7),
          actualDate: null,
          status: '待收',
          remark: null,
        },
      },
    },
  });

  // 5. 翼子板 · 已延期到样 (次级风险)
  await prisma.sml.create({
    data: {
      partNumber: 'FD-5009-PW',
      partName: '翼子板',
      colorCode: 'Pearl White',
      configLevel: 'Standard',
      dreOwner: '王雅琦',
      supplier: '凌云股份',
      trackings: {
        create: {
          round: 'T1',
          plannedDate: daysFromNow(-10),
          actualDate: daysFromNow(-3),
          status: '待审',
          remark: '到样延期，因外协喷涂产能紧张',
        },
      },
    },
  });

  // 6. 轮毂 · PVD 工艺 · 正常推进
  await prisma.sml.create({
    data: {
      partNumber: 'WH-6011-BK',
      partName: '21寸锻造轮毂',
      colorCode: 'PVD Dark Titanium',
      configLevel: 'GT',
      dreOwner: '李慕白',
      supplier: '中信戴卡',
      trackings: {
        create: {
          round: 'T2',
          plannedDate: daysFromNow(-1),
          actualDate: daysFromNow(-1),
          status: '待审',
          remark: '按计划到样，待安排三方评审',
        },
      },
    },
  });

  console.log('✅ Seed 完成，共 6 条 SML 记录');
  console.log('📊 其中高风险数据 2 条（真皮座椅、翼子板）');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
