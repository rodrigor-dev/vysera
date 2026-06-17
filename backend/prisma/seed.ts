import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // --- Admin User ---
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vysera.com' },
    update: {},
    create: {
      email: 'admin@vysera.com',
      emailVerified: true,
      passwordHash: adminPassword,
      name: 'Vysera Admin',
      role: UserRole.admin,
      isActive: true,
    },
  });
  console.log(`  ✓ Admin user: ${admin.email}`);

  // --- Demo Pro User ---
  const userPassword = await bcrypt.hash('User@123456', 12);
  const proUser = await prisma.user.upsert({
    where: { email: 'pro@vysera.com' },
    update: {},
    create: {
      email: 'pro@vysera.com',
      emailVerified: true,
      passwordHash: userPassword,
      name: 'Pro User',
      role: UserRole.pro,
      isActive: true,
      proExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`  ✓ Pro user: ${proUser.email}`);

  // --- Demo Free User ---
  const freeUser = await prisma.user.upsert({
    where: { email: 'user@vysera.com' },
    update: {},
    create: {
      email: 'user@vysera.com',
      emailVerified: true,
      passwordHash: userPassword,
      name: 'Free User',
      role: UserRole.user,
      isActive: true,
    },
  });
  console.log(`  ✓ Free user: ${freeUser.email}`);

  // --- Templates ---
  const templates = [
    {
      id: 'template-vlog',
      name: 'Vlog',
      description: 'Clean and modern vlog style with warm tones',
      category: 'social',
      config: {
        format: 'mp4',
        resolution: 'p1080',
        fps: 30,
        colorGrade: 'warm',
        transition: 'dissolve',
        captionStyle: 'minimal',
        audioDucking: 0.3,
      },
    },
    {
      id: 'template-gaming',
      name: 'Gaming Montage',
      description: 'High-energy gaming edit with quick cuts',
      category: 'gaming',
      config: {
        format: 'mp4',
        resolution: 'p1080',
        fps: 60,
        colorGrade: 'cinematic',
        transition: 'slide',
        captionStyle: 'bold',
        audioDucking: 0.2,
      },
    },
    {
      id: 'template-tutorial',
      name: 'Tutorial',
      description: 'Clear and professional tutorial format',
      category: 'educational',
      config: {
        format: 'mp4',
        resolution: 'p1080',
        fps: 30,
        colorGrade: 'vivid',
        transition: 'fade',
        captionStyle: 'minimal',
        audioDucking: 0.4,
      },
    },
    {
      id: 'template-music',
      name: 'Music Video',
      description: 'Dynamic music video with beat-synced effects',
      category: 'music',
      config: {
        format: 'mp4',
        resolution: 'p1080',
        fps: 30,
        colorGrade: 'dramatic',
        transition: 'zoom',
        captionStyle: 'karaoke',
        audioDucking: 0.1,
      },
    },
    {
      id: 'template-podcast',
      name: 'Podcast',
      description: 'Clean talking-head format for podcasts',
      category: 'podcast',
      config: {
        format: 'mp4',
        resolution: 'p1080',
        fps: 30,
        colorGrade: 'vivid',
        transition: 'fade',
        captionStyle: 'minimal',
        audioDucking: 0.3,
      },
    },
    {
      id: 'template-sport',
      name: 'Sports Highlight',
      description: 'Fast-paced sports edit with dynamic overlays',
      category: 'sports',
      config: {
        format: 'mp4',
        resolution: 'p1080',
        fps: 60,
        colorGrade: 'vivid',
        transition: 'slide',
        captionStyle: 'bold',
        audioDucking: 0.2,
      },
    },
    {
      id: 'template-wedding',
      name: 'Wedding',
      description: 'Romantic wedding video with soft transitions',
      category: 'events',
      config: {
        format: 'mp4',
        resolution: 'k4',
        fps: 30,
        colorGrade: 'warm',
        transition: 'dissolve',
        captionStyle: 'elegant',
        audioDucking: 0.4,
      },
    },
    {
      id: 'template-product',
      name: 'Product Showcase',
      description: 'Professional product demo with clean aesthetics',
      category: 'business',
      config: {
        format: 'mp4',
        resolution: 'p1080',
        fps: 30,
        colorGrade: 'vivid',
        transition: 'dissolve',
        captionStyle: 'minimal',
        audioDucking: 0.3,
      },
    },
    {
      id: 'template-travel',
      name: 'Travel Vlog',
      description: 'Cinematic travel video with vibrant colors',
      category: 'travel',
      config: {
        format: 'mp4',
        resolution: 'k4',
        fps: 30,
        colorGrade: 'warm',
        transition: 'dissolve',
        captionStyle: 'minimal',
        audioDucking: 0.3,
      },
    },
    {
      id: 'template-fashion',
      name: 'Fashion Reel',
      description: 'Trendy fashion reel with dramatic effects',
      category: 'fashion',
      config: {
        format: 'mp4',
        resolution: 'p1080',
        fps: 30,
        colorGrade: 'dramatic',
        transition: 'zoom',
        captionStyle: 'bold',
        audioDucking: 0.2,
      },
    },
    {
      id: 'template-corporate',
      name: 'Corporate',
      description: 'Professional corporate presentation',
      category: 'business',
      config: {
        format: 'mp4',
        resolution: 'p1080',
        fps: 30,
        colorGrade: 'vivid',
        transition: 'fade',
        captionStyle: 'minimal',
        audioDucking: 0.4,
      },
    },
    {
      id: 'template-short',
      name: 'Short Form',
      description: 'Optimized for TikTok/Reels/Shorts',
      category: 'social',
      config: {
        format: 'mp4',
        resolution: 'p1080',
        fps: 30,
        colorGrade: 'vivid',
        transition: 'slide',
        captionStyle: 'tiktok',
        audioDucking: 0.2,
      },
    },
  ];

  for (const template of templates) {
    await prisma.template.upsert({
      where: { id: template.id },
      update: { config: template.config },
      create: {
        id: template.id,
        userId: admin.id,
        name: template.name,
        description: template.description,
        category: template.category,
        isPublic: true,
        config: template.config,
      },
    });
  }
  console.log(`  ✓ ${templates.length} templates created`);

  // --- Demo Project ---
  const project = await prisma.project.upsert({
    where: { id: 'demo-project-1' },
    update: {},
    create: {
      id: 'demo-project-1',
      userId: proUser.id,
      title: 'My First Video',
      description: 'A demo project to explore Vysera features',
      status: 'draft',
      tags: ['demo', 'tutorial'],
    },
  });
  console.log(`  ✓ Demo project: ${project.title}`);

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Test accounts:');
  console.log('  Admin: admin@vysera.com / Admin@123456');
  console.log('  Pro:   pro@vysera.com   / User@123456');
  console.log('  Free:  user@vysera.com  / User@123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
