/**
 * Google Sheets Utility Service
 * 
 * Handles authentication and data operations for Google Sheets integration
 */

const { google } = require('googleapis');
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'google-sheets' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

let sheets;
let auth;
let mockMode = false;

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
 * Initialize Google Sheets service
 */
async function initializeGoogleSheets() {
  try {
    // Check if we have the required environment variables
    const hasCredentials = process.env.GOOGLE_SHEETS_CLIENT_EMAIL && 
                          process.env.GOOGLE_SHEETS_PRIVATE_KEY && 
                          process.env.GOOGLE_SHEETS_PROJECT_ID;
    
    if (!hasCredentials) {
      logger.warn('Google Sheets credentials not found, running in mock mode for testing');
      mockMode = true;
      return;
    }

    // Create JWT client
    auth = new google.auth.JWT(
      process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    // Authorize the client
    await auth.authorize();
    logger.info('Google Sheets authentication successful');

    // Create sheets instance
    sheets = google.sheets({ version: 'v4', auth });

    // Verify access to required spreadsheets
    await verifySpreadsheetAccess();

    logger.info('Google Sheets service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Google Sheets service:', error);
    logger.warn('Falling back to mock mode for testing');
    mockMode = true;
  }
}

/**
 * Verify access to required spreadsheets
 */
async function verifySpreadsheetAccess() {
  const spreadsheets = [
    { id: process.env.PROJECTS_SHEET_ID, name: 'Projects' },
    { id: process.env.DIRECTORY_SHEET_ID, name: 'Directory' },
    { id: process.env.REQUESTS_SHEET_ID, name: 'Requests' }
  ];

  for (const spreadsheet of spreadsheets) {
    try {
      const response = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheet.id
      });
      logger.info(`Access verified for ${spreadsheet.name} spreadsheet`);
    } catch (error) {
      logger.error(`Failed to access ${spreadsheet.name} spreadsheet:`, error);
      throw new Error(`Cannot access ${spreadsheet.name} spreadsheet: ${error.message}`);
    }
  }
}

/**
 * Get distinct accounts from Projects sheet
 */
async function getAccounts() {
  try {
    if (mockMode) {
      // Return mock data for testing
      return [
        'Test Account 1',
        'Test Account 2', 
        'Point of Rental',
        'ABC Company',
        'XYZ Corporation'
      ];
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.PROJECTS_SHEET_ID,
      range: 'Projects!A:Z'
    });

    const values = response.data.values;
    if (!values || values.length === 0) {
      throw new Error('No data found in Projects sheet');
    }

    const headers = values[0];
    const accountColumnIndex = headers.indexOf('amc__Account__r.Name');
    
    if (accountColumnIndex === -1) {
      throw new Error('Account column not found in Projects sheet');
    }

    // Get distinct accounts (skip header row)
    const accounts = [...new Set(values.slice(1).map(row => row[accountColumnIndex]).filter(Boolean))];
    return accounts.sort();
  } catch (error) {
    logger.error('Error getting accounts:', error);
    throw new Error(`Failed to retrieve accounts: ${error.message}`);
  }
}

/**
 * Get opportunities for a specific account
 */
async function getOpportunities(accountName) {
  try {
    if (mockMode) {
      // Return mock data for testing
      return [
        `${accountName} - Opportunity 1`,
        `${accountName} - Opportunity 2`,
        `${accountName} - Implementation Project`,
        `${accountName} - Support Contract`
      ];
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.PROJECTS_SHEET_ID,
      range: 'Projects!A:Z'
    });

    const values = response.data.values;
    if (!values || values.length === 0) {
      throw new Error('No data found in Projects sheet');
    }

    const headers = values[0];
    const accountColumnIndex = headers.indexOf('amc__Account__r.Name');
    const oppColumnIndex = headers.indexOf('amc__Opportunity__r.Name');
    
    if (accountColumnIndex === -1 || oppColumnIndex === -1) {
      throw new Error('Required columns not found in Projects sheet');
    }

    // Filter opportunities by account (skip header row)
    const opportunities = values.slice(1)
      .filter(row => row[accountColumnIndex] === accountName)
      .map(row => row[oppColumnIndex])
      .filter(Boolean);

    return [...new Set(opportunities)].sort();
  } catch (error) {
    logger.error('Error getting opportunities:', error);
    throw new Error(`Failed to retrieve opportunities: ${error.message}`);
  }
}

/**
 * Get projects for a specific account and opportunity
 */
async function getProjects(accountName, opportunityName) {
  try {
    if (mockMode) {
      // Return mock data for testing
      return [
        `${opportunityName} - Project Alpha`,
        `${opportunityName} - Project Beta`,
        `${opportunityName} - Phase 1 Implementation`,
        `${opportunityName} - Phase 2 Rollout`
      ];
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.PROJECTS_SHEET_ID,
      range: 'Projects!A:Z'
    });

    const values = response.data.values;
    if (!values || values.length === 0) {
      throw new Error('No data found in Projects sheet');
    }

    const headers = values[0];
    const accountColumnIndex = headers.indexOf('amc__Account__r.Name');
    const oppColumnIndex = headers.indexOf('amc__Opportunity__r.Name');
    const projectColumnIndex = headers.indexOf('Name');
    
    if (accountColumnIndex === -1 || oppColumnIndex === -1 || projectColumnIndex === -1) {
      throw new Error('Required columns not found in Projects sheet');
    }

    // Filter projects by account and opportunity (skip header row)
    const projects = values.slice(1)
      .filter(row => 
        row[accountColumnIndex] === accountName && 
        row[oppColumnIndex] === opportunityName
      )
      .map(row => row[projectColumnIndex])
      .filter(Boolean);

    return [...new Set(projects)].sort();
  } catch (error) {
    logger.error('Error getting projects:', error);
    throw new Error(`Failed to retrieve projects: ${error.message}`);
  }
}

