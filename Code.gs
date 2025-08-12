/**
 * Delayed Start Discount Request System
 * Google Apps Script Backend
 * 
 * This script provides the backend functionality for the Delayed Start Discount Request web app,
 * including data retrieval, request processing, and Slack approval workflow management.
 */

// Configuration constants
const CONFIG = {
  PROJECTS_SHEET_ID: '1EvFncOFIAC378wLKkbbvIT4LP_d9rHcrRz-0pv8Lmkg',
  DIRECTORY_SHEET_ID: '1HpkqS3tOIlLrX0CG_Sqd_bu3qlReb2gQcxwtdQDsL_8',
  REQUESTS_SHEET_ID: '1EvFncOFIAC378wLKkbbvIT4LP_d9rHcrRz-0pv8Lmkg',
  SLACK_BOT_TOKEN: PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN'),
  SLACK_TAYLOR_ID: 'U07HNSYTE4D',
  AUTO_APPROVE_DAYS: 3,
  REMINDER_INTERVAL_HOURS: 24
};

// Sheet names
const SHEETS = {
  PROJECTS: 'Projects',
  DIRECTORY: 'Directory',
  REQUESTS: 'Requests',
  PENDING_APPROVALS: 'PendingApprovals'
};

// Required headers for each sheet
const REQUIRED_HEADERS = {
  PROJECTS: [
    'Id', 'Name', 'AE_Name__c', 'amc__Account__r.Id', 'amc__Account__r.Name',
    'amc__Account__r.Current_ACV__c', 'amc__Opportunity__c', 'amc__Opportunity__r.Name',
    'amc__Opportunity__r.Contact__r', 'amc__Start_Date__c', 'amc__Total_Hours_Completed__c',
    'amc__Total_Hours_Forecast__c', 'Contract_State_Date__c', 'CreatedDate',
    'Planned_Go_Live__c', 'Project_Manager_Name__c'
  ],
  DIRECTORY: [
    'Name', 'Email', 'Slack ID', 'Title', 'Birthday', 'StartDay', 'Gender', 'Timezone',
    'MGRName', 'MGREmail', 'MGRTitle', 'MGRSlack', 'Status', 'Department', 'Term Date', 'Department Simple'
  ],
  REQUESTS: [
    'Timestamp', 'RequestedByEmail', 'AccountName', 'AccountId', 'OpportunityName', 'OpportunityId',
    'ProjectName', 'ProjectId', 'ProjectCreatedDate', 'AE_Name__c', 'Project_Manager_Name__c',
    'Contract_State_Date__c', 'Planned_Go_Live__c', 'Current_ACV', 'Hours_Budgeted', 'Hours_Delivered',
    'Notes_Justification', 'Lessons_Learned', 'Delay_End_Date', 'ApprovalStatus', 'FinalApprover',
    'FinalizedOn', 'ApprovalPathJSON'
  ]
};

/**
 * Main entry point for web app
 */
