// Use project-generated Prisma client output
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('../src/generated/prisma');

async function main(){
  const prisma = new PrismaClient();
  try {
    await prisma.widgetTheme.upsert({
      where: { public_id: 'demo' },
      create: {
        public_id: 'demo',
        colors: { primary: '#111827' } as any,
        position: 'bottom-right',
        greeting: 'Chat with us',
        mask_roles: true,
        unified_display_name: 'Support',
        auto_open_enabled: false,
        auto_open_delay_ms: 5000,
        auto_open_greeting: '',
        auto_open_frequency: 'once_per_session'
      },
      update: {},
    });

    await prisma.routingPolicy.upsert({
      where: { id: 'policy' },
      create: { id: 'policy', timeout_seconds: 30, human_suppression_minutes: 5 },
      update: {},
    });

    await prisma.aIConfig.upsert({
      where: { id: 'ai' },
      create: { id: 'ai', model: 'gpt-5', system_prompt: 'You are a helpful assistant for Point of Rental website visitors.' },
      update: {},
    });

    const existingAgents = await prisma.agent.count();
    if (existingAgents === 0) {
      await prisma.agent.createMany({
        data: [
          { slack_user_id: 'U00000001', display_name: 'Agent A', active: true, order_index: 0 },
          { slack_user_id: 'U00000002', display_name: 'Agent B', active: true, order_index: 1 },
        ],
      });
    }

    const hoursCount = await prisma.businessHours.count();
    if (hoursCount === 0) {
      const tz = 'America/Chicago';
      for (const weekday of [1,2,3,4,5]) {
        await prisma.businessHours.create({ data: { tz, weekday, start_local_time: '09:00', end_local_time: '17:00' } });
      }
    }

    console.log('Seed complete');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


