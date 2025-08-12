/**
 * Main API Routes
 * 
 * Handles all core functionality for the Delayed Start Discount Request system
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const winston = require('winston');

// Import services
const {
  getAccounts,
  getOpportunities,
  getProjects,
  getProjectDetails,
  loadDirectory,
  appendRequest,
  updateRequestStatus
} = require('../src/utils/googleSheets');

const {
  buildApprovalChain,
  sendApprovalRequest,
  sendFinalNotification
} = require('../src/utils/slack');

const router = express.Router();

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-routes' },
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
const validateRequest = (req, res, next) => {
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
 * GET /api/accounts
 * Get distinct accounts from Projects sheet
 */
router.get('/accounts', async (req, res) => {
  try {
    logger.info('GET /api/accounts - Fetching accounts');
    
    const accounts = await getAccounts();
    
    res.json({
      success: true,
      data: accounts
    });
    
  } catch (error) {
    logger.error('Error in GET /api/accounts:', error);
    res.status(500).json({
      error: 'Failed to retrieve accounts',
      message: error.message
    });
  }
});

/**
 * GET /api/opportunities
 * Get opportunities for a specific account
 */
router.get('/opportunities', async (req, res) => {
  try {
    const { accountName } = req.query;
    
    if (!accountName) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'accountName is required'
      });
    }
    
    logger.info(`GET /api/opportunities - Fetching opportunities for account: ${accountName}`);
    
    const opportunities = await getOpportunities(accountName);
    
    res.json({
      success: true,
      data: opportunities
    });
    
  } catch (error) {
    logger.error('Error in GET /api/opportunities:', error);
    res.status(500).json({
      error: 'Failed to retrieve opportunities',
      message: error.message
    });
  }
});

/**
 * GET /api/projects
 * Get projects for a specific account and opportunity
 */
router.get('/projects', async (req, res) => {
  try {
    const { accountName, opportunityName } = req.query;
    
    if (!accountName || !opportunityName) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both accountName and opportunityName are required'
      });
    }
    
    logger.info(`GET /api/projects - Fetching projects for account: ${accountName}, opportunity: ${opportunityName}`);
    
    const projects = await getProjects(accountName, opportunityName);
    
    res.json({
      success: true,
      data: projects
    });
    
  } catch (error) {
    logger.error('Error in GET /api/projects:', error);
    res.status(500).json({
      error: 'Failed to retrieve projects',
      message: error.message
    });
  }
});

/**
 * GET /api/project/:projectName
 * Get detailed project information
 */
router.get('/project/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    logger.info(`GET /api/project/${projectName} - Fetching project details`);
    
    const projectDetails = await getProjectDetails(projectName);
    
    res.json({
      success: true,
      data: projectDetails
    });
    
  } catch (error) {
    logger.error(`Error in GET /api/project/${req.params.projectName}:`, error);
    res.status(500).json({
      error: 'Failed to retrieve project details',
      message: error.message
    });
  }
});

/**
 * POST /api/submit-request
 * Submit a new discount request
 */
