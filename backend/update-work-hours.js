import { RestrictionRule } from './src/models/index.js';
import sequelize from './src/config/database.js';

async function updateWorkHours() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Update YouTube rule with new work hours
    const youtubeRule = await RestrictionRule.findOne({
      where: { name: 'Block YouTube' }
    });

    if (youtubeRule) {
      // Set work hours to 8 AM - 6 PM (longer hours)
      await youtubeRule.update({
        timeRestrictions: {
          days: [1, 2, 3, 4, 5], // Monday to Friday
          startHour: 8,           // 8 AM
          endHour: 18             // 6 PM
        }
      });
      console.log('✅ Updated YouTube work hours to 8 AM - 6 PM');
    }

    // Update Facebook rule to also have work hours
    const facebookRule = await RestrictionRule.findOne({
      where: { name: 'Block Facebook' }
    });

    if (facebookRule) {
      await facebookRule.update({
        timeRestrictions: {
          days: [1, 2, 3, 4, 5], // Monday to Friday
          startHour: 9,           // 9 AM
          endHour: 17             // 5 PM
        }
      });
      console.log('✅ Updated Facebook work hours to 9 AM - 5 PM');
    }

    // Create a new rule for 24/7 blocking
    await RestrictionRule.create({
      name: 'Block YouTube 24/7',
      description: 'Block YouTube 24/7 for testing',
      type: 'block',
      targetType: 'domain',
      targetValue: 'youtube.com',
      severity: 'high',
      isActive: true,
      appliesTo: 'all',
      alertMessage: 'YouTube is blocked 24/7. Please focus on work tasks.',
      timeRestrictions: null, // No time restrictions = 24/7
      createdBy: 'c0512990-e43f-454c-b9d2-ce187bf41d36'
    });
    console.log('✅ Created 24/7 YouTube blocking rule');

    console.log('\n🎯 Work hours updated!');
    console.log('- YouTube: 8 AM - 6 PM (Monday-Friday)');
    console.log('- Facebook: 9 AM - 5 PM (Monday-Friday)');
    console.log('- YouTube 24/7: Blocked all the time');

  } catch (error) {
    console.error('Error updating work hours:', error);
  } finally {
    await sequelize.close();
  }
}

updateWorkHours();

