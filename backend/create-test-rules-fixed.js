import { RestrictionRule, User } from './src/models/index.js';
import sequelize from './src/config/database.js';

async function createTestRules() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // First, get an existing user or create one
    let adminUser = await User.findOne({ where: { role: 'admin' } });
    
    if (!adminUser) {
      // Create a default admin user if none exists
      adminUser = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@webwork.com',
        password: 'admin123', // This will be hashed
        role: 'admin',
        isActive: true
      });
      console.log('Created admin user');
    }

    console.log(`Using user: ${adminUser.email} (ID: ${adminUser.id})`);

    // Create test restriction rules
    const testRules = [
      {
        name: 'Block YouTube',
        description: 'Block access to YouTube during work hours',
        type: 'block',
        targetType: 'domain',
        targetValue: 'youtube.com',
        severity: 'high',
        isActive: true,
        appliesTo: 'all',
        alertMessage: 'YouTube is blocked during work hours. Please focus on work-related tasks.',
        timeRestrictions: {
          days: [1, 2, 3, 4, 5], // Monday to Friday
          startHour: 9,          // 9 AM
          endHour: 17           // 5 PM
        },
        createdBy: adminUser.id
      },
      {
        name: 'Block Facebook',
        description: 'Block access to Facebook',
        type: 'block',
        targetType: 'domain',
        targetValue: 'facebook.com',
        severity: 'medium',
        isActive: true,
        appliesTo: 'all',
        alertMessage: 'Facebook is blocked. Please use work-appropriate websites.',
        createdBy: adminUser.id
      },
      {
        name: 'Block Instagram',
        description: 'Block access to Instagram',
        type: 'block',
        targetType: 'domain',
        targetValue: 'instagram.com',
        severity: 'medium',
        isActive: true,
        appliesTo: 'all',
        alertMessage: 'Instagram is blocked. Please focus on work tasks.',
        createdBy: adminUser.id
      },
      {
        name: 'Alert for Twitter',
        description: 'Show alert for Twitter but allow access',
        type: 'alert',
        targetType: 'domain',
        targetValue: 'twitter.com',
        severity: 'low',
        isActive: true,
        appliesTo: 'all',
        alertMessage: 'You are accessing Twitter. Please ensure this is work-related.',
        createdBy: adminUser.id
      }
    ];

    // Clear existing rules first
    await RestrictionRule.destroy({ where: {} });
    console.log('Cleared existing rules');

    // Create new rules
    for (const rule of testRules) {
      await RestrictionRule.create(rule);
      console.log(`Created rule: ${rule.name}`);
    }

    console.log('✅ Test restriction rules created successfully!');
    console.log('\nRules created:');
    testRules.forEach(rule => {
      console.log(`- ${rule.name}: ${rule.targetValue} (${rule.type})`);
    });

    console.log('\n🎯 Now test the desktop app by visiting YouTube, Facebook, or Instagram!');

  } catch (error) {
    console.error('Error creating test rules:', error);
  } finally {
    await sequelize.close();
  }
}

createTestRules();

