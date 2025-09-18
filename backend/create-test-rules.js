import { RestrictionRule } from './src/models/index.js';
import sequelize from './src/config/database.js';

async function createTestRules() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

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
        createdBy: '00000000-0000-0000-0000-000000000001' // Dummy UUID
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
        createdBy: '00000000-0000-0000-0000-000000000001'
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
        createdBy: '00000000-0000-0000-0000-000000000001'
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
        createdBy: '00000000-0000-0000-0000-000000000001'
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

  } catch (error) {
    console.error('Error creating test rules:', error);
  } finally {
    await sequelize.close();
  }
}

createTestRules();