/**
 * Get detailed information for a specific project
 */
async function getProjectDetails(projectName) {
  try {
    if (mockMode) {
      // Return mock project details for testing
      return {
        aeName: 'John Smith',
        projectManagerName: 'Jane Doe',
        contractStartDate: '2024-01-15',
        plannedGoLive: '2024-06-30',
        currentACV: '$150,000',
        hoursForecast: '800',
        hoursCompleted: '450',
        projectStatus: 'In Progress',
        delayReason: 'Resource constraints',
        riskLevel: 'Medium'
      };
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.PROJECTS_SHEET_ID,
      range: 'Projects!A:Z'
    });

    const values = response.data.values;
    if (!values || values.length === 0) {
      throw new Error('No data found in Projects sheet');
    }

    const headers = values[0];
    const projectColumnIndex = headers.indexOf('Name');
    
    if (projectColumnIndex === -1) {
      throw new Error('Project column not found in Projects sheet');
    }

    // Find the project row
    const projectRow = values.slice(1).find(row => row[projectColumnIndex] === projectName);
    if (!projectRow) {
      throw new Error(`Project '${projectName}' not found`);
    }

    // Map the data to the expected format
    const projectDetails = {
      aeName: projectRow[headers.indexOf('amc__Account_Executive__r.Name')] || '-',
      projectManagerName: projectRow[headers.indexOf('amc__Project_Manager__r.Name')] || '-',
      contractStartDate: projectRow[headers.indexOf('amc__Contract_Start_Date__c')] || '-',
      plannedGoLive: projectRow[headers.indexOf('amc__Planned_Go_Live__c')] || '-',
      currentACV: projectRow[headers.indexOf('amc__Current_ACV__c')] || '-',
      hoursForecast: projectRow[headers.indexOf('amc__Hours_Forecast__c')] || '-',
      hoursCompleted: projectRow[headers.indexOf('amc__Hours_Completed__c')] || '-',
      projectStatus: projectRow[headers.indexOf('amc__Status__c')] || '-',
      delayReason: projectRow[headers.indexOf('amc__Delay_Reason__c')] || '-',
      riskLevel: projectRow[headers.indexOf('amc__Risk_Level__c')] || '-'
    };

    return projectDetails;
  } catch (error) {
    logger.error('Error getting project details:', error);
    throw new Error(`Failed to retrieve project details: ${error.message}`);
  }
}

/**
 * Load directory data from the Directory sheet
 */
async function loadDirectory() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.DIRECTORY_SHEET_ID,
      range: 'Directory!A:Z'
    });

    const values = response.data.values;
    if (!values || values.length === 0) {
      throw new Error('No data found in Directory sheet');
    }

    const headers = values[0];
    const directory = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
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
    logger.error('Error loading directory:', error);
    throw new Error(`Failed to load directory: ${error.message}`);
  }
}

/**
 * Ensure Requests sheet exists with proper headers
 */
async function ensureRequestsSheet() {
  try {
    // Check if Requests sheet exists
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.REQUESTS_SHEET_ID
    });

    const sheetNames = response.data.sheets.map(sheet => sheet.properties.title);
    let requestsSheetExists = sheetNames.includes('Requests');

    if (!requestsSheetExists) {
      // Create Requests sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.REQUESTS_SHEET_ID,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Requests'
                }
              }
            }
          ]
        }
      });
      logger.info('Requests sheet created');
    }

    // Set headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.REQUESTS_SHEET_ID,
      range: 'Requests!A1',
      valueInputOption: 'RAW',
      resource: {
        values: [REQUIRED_HEADERS.REQUESTS]
      }
    });

    logger.info('Requests sheet headers set');
  } catch (error) {
    logger.error('Error ensuring Requests sheet:', error);
    throw new Error(`Failed to ensure Requests sheet: ${error.message}`);
  }
}

/**
 * Append a new request to the Requests sheet
 */
async function appendRequest(requestData) {
  try {
    await ensureRequestsSheet();

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

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.REQUESTS_SHEET_ID,
      range: 'Requests!A:Z',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [rowData]
      }
    });

    // Extract the row number from the response
    const updatedRange = response.data.updates.updatedRange;
    const rowNumber = parseInt(updatedRange.match(/Requests!A(\d+)/)[1]);

    logger.info(`Request appended to row ${rowNumber}`);
    return rowNumber;
  } catch (error) {
    logger.error('Error appending request:', error);
    throw new Error(`Failed to append request: ${error.message}`);
  }
}

/**
 * Update request status in the Requests sheet
 */
async function updateRequestStatus(rowNumber, updates) {
  try {
    const updateData = [];
    const headers = REQUIRED_HEADERS.REQUESTS;

    // Find the columns to update
    Object.keys(updates).forEach(key => {
      const columnIndex = headers.indexOf(key);
      if (columnIndex !== -1) {
        updateData.push({
          range: `Requests!${String.fromCharCode(65 + columnIndex)}${rowNumber}`,
          values: [[updates[key]]]
        });
      }
    });

    if (updateData.length === 0) {
      logger.warn('No valid columns found for update');
      return;
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: process.env.REQUESTS_SHEET_ID,
      resource: {
        valueInputOption: 'RAW',
        data: updateData
      }
    });

    logger.info(`Request ${rowNumber} updated successfully`);
  } catch (error) {
    logger.error('Error updating request status:', error);
    throw new Error(`Failed to update request status: ${error.message}`);
  }
}

module.exports = {
  initializeGoogleSheets,
  getAccounts,
  getOpportunities,
  getProjects,
  getProjectDetails,
  loadDirectory,
  ensureRequestsSheet,
  appendRequest,
  updateRequestStatus
};
