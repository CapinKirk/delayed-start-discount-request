/**
 * Slack API Routes
 * 
 * Handles Slack webhook interactions and approval workflow responses
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const winston = require('winston');

// Import services
const { handleInteractiveResponse } = require('../src/utils/slack');
const { updateRequestStatus } = require('../src/utils/googleSheets');
const { sendFinalNotification } = require('../src/utils/slack');

const router = express.Router();

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'slack-routes' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Validation middleware
const validateSlackRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * POST /api/slack/interactive
 * Handle Slack interactive components (buttons, etc.)
 */
router.post('/interactive', [
  body('payload').notEmpty()
], validateSlackRequest, async (req, res) => {
  try {
    const { payload } = req.body;
    
    // Parse the payload
    let slackPayload;
    try {
      slackPayload = JSON.parse(payload);
    } catch (parseError) {
      logger.error('Error parsing Slack payload:', parseError);
      return res.status(400).json({
        error: 'Invalid payload format'
      });
    }

    logger.info('Slack interactive request received:', {
      type: slackPayload.type,
      user: slackPayload.user?.id,
      actions: slackPayload.actions?.map(a => a.action_id)
    });

    // Handle the interactive response
    const interaction = await handleInteractiveResponse(slackPayload);
    
    if (!interaction) {
      return res.status(400).json({
        error: 'Invalid interaction'
      });
    }

    // Process the approval/rejection
    const { actionType, requestId, userId, responseUrl } = interaction;
    
    if (actionType === 'approve') {
      await processApproval(requestId, userId);
    } else if (actionType === 'reject') {
      await processRejection(requestId, userId);
    }

    // Send immediate response to Slack
    res.json({
      response_type: 'ephemeral',
      text: `Request ${actionType}d successfully!`
    });

  } catch (error) {
    logger.error('Error in POST /api/slack/interactive:', error);
    
    // Send error response to Slack
    res.json({
      response_type: 'ephemeral',
      text: `Error processing request: ${error.message}`
    });
  }
});

/**
 * POST /api/slack/events
 * Handle Slack events (app mentions, etc.)
 */