router.post('/submit-request', [
  body('accountName').notEmpty().trim().escape(),
  body('opportunityName').notEmpty().trim().escape(),
  body('projectName').notEmpty().trim().escape(),
  body('notes').notEmpty().trim().escape(),
  body('lessonsLearned').notEmpty().trim().escape(),
  body('delayEndDate').isISO8601().toDate(),
  body('requestedByEmail').isEmail().normalizeEmail()
], validateRequest, async (req, res) => {
  try {
    const {
      accountName,
      opportunityName,
      projectName,
      notes,
      lessonsLearned,
      delayEndDate,
      requestedByEmail
    } = req.body;

    logger.info(`POST /api/submit-request - Submitting request for project: ${projectName}`);

    // Get project details
    const projectDetails = await getProjectDetails(projectName);
    
    // Create request data
    const requestData = {
      timestamp: new Date().toISOString(),
      requestedByEmail,
      accountName,
      accountId: projectDetails.accountId,
      opportunityName,
      opportunityId: projectDetails.opportunityId,
      projectName,
      projectId: projectDetails.id,
      projectCreatedDate: projectDetails.createdDate,
      aeName: projectDetails.aeName,
      projectManagerName: projectDetails.projectManagerName,
      contractStartDate: projectDetails.contractStartDate,
      plannedGoLive: projectDetails.plannedGoLive,
      currentACV: projectDetails.currentACV,
      hoursBudgeted: projectDetails.hoursForecast,
      hoursDelivered: projectDetails.hoursCompleted,
      notesJustification: notes,
      lessonsLearned,
      delayEndDate: delayEndDate.toISOString().split('T')[0],
      approvalStatus: 'PENDING',
      finalApprover: '',
      finalizedOn: '',
      approvalPathJSON: ''
    };

    // Log to Requests sheet
    const requestId = await appendRequest(requestData);
    
    // Load directory and build approval chain
    const directory = await loadDirectory();
    const approvalChain = buildApprovalChain(requestedByEmail, directory);
    
    // Start approval workflow
    if (approvalChain.length > 0) {
      const approvalResult = await sendApprovalRequest(
        requestId,
        requestData,
        approvalChain[0],
        directory
      );
      
      if (approvalResult) {
        // Update request with approval workflow info
        await updateRequestStatus(requestId, {
          'ApprovalPathJSON': JSON.stringify([{
            approver: approvalResult.approverEmail,
            status: 'PENDING',
            timestamp: new Date().toISOString()
          }])
        });
      }
    }

    res.json({
      success: true,
      message: 'Request submitted successfully',
      data: {
        requestId,
        approvalChain: approvalChain.length
      }
    });

  } catch (error) {
    logger.error('Error in POST /api/submit-request:', error);
    res.status(500).json({
      error: 'Failed to submit request',
      message: error.message
    });
  }
});

/**
 * POST /api/approve-request
 * Approve a discount request
 */
router.post('/approve-request', [
  body('requestId').notEmpty().isInt({ min: 1 }),
  body('approverEmail').isEmail().normalizeEmail(),
  body('approverSlackId').notEmpty().trim().escape()
], validateRequest, async (req, res) => {
  try {
    const { requestId, approverEmail, approverSlackId } = req.body;
    
    logger.info(`POST /api/approve-request - Approving request: ${requestId} by: ${approverEmail}`);

    // Load directory and get request details
    const directory = await loadDirectory();
    
    // Get request details (you would implement this function)
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

    // Update request status
    await updateRequestStatus(requestId, {
      'ApprovalStatus': 'APPROVED',
      'FinalApprover': approverEmail,
      'FinalizedOn': new Date().toISOString()
    });

    // Send final notification to Taylor
    await sendFinalNotification(requestDetails, 'APPROVED', approverEmail);

    res.json({
      success: true,
      message: 'Request approved successfully'
    });

  } catch (error) {
    logger.error('Error in POST /api/approve-request:', error);
    res.status(500).json({
      error: 'Failed to approve request',
      message: error.message
    });
  }
});

/**
 * POST /api/reject-request
 * Reject a discount request
 */
router.post('/reject-request', [
  body('requestId').notEmpty().isInt({ min: 1 }),
  body('approverEmail').isEmail().normalizeEmail(),
  body('rejectionReason').notEmpty().trim().escape()
], validateRequest, async (req, res) => {
  try {
    const { requestId, approverEmail, rejectionReason } = req.body;
    
    logger.info(`POST /api/reject-request - Rejecting request: ${requestId} by: ${approverEmail}`);

    // Update request status
    await updateRequestStatus(requestId, {
      'ApprovalStatus': 'REJECTED',
      'FinalApprover': approverEmail,
      'FinalizedOn': new Date().toISOString(),
      'ApprovalPathJSON': JSON.stringify([{
        approver: approverEmail,
        action: 'REJECTED',
        timestamp: new Date().toISOString(),
        reason: rejectionReason
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
    await sendFinalNotification(requestDetails, 'REJECTED', approverEmail);

    res.json({
      success: true,
      message: 'Request rejected successfully'
    });

  } catch (error) {
    logger.error('Error in POST /api/reject-request:', error);
    res.status(500).json({
      error: 'Failed to reject request',
      message: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Delayed Start Discount Request API'
  });
});

/**
 * GET /api/status
 * Get system status and configuration
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      googleSheets: 'configured',
      slack: process.env.SLACK_BOT_TOKEN ? 'configured' : 'not configured',
      scheduler: 'running'
    }
  });
});

module.exports = router;
