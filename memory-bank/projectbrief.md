# Project Brief: Delayed Start Discount Request System

## Project Overview
Create a Google Apps Script-powered web application that enables internal users to submit delayed start discount requests through a structured approval workflow.

## Core Requirements

### Primary Goal
Build a web app that allows users to:
1. Select Account → Opportunity → Project from live CRM data
2. Auto-fill project details (read-only)
3. Enter justification fields
4. Submit for multi-level Slack approval workflow
5. Track approval chain through manager hierarchy until reaching Jason Amacker or Dean Hammond

### Key Features
- **Cascading Dropdowns**: Account → Opportunity → Project selection
- **Auto-population**: Project details automatically filled and locked
- **Slack Integration**: Multi-level approval workflow with reminders
- **Data Logging**: All requests logged to Requests sheet
- **Final Notification**: Summary sent to Taylor Garrity upon completion

### Technical Stack
- **Platform**: Google Apps Script
- **UI**: HTML/CSS/JavaScript embedded web app
- **Data Sources**: Google Sheets (Projects, Directory, Requests)
- **Integration**: Slack API for approvals and notifications
- **Authentication**: Google Apps Script session management

## Success Criteria
1. Seamless cascading dropdown experience
2. Automatic project detail population
3. Complete Slack approval workflow
4. Proper data logging and tracking
5. User-friendly interface with Point of Rental branding
6. Robust error handling and validation

## Out of Scope
- Google Form prefill/redirect functionality
- Legacy FormData tab integration
- Complex admin interfaces (backlog items)

## Project Status
**Phase**: Initial Setup and Planning
**Next Steps**: Create project structure, implement core data functions, build UI components