router.post('/events', async (req, res) => {
  try {
    const { type, challenge } = req.body;
    
    logger.info('Slack event received:', { type });

    // Handle URL verification challenge
    if (type === 'url_verification') {
      return res.json({ challenge });
    }

    // Handle other event types
    if (type === 'event_callback') {
      const { event } = req.body;
      
      if (event.type === 'app_mention') {
        await handleAppMention(event);
      }
    }

    res.json({ ok: true });

  } catch (error) {
    logger.error('Error in POST /api/slack/events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/slack/commands
 * Handle Slack slash commands
 */
router.post('/commands', [
  body('command').notEmpty(),
  body('text').optional(),
  body('user_id').notEmpty(),
  body('channel_id').notEmpty()
], validateSlackRequest, async (req, res) => {
  try {
    const { command, text, user_id, channel_id } = req.body;
    
    logger.info('Slack command received:', { command, text, user_id, channel_id });

    let response;
    
    switch (command) {
      case '/discount-status':
        response = await handleStatusCommand(text, user_id);
        break;
      
      case '/discount-help':
        response = await handleHelpCommand();
        break;
      
      default:
        response = {
          response_type: 'ephemeral',
          text: 'Unknown command. Use `/discount-help` for available commands.'
        };
    }

    res.json(response);

  } catch (error) {
    logger.error('Error in POST /api/slack/commands:', error);
    res.json({
      response_type: 'ephemeral',
      text: `Error processing command: ${error.message}`
    });
  }
});

/**
 * Process approval action
 */
async function processApproval(requestId, userId) {
  try {
    logger.info(`Processing approval for request ${requestId} by user ${userId}`);

    // Update request status
    await updateRequestStatus(requestId, {
      'ApprovalStatus': 'APPROVED',
      'FinalApprover': `Slack User ${userId}`,
      'FinalizedOn': new Date().toISOString()
    });

    // Get request details for notification
    // const requestDetails = await getRequestDetails(requestId);
    
    // For now, we'll use a placeholder
    const requestDetails = {
      id: requestId,
      accountName: 'Placeholder',
      projectName: 'Placeholder',
      requestedByEmail: 'placeholder@example.com',
      notesJustification: 'Placeholder',
      lessonsLearned: 'Placeholder',
      delayEndDate: '2024-01-01'
    };

    // Send final notification to Taylor
    await sendFinalNotification(requestDetails, 'APPROVED', `Slack User ${userId}`);

    logger.info(`Request ${requestId} approved successfully`);

  } catch (error) {
    logger.error(`Error processing approval for request ${requestId}:`, error);
    throw error;
  }
}

/**
 * Process rejection action
 */
async function processRejection(requestId, userId) {
  try {
    logger.info(`Processing rejection for request ${requestId} by user ${userId}`);

    // Update request status
    await updateRequestStatus(requestId, {
      'ApprovalStatus': 'REJECTED',
      'FinalApprover': `Slack User ${userId}`,
      'FinalizedOn': new Date().toISOString(),
      'ApprovalPathJSON': JSON.stringify([{
        approver: `Slack User ${userId}`,
        action: 'REJECTED',
        timestamp: new Date().toISOString(),
        reason: 'Rejected via Slack interaction'
      }])
    });

    // Get request details for notification
    // const requestDetails = await getRequestDetails(requestId);
    
    // For now, we'll use a placeholder
    const requestDetails = {
      id: requestId,
      accountName: 'Placeholder',
      projectName: 'Placeholder',
      requestedByEmail: 'placeholder@example.com',
      notesJustification: 'Placeholder',
      lessonsLearned: 'Placeholder',
      delayEndDate: '2024-01-01'
    };

    // Send final notification to Taylor
    await sendFinalNotification(requestDetails, 'REJECTED', `Slack User ${userId}`);

    logger.info(`Request ${requestId} rejected successfully`);

  } catch (error) {
    logger.error(`Error processing rejection for request ${requestId}:`, error);
    throw error;
  }
}

/**
 * Handle app mention events
 */
async function handleAppMention(event) {
  try {
    const { text, user, channel } = event;
    
    logger.info('App mention received:', { text, user, channel });

    // You can implement custom logic here for when someone mentions the app
    // For example, providing help, showing status, etc.
    
  } catch (error) {
    logger.error('Error handling app mention:', error);
  }
}

/**
 * Handle status command
 */
async function handleStatusCommand(text, userId) {
  try {
    // Extract request ID from command text if provided
    const requestId = text ? text.trim() : null;
    
    if (!requestId) {
      return {
        response_type: 'ephemeral',
        text: 'Please provide a request ID. Usage: `/discount-status <request-id>`'
      };
    }

    // Get request details
    // const requestDetails = await getRequestDetails(requestId);
    
    // For now, return a placeholder response
    return {
      response_type: 'ephemeral',
      text: `Status for request ${requestId}: PENDING (placeholder response)`
    };

  } catch (error) {
    logger.error('Error handling status command:', error);
    return {
      response_type: 'ephemeral',
      text: `Error getting status: ${error.message}`
    };
  }
}

/**
 * Handle help command
 */
async function handleHelpCommand() {
  try {
    const helpText = `*Available Commands:*
• \`/discount-status <request-id>\` - Check the status of a specific request
• \`/discount-help\` - Show this help message

*How to Use:*
1. When you receive an approval request, click the Approve or Reject button
2. The system will automatically process your decision
3. You'll receive confirmation of your action
4. The request will be updated in the system

*Need Help?*
Contact the development team for assistance.`;

    return {
      response_type: 'ephemeral',
      text: helpText
    };

  } catch (error) {
    logger.error('Error handling help command:', error);
    return {
      response_type: 'ephemeral',
      text: 'Error displaying help. Please contact support.'
    };
  }
}

/**
 * GET /api/slack/health
 * Health check for Slack integration
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Slack Integration API',
    slackConfigured: !!process.env.SLACK_BOT_TOKEN
  });
});

module.exports = router;
