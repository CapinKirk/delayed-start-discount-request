/**
 * Scheduler Utility Service
 * 
 * Handles automatic reminders, auto-approvals, and background tasks
 */

const winston = require('winston');
const { loadDirectory, updateRequestStatus } = require('./googleSheets');
const { sendApprovalReminder, sendFinalNotification } = require('./slack');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'scheduler' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

let reminderInterval;
let autoApprovalInterval;

/**
 * Initialize scheduler service
 */
async function initializeScheduler() {
  try {
    // Start reminder interval (every hour)
    reminderInterval = setInterval(async () => {
      await processReminders();
    }, 60 * 60 * 1000); // 1 hour

    // Start auto-approval interval (every 4 hours)
    autoApprovalInterval = setInterval(async () => {
      await processAutoApprovals();
    }, 4 * 60 * 60 * 1000); // 4 hours

    logger.info('Scheduler service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize scheduler service:', error);
    throw new Error(`Scheduler initialization failed: ${error.message}`);
  }
}

/**
 * Process pending approval reminders
 */
async function processReminders() {
  try {
    logger.info('Processing approval reminders...');
    
    // Load directory data
    const directory = await loadDirectory();
    
    // Get pending requests from Google Sheets
    const pendingRequests = await getPendingRequests();
    
    for (const request of pendingRequests) {
      try {
        // Check if reminder is needed
        if (shouldSendReminder(request)) {
          await sendApprovalReminder(
            request.id,
            request,
            request.currentApprover,
            directory
          );
          
          // Update last reminder timestamp
          await updateRequestStatus(request.rowNumber, {
            'LastReminder': new Date().toISOString()
          });
          
          logger.info(`Reminder sent for request ${request.id}`);
        }
      } catch (error) {
        logger.error(`Error processing reminder for request ${request.id}:`, error);
      }
    }
    
    logger.info('Reminder processing completed');
  } catch (error) {
    logger.error('Error processing reminders:', error);
  }
}

/**
 * Process auto-approvals for expired requests
 */
async function processAutoApprovals() {
  try {
    logger.info('Processing auto-approvals...');
    
    // Load directory data
    const directory = await loadDirectory();
    
    // Get pending requests from Google Sheets
    const pendingRequests = await getPendingRequests();
    
    for (const request of pendingRequests) {
      try {
        // Check if auto-approval is needed
        if (shouldAutoApprove(request)) {
          await autoApproveRequest(request, directory);
          logger.info(`Request ${request.id} auto-approved`);
        }
      } catch (error) {
        logger.error(`Error processing auto-approval for request ${request.id}:`, error);
      }
    }
    
    logger.info('Auto-approval processing completed');
  } catch (error) {
    logger.error('Error processing auto-approvals:', error);
  }
}

/**
 * Check if a reminder should be sent
 */
function shouldSendReminder(request) {
  try {
    const now = new Date();
    const lastReminder = request.lastReminder ? new Date(request.lastReminder) : null;
    const reminderIntervalHours = parseInt(process.env.REMINDER_INTERVAL_HOURS) || 24;
    
    // If no reminder has been sent, send one
    if (!lastReminder) {
      return true;
    }
    
    // Check if enough time has passed since last reminder
    const hoursSinceLastReminder = (now - lastReminder) / (1000 * 60 * 60);
    return hoursSinceLastReminder >= reminderIntervalHours;
    
  } catch (error) {
    logger.error('Error checking reminder timing:', error);
    return false;
  }
}

/**
 * Check if a request should be auto-approved
 */
function shouldAutoApprove(request) {
  try {
    const now = new Date();
    const createdAt = new Date(request.timestamp);
    const autoApproveDays = parseInt(process.env.AUTO_APPROVE_DAYS) || 3;
    
    // Calculate business days since creation
    const businessDays = calculateBusinessDays(createdAt, now);
    
    return businessDays > autoApproveDays;
    
  } catch (error) {
    logger.error('Error checking auto-approval timing:', error);
    return false;
  }
}

/**
 * Calculate business days between two dates
 */
function calculateBusinessDays(startDate, endDate) {
  try {
    let businessDays = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        businessDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return businessDays;
  } catch (error) {
    logger.error('Error calculating business days:', error);
    return 0;
  }
}

/**
 * Auto-approve a request
 */
async function autoApproveRequest(request, directory) {
  try {
    // Update request status to approved
    await updateRequestStatus(request.rowNumber, {
      'ApprovalStatus': 'APPROVED',
      'FinalApprover': 'System Auto-Approval',
      'FinalizedOn': new Date().toISOString(),
      'ApprovalPathJSON': JSON.stringify([{
        approver: 'System Auto-Approval',
        action: 'APPROVED',
        timestamp: new Date().toISOString(),
        reason: 'Auto-approved after timeout period'
      }])
    });
    
    // Send final notification to Taylor
    await sendFinalNotification(request, 'APPROVED', 'System Auto-Approval');
    
    logger.info(`Request ${request.id} auto-approved successfully`);
    
  } catch (error) {
    logger.error(`Error auto-approving request ${request.id}:`, error);
    throw error;
  }
}

/**
 * Get pending requests from Google Sheets
 * This is a simplified version - in production you might want to use a database
 */
async function getPendingRequests() {
  try {
    // For now, return an empty array
    // In a real implementation, you would query the Requests sheet
    // and filter for requests with ApprovalStatus = 'PENDING'
    return [];
    
  } catch (error) {
    logger.error('Error getting pending requests:', error);
    return [];
  }
}

/**
 * Stop scheduler service
 */
function stopScheduler() {
  try {
    if (reminderInterval) {
      clearInterval(reminderInterval);
      reminderInterval = null;
    }
    
    if (autoApprovalInterval) {
      clearInterval(autoApprovalInterval);
      autoApprovalInterval = null;
    }
    
    logger.info('Scheduler service stopped');
  } catch (error) {
    logger.error('Error stopping scheduler service:', error);
  }
}

/**
 * Manually trigger reminder processing
 */
async function triggerReminderProcessing() {
  try {
    logger.info('Manually triggering reminder processing...');
    await processReminders();
    logger.info('Manual reminder processing completed');
  } catch (error) {
    logger.error('Error in manual reminder processing:', error);
    throw error;
  }
}

/**
 * Manually trigger auto-approval processing
 */
async function triggerAutoApprovalProcessing() {
  try {
    logger.info('Manually triggering auto-approval processing...');
    await processAutoApprovals();
    logger.info('Manual auto-approval processing completed');
  } catch (error) {
    logger.error('Error in manual auto-approval processing:', error);
    throw error;
  }
}

module.exports = {
  initializeScheduler,
  stopScheduler,
  triggerReminderProcessing,
  triggerAutoApprovalProcessing,
  processReminders,
  processAutoApprovals
};
