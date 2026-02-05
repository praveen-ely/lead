const cron = require('node-cron');
const UserPreference = require('../models/userPreferenceModel');
const AuthUser = require('../models/authUserModel');
const thirdPartyApiService = require('./thirdPartyApiService');

/**
 * Start daily user lead sync service
 * Runs daily at a specified time to sync leads for all users based on their preferences
 */
const startDailyUserLeadSync = () => {
  console.log('Starting daily user lead sync service...');

  // Schedule daily sync at 2 AM (adjust time as needed)
  // Cron format: minute hour day month dayOfWeek
  // '0 2 * * *' means: At 02:00 AM every day
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('Starting scheduled daily user lead sync...');
      await syncLeadsForAllUsers();
      console.log('Daily user lead sync completed successfully');
    } catch (error) {
      console.error('Error in scheduled daily user lead sync:', error);
    }
  });

  console.log('Daily user lead sync service scheduled (runs daily at 2:00 AM)');
};

/**
 * Sync leads for all users who have preferences set
 */
const syncLeadsForAllUsers = async () => {
  try {
    // Get all users with preferences
    const users = await AuthUser.find({ isActive: true }).lean();
    
    if (!users || users.length === 0) {
      console.log('No active users found for lead sync');
      return;
    }

    console.log(`Found ${users.length} active users to sync leads for`);

    for (const user of users) {
      try {
        // Get user preferences
        const userPreference = await UserPreference.findOne({ userId: user._id.toString() });
        
        if (!userPreference) {
          console.log(`No preferences found for user ${user.email}, skipping...`);
          continue;
        }

        // Check if user has API keys configured
        const hasApiKeys = userPreference.preferences?.api?.keys && 
          (userPreference.preferences.api.keys.crunchbase || 
           userPreference.preferences.api.keys.hunter || 
           userPreference.preferences.api.keys.clearbit || 
           userPreference.preferences.api.keys.linkedin);

        if (!hasApiKeys) {
          console.log(`No API keys configured for user ${user.email}, skipping...`);
          continue;
        }

        // Sync leads for this user
        console.log(`Syncing leads for user: ${user.email}`);
        const syncResults = await thirdPartyApiService.syncLeadsForUser(userPreference);

        // Update user statistics
        if (syncResults && !syncResults.error) {
          await userPreference.updateStats({
            totalLeads: syncResults.totalLeads || userPreference.stats.totalLeads,
            qualifiedLeads: syncResults.qualifiedLeads || userPreference.stats.qualifiedLeads,
            apiCalls: userPreference.stats.apiCalls + (syncResults.apiCalls || 0),
            successRate: syncResults.successRate || userPreference.stats.successRate,
            lastSync: new Date()
          });

          console.log(`Successfully synced ${syncResults.totalLeads} leads for user ${user.email}`);
        } else {
          console.error(`Error syncing leads for user ${user.email}:`, syncResults?.error);
        }

        // Add delay between users to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
        // Continue with next user even if one fails
        continue;
      }
    }

    console.log('Completed syncing leads for all users');
  } catch (error) {
    console.error('Error in syncLeadsForAllUsers:', error);
    throw error;
  }
};

/**
 * Manual sync trigger (can be called from API)
 */
const triggerManualSyncForUser = async (userId) => {
  try {
    const userPreference = await UserPreference.findOne({ userId });
    
    if (!userPreference) {
      throw new Error('User preferences not found');
    }

    const syncResults = await thirdPartyApiService.syncLeadsForUser(userPreference);

    // Update user statistics
    if (syncResults && !syncResults.error) {
      await userPreference.updateStats({
        totalLeads: syncResults.totalLeads || userPreference.stats.totalLeads,
        qualifiedLeads: syncResults.qualifiedLeads || userPreference.stats.qualifiedLeads,
        apiCalls: userPreference.stats.apiCalls + (syncResults.apiCalls || 0),
        successRate: syncResults.successRate || userPreference.stats.successRate,
        lastSync: new Date()
      });
    }

    return syncResults;
  } catch (error) {
    console.error('Error in triggerManualSyncForUser:', error);
    throw error;
  }
};

module.exports = {
  startDailyUserLeadSync,
  syncLeadsForAllUsers,
  triggerManualSyncForUser
};
