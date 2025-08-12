/**
 * Slack Utility Service
 * 
 * Handles Slack API integration, approval workflow, and message management
 */

const { WebClient } = require('@slack/web-api');
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'slack' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

let web = null;
let mockMode = false;

/**
 * Initialize Slack Web API client
 */
function initializeSlack() {
  try {
    if (!process.env.SLACK_BOT_TOKEN) {
      logger.warn('Slack bot token not found, running in mock mode for testing');
      mockMode = true;
      return;
    }

    web = new WebClient(process.env.SLACK_BOT_TOKEN);
    logger.info('Slack Web API client initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Slack Web API client:', error);
    logger.warn('Falling back to mock mode for testing');
    mockMode = true;
  }
}

/**
 * Build approval chain for a requester
 */
function buildApprovalChain(requesterEmail, directory) {
  try {
    const chain = [];
    let currentEmail = requesterEmail;
    
    while (currentEmail) {
      const person = directory.find(p => p.email === currentEmail);
      if (!person) break;
      
      // Check if we've reached Jason Amacker or Dean Hammond
      if (person.mgrName && 
          (person.mgrName.toLowerCase().includes('jason amacker') || 
           person.mgrName.toLowerCase().includes('dean hammond'))) {
        chain.push(person.mgrEmail);
        break;
      }
      
      if (person.mgrEmail) {
        chain.push(person.mgrEmail);
        currentEmail = person.mgrEmail;
      } else {
        break;
      }
    }
    
    return chain;
  } catch (error) {
    logger.error('Error building approval chain:', error);
    throw new Error(`Failed to build approval chain: ${error.message}`);
  }
}

/**
 * Open direct message with Slack user
 */
async function openDirectMessage(userId) {
  try {
    const response = await web.conversations.open({
      users: userId
    });
    
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.error}`);
    }
    
    return response;
  } catch (error) {
    logger.error('Error opening Slack DM:', error);
    throw new Error(`Failed to open Slack DM: ${error.message}`);
  }
}

/**
 * Send message to Slack channel
 */
async function sendMessage(channelId, message) {
  try {
    const response = await web.chat.postMessage({
      channel: channelId,
      text: message.text,
      blocks: message.blocks,
      unfurl_links: false
    });
    
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.error}`);
    }
    
    return response;
  } catch (error) {
    logger.error('Error sending Slack message:', error);
    throw new Error(`Failed to send Slack message: ${error.message}`);
  }
}

/**
 * Update existing Slack message
 */
async function updateMessage(channelId, timestamp, message) {
  try {
    const response = await web.chat.update({
      channel: channelId,
      ts: timestamp,
      text: message.text,
      blocks: message.blocks
    });
    
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.error}`);
    }
    
    return response;
  } catch (error) {
    logger.error('Error updating Slack message:', error);
    throw new Error(`Failed to update Slack message: ${error.message}`);
  }
}

/**
 * Format approval message for Slack
 */
function formatApprovalMessage(requestId, requestData) {
  const text = `New Delayed Start Discount Request (ID: ${requestId})`;
  
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*New Delayed Start Discount Request*\nRequest ID: ${requestId}`
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Account:*\n${requestData.accountName}`
        },
        {
          type: 'mrkdwn',
          text: `*Project:*\n${requestData.projectName}`
        },
        {
          type: 'mrkdwn',
          text: `*Requested By:*\n${requestData.requestedByEmail}`
        },
        {
          type: 'mrkdwn',
          text: `*Delay End Date:*\n${requestData.delayEndDate}`
        }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Notes:*\n${requestData.notesJustification}`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Lessons Learned:*\n${requestData.lessonsLearned}`
      }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Approve'
          },
          style: 'primary',
          value: `approve_${requestId}`,
          action_id: 'approve_request'
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Reject'
          },
          style: 'danger',
          value: `reject_${requestId}`,
          action_id: 'reject_request'
        }
      ]
    }
  ];
  
  return { text, blocks };
}

/**
 * Format approval reminder message
 */
function formatReminderMessage(requestId, requestData) {
  const text = `Reminder: Pending Delayed Start Discount Request (ID: ${requestId})`;
  
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Reminder: Pending Approval*\nRequest ID: ${requestId}`
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Account:*\n${requestData.accountName}`
        },
        {
          type: 'mrkdwn',
          text: `*Project:*\n${requestData.projectName}`
        },
        {
          type: 'mrkdwn',
          text: `*Requested By:*\n${requestData.requestedByEmail}`
        },
        {
          type: 'mrkdwn',
          text: `*Days Pending:*\n${requestData.daysPending}`
        }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*This request is waiting for your approval. Please review and take action.*`
      }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Approve'
          },
          style: 'primary',
          value: `approve_${requestId}`,
          action_id: 'approve_request'
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Reject'
          },
          style: 'danger',
          value: `reject_${requestId}`,
          action_id: 'reject_request'
        }
      ]
    }
  ];
  
  return { text, blocks };
}

/**
 * Format final notification message for Taylor
 */