function doGet() {
  try {
    // Validate configuration
    if (!CONFIG.SLACK_BOT_TOKEN) {
      throw new Error('SLACK_BOT_TOKEN not configured in Script Properties');
    }
    
    // Ensure all required sheets exist with proper headers
    _ensureAllSheets();
    
    // Return the HTML interface
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Delayed Start Discount Request')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    console.error('Error in doGet:', error);
    return HtmlService.createHtmlOutput(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #d32f2f;">Configuration Error</h1>
          <p>${error.message}</p>
          <p>Please check the script configuration and try again.</p>
        </body>
      </html>
    `);
  }
}

/**
 * Handle POST requests from Slack interactive components
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.parameter.payload);
    
    if (payload.type === 'interactive_message' || payload.type === 'block_actions') {
      return _handleSlackInteraction(payload);
    }
    
    return ContentService.createTextOutput('OK');
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService.createTextOutput('Error processing request');
  }
}

/**
 * Get distinct accounts from Projects sheet
 */
function getAccounts() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.PROJECTS_SHEET_ID).getSheetByName(SHEETS.PROJECTS);
    if (!sheet) {
      throw new Error('Projects sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const accountColumnIndex = headers.indexOf('amc__Account__r.Name');
    
    if (accountColumnIndex === -1) {
      throw new Error('Account column not found in Projects sheet');
    }
    
    // Get distinct accounts (skip header row)
    const accounts = [...new Set(data.slice(1).map(row => row[accountColumnIndex]).filter(Boolean))];
    return accounts.sort();
    
  } catch (error) {
    console.error('Error in getAccounts:', error);
    throw new Error('Failed to retrieve accounts: ' + error.message);
  }
}

/**
 * Get opportunities for a specific account
 */
function getOppData(accountName) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.PROJECTS_SHEET_ID).getSheetByName(SHEETS.PROJECTS);
    if (!sheet) {
      throw new Error('Projects sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const accountColumnIndex = headers.indexOf('amc__Account__r.Name');
    const oppColumnIndex = headers.indexOf('amc__Opportunity__r.Name');
    
    if (accountColumnIndex === -1 || oppColumnIndex === -1) {
      throw new Error('Required columns not found in Projects sheet');
    }
    
    // Filter opportunities by account (skip header row)
    const opportunities = data.slice(1)
      .filter(row => row[accountColumnIndex] === accountName)
      .map(row => row[oppColumnIndex])
      .filter(Boolean);
    
    return [...new Set(opportunities)].sort();
    
  } catch (error) {
    console.error('Error in getOppData:', error);
    throw new Error('Failed to retrieve opportunities: ' + error.message);
  }
}

/**
 * Get projects for a specific account and opportunity
 */
function getProjectData(accountName, opportunityName) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.PROJECTS_SHEET_ID).getSheetByName(SHEETS.PROJECTS);
    if (!sheet) {
      throw new Error('Projects sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const accountColumnIndex = headers.indexOf('amc__Account__r.Name');
    const oppColumnIndex = headers.indexOf('amc__Opportunity__r.Name');
    const projectColumnIndex = headers.indexOf('Name');
    
    if (accountColumnIndex === -1 || oppColumnIndex === -1 || projectColumnIndex === -1) {
      throw new Error('Required columns not found in Projects sheet');
    }
    
    // Filter projects by account and opportunity (skip header row)
    const projects = data.slice(1)
      .filter(row => 
        row[accountColumnIndex] === accountName && 
        row[oppColumnIndex] === opportunityName
      )
      .map(row => row[projectColumnIndex])
      .filter(Boolean);
    
    return [...new Set(projects)].sort();
    
  } catch (error) {
    console.error('Error in getProjectData:', error);
    throw new Error('Failed to retrieve projects: ' + error.message);
  }
}

/**
 * Get detailed project information
 */
function getProjectDetails(projectName) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.PROJECTS_SHEET_ID).getSheetByName(SHEETS.PROJECTS);
    if (!sheet) {
      throw new Error('Projects sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const projectColumnIndex = headers.indexOf('Name');
    
    if (projectColumnIndex === -1) {
      throw new Error('Project column not found in Projects sheet');
    }
    
    // Find the project row (skip header row)
    const projectRow = data.slice(1).find(row => row[projectColumnIndex] === projectName);
    if (!projectRow) {
      throw new Error('Project not found: ' + projectName);
    }
    
    // Extract project details
    const details = {
      id: projectRow[headers.indexOf('Id')] || '',
      name: projectRow[headers.indexOf('Name')] || '',
      aeName: projectRow[headers.indexOf('AE_Name__c')] || '',
      accountId: projectRow[headers.indexOf('amc__Account__r.Id')] || '',
      accountName: projectRow[headers.indexOf('amc__Account__r.Name')] || '',
      currentACV: projectRow[headers.indexOf('amc__Account__r.Current_ACV__c')] || '',
      opportunityId: projectRow[headers.indexOf('amc__Opportunity__c')] || '',
      opportunityName: projectRow[headers.indexOf('amc__Opportunity__r.Name')] || '',
      contact: projectRow[headers.indexOf('amc__Opportunity__r.Contact__r')] || '',
      startDate: projectRow[headers.indexOf('amc__Start_Date__c')] || '',
      hoursCompleted: projectRow[headers.indexOf('amc__Total_Hours_Completed__c')] || '',
      hoursForecast: projectRow[headers.indexOf('amc__Total_Hours_Forecast__c')] || '',
      contractStartDate: projectRow[headers.indexOf('Contract_State_Date__c')] || '',
      createdDate: projectRow[headers.indexOf('CreatedDate')] || '',
      plannedGoLive: projectRow[headers.indexOf('Planned_Go_Live__c')] || '',
      projectManagerName: projectRow[headers.indexOf('Project_Manager_Name__c')] || ''
    };
    
    return details;
    
  } catch (error) {
    console.error('Error in getProjectDetails:', error);
    throw new Error('Failed to retrieve project details: ' + error.message);
  }
}

/**
 * Submit a new discount request
 */
function submitRequest(payload) {
  try {
    // Validate required fields
    const requiredFields = ['accountName', 'opportunityName', 'projectName', 'notes', 'lessonsLearned', 'delayEndDate'];
    for (const field of requiredFields) {
      if (!payload[field]) {
        throw new Error(`Required field missing: ${field}`);
      }
    }
    
    // Get project details
    const projectDetails = getProjectDetails(payload.projectName);
    
    // Get requester email
    const requesterEmail = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
    if (!requesterEmail) {
      throw new Error('Unable to determine requester email');
    }
    
    // Create request record
    const requestData = {
      timestamp: new Date().toISOString(),
      requestedByEmail: requesterEmail,
      accountName: payload.accountName,
      accountId: projectDetails.accountId,
      opportunityName: payload.opportunityName,
      opportunityId: projectDetails.opportunityId,
      projectName: payload.projectName,
      projectId: projectDetails.id,
      projectCreatedDate: projectDetails.createdDate,
      aeName: projectDetails.aeName,
      projectManagerName: projectDetails.projectManagerName,
      contractStartDate: projectDetails.contractStartDate,
      plannedGoLive: projectDetails.plannedGoLive,
      currentACV: projectDetails.currentACV,
      hoursBudgeted: projectDetails.hoursForecast,
      hoursDelivered: projectDetails.hoursCompleted,
      notesJustification: payload.notes,
      lessonsLearned: payload.lessonsLearned,
      delayEndDate: payload.delayEndDate,
      approvalStatus: 'PENDING',
      finalApprover: '',
      finalizedOn: '',
      approvalPathJSON: ''
    };
    
    // Log to Requests sheet
    const requestId = _appendToRequests(requestData);
    
    // Start approval workflow
    _startApprovalWorkflow(requestId, requestData);
    
    return {
      success: true,
      message: 'Request submitted successfully',
      requestId: requestId
    };
    
  } catch (error) {
    console.error('Error in submitRequest:', error);
    throw new Error('Failed to submit request: ' + error.message);
  }
}

/**
 * Setup the approval system (run once)
 */
function setupApprovalSystem() {
  try {
    // Create PendingApprovals sheet if it doesn't exist
    const requestsSheet = SpreadsheetApp.openById(CONFIG.REQUESTS_SHEET_ID);
    let pendingSheet = requestsSheet.getSheetByName(SHEETS.PENDING_APPROVALS);
    
    if (!pendingSheet) {
      pendingSheet = requestsSheet.insertSheet(SHEETS.PENDING_APPROVALS);
      const headers = [
        'RequestId', 'RequesterEmail', 'CurrentApprover', 'ApprovalChain', 'CreatedAt', 
        'LastReminder', 'Status', 'NextApprover', 'ApprovalPath'
      ];
      pendingSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    // Create hourly trigger for reminders
    const triggers = ScriptApp.getProjectTriggers();
    const reminderTrigger = triggers.find(trigger => 
      trigger.getHandlerFunction() === 'approvalReminderSweep'
    );
    
    if (!reminderTrigger) {
      ScriptApp.newTrigger('approvalReminderSweep')
        .timeBased()
        .everyHours(1)
        .create();
    }
    
    console.log('Approval system setup completed');
    return 'Approval system setup completed successfully';
    
  } catch (error) {
    console.error('Error in setupApprovalSystem:', error);
    throw new Error('Failed to setup approval system: ' + error.message);
  }
}

/**
 * Send approval reminders and handle auto-approvals
 */
function approvalReminderSweep() {
  try {
    const pendingSheet = SpreadsheetApp.openById(CONFIG.REQUESTS_SHEET_ID)
      .getSheetByName(SHEETS.PENDING_APPROVALS);
    
    if (!pendingSheet) {
      console.log('PendingApprovals sheet not found');
      return;
    }
    
    const data = pendingSheet.getDataRange().getValues();
    const headers = data[0];
    const now = new Date();
    
    // Process each pending approval
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const requestId = row[headers.indexOf('RequestId')];
      const createdAt = new Date(row[headers.indexOf('CreatedAt')]);
      const lastReminder = row[headers.indexOf('LastReminder')] ? new Date(row[headers.indexOf('LastReminder')]) : null;
      const status = row[headers.indexOf('Status')];
      
      if (status !== 'PENDING') continue;
      
      // Check if auto-approval is needed (> 3 business days)
      const businessDays = _calculateBusinessDays(createdAt, now);
      if (businessDays > CONFIG.AUTO_APPROVE_DAYS) {
        _autoApproveRequest(requestId);
        continue;
      }
      
      // Send reminder if needed (every 24 hours)
      if (!lastReminder || (now - lastReminder) >= CONFIG.REMINDER_INTERVAL_HOURS * 60 * 60 * 1000) {
        _sendApprovalReminder(requestId);
        
        // Update last reminder timestamp
        const lastReminderIndex = headers.indexOf('LastReminder');
        pendingSheet.getRange(i + 1, lastReminderIndex + 1).setValue(now);
      }
    }
    
  } catch (error) {
    console.error('Error in approvalReminderSweep:', error);
  }
}

// Private helper functions (prefixed with _)

/**
 * Ensure all required sheets exist with proper headers
 */
function _ensureAllSheets() {
  try {
    // Ensure Projects sheet exists and has required headers
    const projectsSheet = SpreadsheetApp.openById(CONFIG.PROJECTS_SHEET_ID).getSheetByName(SHEETS.PROJECTS);
    if (!projectsSheet) {
      throw new Error('Projects sheet not found. Please ensure the sheet exists and is accessible.');
    }
    
    // Ensure Directory sheet exists and has required headers
    const directorySheet = SpreadsheetApp.openById(CONFIG.DIRECTORY_SHEET_ID).getSheetByName(SHEETS.DIRECTORY);
    if (!directorySheet) {
      throw new Error('Directory sheet not found. Please ensure the sheet exists and is accessible.');
    }
    
    // Ensure Requests sheet exists with proper headers
    _ensureRequestsSheet();
    
    console.log('All required sheets validated successfully');
    
  } catch (error) {
    console.error('Error in _ensureAllSheets:', error);
    throw error;
  }
}

/**
 * Ensure Requests sheet exists with proper headers
 */
function _ensureRequestsSheet() {
  try {
    const requestsSpreadsheet = SpreadsheetApp.openById(CONFIG.REQUESTS_SHEET_ID);
    let requestsSheet = requestsSpreadsheet.getSheetByName(SHEETS.REQUESTS);
    
    if (!requestsSheet) {
      requestsSheet = requestsSpreadsheet.insertSheet(SHEETS.REQUESTS);
    }
    
    // Check if headers exist
    const data = requestsSheet.getDataRange().getValues();
    if (data.length === 0 || data[0].length === 0) {
      // Set headers
      requestsSheet.getRange(1, 1, 1, REQUIRED_HEADERS.REQUESTS.length)
        .setValues([REQUIRED_HEADERS.REQUESTS]);
    }
    
  } catch (error) {
    console.error('Error in _ensureRequestsSheet:', error);
    throw new Error('Failed to ensure Requests sheet: ' + error.message);
  }
}

/**
 * Append a new request to the Requests sheet
 */
function _appendToRequests(requestData) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.REQUESTS_SHEET_ID).getSheetByName(SHEETS.REQUESTS);
    if (!sheet) {
      throw new Error('Requests sheet not found');
    }
    
    const rowData = [
      requestData.timestamp,
      requestData.requestedByEmail,
      requestData.accountName,
      requestData.accountId,
      requestData.opportunityName,
      requestData.opportunityId,
      requestData.projectName,
      requestData.projectId,
      requestData.projectCreatedDate,
      requestData.aeName,
      requestData.projectManagerName,
      requestData.contractStartDate,
      requestData.plannedGoLive,
      requestData.currentACV,
      requestData.hoursBudgeted,
      requestData.hoursDelivered,
      requestData.notesJustification,
      requestData.lessonsLearned,
      requestData.delayEndDate,
      requestData.approvalStatus,
      requestData.finalApprover,
      requestData.finalizedOn,
      requestData.approvalPathJSON
    ];
    
    const lastRow = sheet.getLastRow() + 1;
    sheet.getRange(lastRow, 1, 1, rowData.length).setValues([rowData]);
    
    return lastRow;
    
  } catch (error) {
    console.error('Error in _appendToRequests:', error);
    throw new Error('Failed to append request: ' + error.message);
  }
}

/**
 * Start the approval workflow for a new request
 */
function _startApprovalWorkflow(requestId, requestData) {
  try {
    // Load directory data
    const directory = _loadDirectory();
    
    // Build approval chain
    const approvalChain = _buildApprovalChain(requestData.requestedByEmail, directory);
    
    // Add to PendingApprovals sheet
    const pendingSheet = SpreadsheetApp.openById(CONFIG.REQUESTS_SHEET_ID)
      .getSheetByName(SHEETS.PENDING_APPROVALS);
    
    const headers = pendingSheet.getDataRange().getValues()[0];
    const rowData = [
      requestId,
      requestData.requestedByEmail,
      approvalChain[0] || '', // Current approver
      JSON.stringify(approvalChain),
      new Date().toISOString(),
      '', // Last reminder
      'PENDING',
      approvalChain[1] || '', // Next approver
      JSON.stringify([]) // Approval path
    ];
    
    const lastRow = pendingSheet.getLastRow() + 1;
    pendingSheet.getRange(lastRow, 1, 1, rowData.length).setValues([rowData]);
    
    // Send first approval request
    if (approvalChain.length > 0) {
      _sendApprovalRequest(requestId, requestData, approvalChain[0]);
    }
    
  } catch (error) {
    console.error('Error in _startApprovalWorkflow:', error);
    throw new Error('Failed to start approval workflow: ' + error.message);
  }
}

/**
 * Load directory data from the Directory sheet
 */
function _loadDirectory() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.DIRECTORY_SHEET_ID).getSheetByName(SHEETS.DIRECTORY);
    if (!sheet) {
      throw new Error('Directory sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const directory = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      directory.push({
        name: row[headers.indexOf('Name')] || '',
        email: row[headers.indexOf('Email')] || '',
        slackId: row[headers.indexOf('Slack ID')] || '',
        title: row[headers.indexOf('Title')] || '',
        mgrName: row[headers.indexOf('MGRName')] || '',
        mgrEmail: row[headers.indexOf('MGREmail')] || '',
        mgrSlack: row[headers.indexOf('MGRSlack')] || '',
        status: row[headers.indexOf('Status')] || ''
      });
    }
    
    return directory;
    
  } catch (error) {
    console.error('Error in _loadDirectory:', error);
    throw new Error('Failed to load directory: ' + error.message);
  }
}

/**
 * Build approval chain for a requester
 */
function _buildApprovalChain(requesterEmail, directory) {
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
    console.error('Error in _buildApprovalChain:', error);
    throw new Error('Failed to build approval chain: ' + error.message);
  }
}

/**
 * Send approval request to an approver
 */
function _sendApprovalRequest(requestId, requestData, approverEmail) {
  try {
    // Find approver in directory
    const directory = _loadDirectory();
    const approver = directory.find(p => p.email === approverEmail);
    
    if (!approver || !approver.slackId) {
      console.warn(`Approver not found or no Slack ID: ${approverEmail}`);
      return;
    }
    
    // Open DM with approver
    const im = _slackOpenIM(approver.slackId);
    
    // Send approval message
    const message = _formatApprovalMessage(requestId, requestData);
    _slackPostMessage(im.channel.id, message);
    
  } catch (error) {
    console.error('Error in _sendApprovalRequest:', error);
  }
}

/**
 * Send approval reminder
 */
function _sendApprovalReminder(requestId) {
  try {
    // Implementation for sending reminders
    console.log(`Sending reminder for request ${requestId}`);
    
  } catch (error) {
    console.error('Error in _sendApprovalReminder:', error);
  }
}

/**
 * Auto-approve request after timeout
 */
function _autoApproveRequest(requestId) {
  try {
    // Implementation for auto-approval
    console.log(`Auto-approving request ${requestId}`);
    
  } catch (error) {
    console.error('Error in _autoApproveRequest:', error);
  }
}

/**
 * Handle Slack interaction (approval/rejection)
 */
function _handleSlackInteraction(payload) {
  try {
    // Implementation for handling Slack button clicks
    console.log('Slack interaction received:', payload);
    
    return ContentService.createTextOutput('OK');
    
  } catch (error) {
    console.error('Error in _handleSlackInteraction:', error);
    return ContentService.createTextOutput('Error processing interaction');
  }
}

/**
 * Open Slack direct message
 */
function _slackOpenIM(userId) {
  try {
    const response = UrlFetchApp.fetch('https://slack.com/api/conversations.open', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        users: userId
      })
    });
    
    const result = JSON.parse(response.getContentText());
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error in _slackOpenIM:', error);
    throw new Error('Failed to open Slack DM: ' + error.message);
  }
}

/**
 * Post message to Slack
 */
function _slackPostMessage(channelId, message) {
  try {
    const response = UrlFetchApp.fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        channel: channelId,
        text: message.text,
        blocks: message.blocks
      })
    });
    
    const result = JSON.parse(response.getContentText());
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error in _slackPostMessage:', error);
    throw new Error('Failed to post Slack message: ' + error.message);
  }
}

/**
 * Format approval message for Slack
 */
function _formatApprovalMessage(requestId, requestData) {
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
 * Calculate business days between two dates
 */
function _calculateBusinessDays(startDate, endDate) {
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
    console.error('Error in _calculateBusinessDays:', error);
    return 0;
  }
}