function formatFinalNotificationMessage(requestData, finalStatus, finalApprover) {
  const statusEmoji = finalStatus === 'APPROVED' ? '✅' : '❌';
  const text = `Delayed Start Discount Request ${finalStatus.toLowerCase()} (ID: ${requestData.id})`;
  
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${statusEmoji} *Delayed Start Discount Request ${finalStatus}*\nRequest ID: ${requestData.id}`
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Account:*\n${requestData.accountName}`
        },
        {
          type: 'mrkdwn',
          text: `*Project:*\n${requestData.projectName}`
        },
        {
          type: 'mrkdwn',
          text: `*Requested By:*\n${requestData.requestedByEmail}`
        },
        {
          type: 'mrkdwn',
          text: `*Final Status:*\n${finalStatus}`
        },
        {
          type: 'mrkdwn',
          text: `*Final Approver:*\n${finalApprover}`
        },
        {
          type: 'mrkdwn',
          text: `*Finalized On:*\n${new Date().toLocaleDateString()}`
        }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Notes:*\n${requestData.notesJustification}`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Lessons Learned:*\n${requestData.lessonsLearned}`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Delay End Date:*\n${requestData.delayEndDate}`
      }
    }
  ];
  
  return { text, blocks };
}

/**
 * Send approval request to an approver
 */
async function sendApprovalRequest(requestId, requestData, approverEmail, directory) {
  try {
    // Find approver in directory
    const approver = directory.find(p => p.email === approverEmail);
    
    if (!approver || !approver.slackId) {
      logger.warn(`Approver not found or no Slack ID: ${approverEmail}`);
      return null;
    }
    
    // Open DM with approver
    const im = await openDirectMessage(approver.slackId);
    
    // Send approval message
    const message = formatApprovalMessage(requestId, requestData);
    const response = await sendMessage(im.channel.id, message);
    
    logger.info(`Approval request sent to ${approverEmail} (Slack ID: ${approver.slackId})`);
    
    return {
      channelId: im.channel.id,
      timestamp: response.ts,
      approverEmail,
      approverSlackId: approver.slackId
    };
    
  } catch (error) {
    logger.error('Error sending approval request:', error);
    throw new Error(`Failed to send approval request: ${error.message}`);
  }
}

/**
 * Send approval reminder
 */
async function sendApprovalReminder(requestId, requestData, approverEmail, directory) {
  try {
    // Find approver in directory
    const approver = directory.find(p => p.email === approverEmail);
    
    if (!approver || !approver.slackId) {
      logger.warn(`Approver not found or no Slack ID: ${approverEmail}`);
      return null;
    }
    
    // Open DM with approver
    const im = await openDirectMessage(approver.slackId);
    
    // Calculate days pending
    const createdAt = new Date(requestData.timestamp);
    const now = new Date();
    const daysPending = Math.ceil((now - createdAt) / (1000 * 60 * 60 * 24));
    
    // Send reminder message
    const message = formatReminderMessage(requestId, { ...requestData, daysPending });
    const response = await sendMessage(im.channel.id, message);
    
    logger.info(`Reminder sent to ${approverEmail} for request ${requestId}`);
    
    return {
      channelId: im.channel.id,
      timestamp: response.ts,
      approverEmail,
      approverSlackId: approver.slackId
    };
    
  } catch (error) {
    logger.error('Error sending approval reminder:', error);
    throw new Error(`Failed to send approval reminder: ${error.message}`);
  }
}

/**
 * Send final notification to Taylor
 */
async function sendFinalNotification(requestData, finalStatus, finalApprover) {
  try {
    const message = formatFinalNotificationMessage(requestData, finalStatus, finalApprover);
    
    // Send to Taylor's Slack ID
    const response = await sendMessage(process.env.SLACK_TAYLOR_ID, message);
    
    logger.info(`Final notification sent to Taylor for request ${requestData.id}`);
    
    return response;
    
  } catch (error) {
    logger.error('Error sending final notification:', error);
    throw new Error(`Failed to send final notification: ${error.message}`);
  }
}

/**
 * Handle Slack interactive response
 */
async function handleInteractiveResponse(payload) {
  try {
    const { actions, user, response_url } = payload;
    
    if (!actions || actions.length === 0) {
      throw new Error('No actions found in payload');
    }
    
    const action = actions[0];
    const { action_id, value } = action;
    
    // Extract request ID from value
    const requestId = value.replace(/^(approve|reject)_/, '');
    const actionType = value.startsWith('approve_') ? 'approve' : 'reject';
    
    logger.info(`Slack interaction received: ${actionType} for request ${requestId} by user ${user.id}`);
    
    // Return the action details for processing
    return {
      actionType,
      requestId,
      userId: user.id,
      responseUrl: response_url
    };
    
  } catch (error) {
    logger.error('Error handling Slack interactive response:', error);
    throw new Error(`Failed to handle Slack interaction: ${error.message}`);
  }
}

module.exports = {
  initializeSlack,
  buildApprovalChain,
  openDirectMessage,
  sendMessage,
  updateMessage,
  formatApprovalMessage,
  formatReminderMessage,
  formatFinalNotificationMessage,
  sendApprovalRequest,
  sendApprovalReminder,
  sendFinalNotification,
  handleInteractiveResponse
};
