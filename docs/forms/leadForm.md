# Lead Form Documentation

## Table of Contents
1. [Overview](#overview)
2. [How Lead Form Works](#how-lead-form-works)
3. [Differences from Offer Form](#differences-from-offer-form)
4. [Question Types](#question-types)
5. [Data Collection](#data-collection)
6. [Data Storage Structure](#data-storage-structure)
7. [Data Validation](#data-validation)
8. [Data Display](#data-display)
9. [File Handling](#file-handling)
10. [Form Builder Features](#form-builder-features)

---

## Overview

The Lead Form is a customer-facing form that allows potential buyers to express interest in properties. Unlike the Offer Form which collects formal purchase offers, the Lead Form is designed to gather initial interest, contact information, and preliminary buyer information.

**Purpose**: Collect leads from potential buyers who are interested in properties, allowing real estate agents to follow up with qualified prospects.

**Access**: Lead forms are publicly accessible via a URL pattern: `/updates/[username]` where `[username]` is the form owner's username.

---

## How Lead Form Works

### Form Lifecycle

1. **Form Creation**: Each user automatically gets a lead form created when they first access it (one per user)
2. **Form Configuration**: Users customize questions, branding, and form layout via the builder interface
3. **Public Access**: Forms are accessible via `/updates/[username]` URL
4. **Submission**: Potential buyers fill out and submit the form
5. **Data Storage**: Lead data is stored in the `leads` table in the database
6. **Viewing**: Form owners can view, filter, and manage leads in the leads dashboard

### Key Components

- **LeadFormPageContent** (`src/components/leadForm/LeadFormPageContent.tsx`): Main page showing form preview and sharing options
- **LeadFormInteractiveView** (`src/components/leadForm/LeadFormInteractiveView.tsx`): Interactive form component that handles user input, validation, and submission
- **LeadFormBuilderPageContent** (`src/components/leadForm/builder/LeadFormBuilderPageContent.tsx`): Builder interface for customizing questions
- **QuestionRenderer** (`src/components/offerForm/QuestionRenderer.tsx`): Shared component for rendering question inputs (used by both lead and offer forms)

### Form Structure

- **Pages**: Forms can have multiple pages with page breaks
- **Questions**: Each form has an ordered list of questions
- **Validation**: Per-page validation on "Next" button, full validation on submit
- **Branding**: Customizable colors, logo, background image, and font colors

---

## Differences from Offer Form

### Purpose & Scope

| Aspect | Lead Form | Offer Form |
|--------|-----------|------------|
| **Purpose** | Collect initial interest and contact info | Collect formal purchase offers |
| **Use Case** | Early stage buyer interest | Formal offer submission |
| **Complexity** | Simpler, fewer fields | More complex, detailed financial info |

### Question Types

**Lead Form Specific Questions:**
- `listingInterest`: Free-form text or listing selection
- `name`: First and last name (object structure)
- `email`: Email address
- `tel`: Phone number
- `areYouInterested`: Interest level (yes/no/maybe)
- `followAllListings`: Opt-in to follow all listings
- `opinionOfSalePrice`: Text or number input for price opinion
- `captureFinanceLeads`: Finance interest capture
- `messageToAgent`: Message with optional attachments
- `submitterRole`: Role selection (shared with offer form)
- `custom`: Custom questions (shared with offer form)

**Offer Form Specific Questions (NOT in Lead Form):**
- `specifyListing`: Listing selection (different from listingInterest)
- `offerAmount`: Offer amount with currency
- `nameOfPurchaser`: Purchaser names (more complex than lead form name)
- `deposit`: Deposit details with instalments
- `subjectToLoanApproval`: Loan approval details
- `offerExpiry`: Offer expiry date/time
- `settlementDate`: Settlement date configuration
- `specialConditions`: Special conditions list
- `attachPurchaseAgreement`: Purchase agreement upload

### Required Questions

**Lead Form Required (by default):**
- `listingInterest` (required)
- `name` (required)
- `email` (required)
- `tel` (required)
- `submitButton` (required)

**Offer Form Required (by default):**
- `specifyListing` (required)
- `submitterRole` (required)
- `submitterName` (required)
- `submitterEmail` (required)
- `submitterPhone` (required)
- `offerAmount` (required)
- `submitButton` (required)

### Data Structure

**Lead Form stores:**
- Simpler contact information
- Interest levels and preferences
- Basic listing interest
- Optional custom questions

**Offer Form stores:**
- Detailed financial information (offer amount, deposits)
- Complex structured data (deposit instalments, loan approval)
- Legal documents (purchase agreements)
- Settlement and expiry dates

---

## Question Types

### 1. Listing Interest (`listingInterest`)

**Purpose**: Collect which listing the user is interested in

**Input Type**: Free-form text input

**Data Collected**:
- If UUID format: Stored as `listingId` (references a listing)
- If text: Stored as `customListingAddress` (free-form address)

**Validation**:
- Maximum 500 characters
- Required by default

**Display**: Shows as property address, with link to listing if `listingId` exists

---

### 2. Name (`name`)

**Purpose**: Collect the submitter's first and last name

**Input Type**: Object with `firstName` and `lastName` fields

**Data Collected**:
- `submitterFirstName`: string
- `submitterLastName`: string

**Validation**:
- First name: max 150 characters, required if question is required
- Last name: max 150 characters, required if question is required

**Display**: Combined as "FirstName LastName"

---

### 3. Email (`email`)

**Purpose**: Collect the submitter's email address

**Input Type**: Email input field

**Data Collected**:
- `submitterEmail`: string (validated email format)

**Validation**:
- Valid email format (regex: `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`)
- Maximum 150 characters
- Required by default

**Display**: Email address as clickable mailto link

---

### 4. Phone Number (`tel`)

**Purpose**: Collect the submitter's mobile phone number

**Input Type**: Phone input with country code selector

**Data Collected**:
- `submitterPhone`: string (format: `+[countryCode][number]`, e.g., "+15551234567")

**Validation**:
- Country code: Format `+[1-3 digits]`
- Number: Minimum 4 digits (cleaned, digits only)
- Required by default

**Display**: Formatted phone number

---

### 5. Submitter Role (`submitterRole`)

**Purpose**: Identify the submitter's role

**Input Type**: Radio button selection

**Options**:
- `buyerSelf`: "Lead" (unrepresented buyer)
- `buyerWithAgent`: "Lead & Agent" (represented buyer)
- `buyersAgent`: "Agent" (buyer's agent)

**Data Collected**:
- `submitterRole`: Enum value (stored in database)

**Validation**: String selection

**Display**: Badge with role label (color-coded)

---

### 6. Are You Interested? (`areYouInterested`)

**Purpose**: Capture interest level from potential leads

**Input Type**: Multi-select or radio buttons (configurable)

**Setup Options**: Can include any combination of:
- `yesVeryInterested`: "Yes, very interested"
- `yes`: "Yes"
- `no`: "No"
- `maybe`: "Maybe"

**Data Collected**:
- `areYouInterested`: Enum value

**Validation**: String selection

**Display**: Human-readable label (e.g., "Yes, very interested")

---

### 7. Follow All Listings? (`followAllListings`)

**Purpose**: Allow leads to opt-in to follow all future listings

**Input Type**: Radio button selection

**Setup Options**:
- Can send information about the tool (yes/no)

**Data Collected**:
- `followAllListings`: Enum value (e.g., `thisAndFuture`, `thisOnly`)

**Validation**: String selection

**Display**: Human-readable format (e.g., "Yes, follow this listing and all future listings")

**Business Logic**: Creates a "Follower" - someone who automatically registers as a Lead for ALL future listings

---

### 8. Opinion of Sale Price (`opinionOfSalePrice`)

**Purpose**: Collect leads' opinions on sale price

**Input Type**: Configurable (text or number)

**Setup Options**:
- `text`: Free-form text input
- `number`: Number input (can include currency)

**Data Collected**:
- If number: JSON object `{ amount: number, currency: string }`
- If text: String value

**Validation**:
- Text: Maximum 1000 characters
- Number: Valid number with currency if applicable

**Display**: 
- Text: Display as-is
- Number: Formatted with currency symbol

---

### 9. Capture Finance Leads (`captureFinanceLeads`)

**Purpose**: Capture finance-related information from leads

**Input Type**: Radio button selection

**Setup Options**:
- `referralPartner`: Send leads to Finance Referral Partner (requires partner email)
- `selfManage`: Send leads to form owner (requires recipient email)

**Data Collected**:
- `financeInterest`: Enum value

**Validation**: String selection

**Display**: Capitalized interest level

**Business Logic**: Leads who authorize this (via Terms & Conditions) can receive communications from Finance Specialists

---

### 10. Message to Agent (`messageToAgent`)

**Purpose**: Let the Lead include a personal message

**Input Type**: Textarea with optional file attachments

**Setup Options**:
- `allowAttachments`: Yes/No (whether to allow file uploads)

**Data Collected**:
- JSON object: `{ message: string, attachmentUrls?: string[] }`
- Or simple string if no attachments

**Validation**:
- Message: Maximum 5000 characters
- Attachments: Files uploaded to Supabase Storage

**Display**: 
- Message text with line breaks preserved
- Attachments as clickable file links

**File Storage**: Files stored in `lead-attachments` bucket under path: `{leadId}/message-attachments/{filename}`

---

### 11. Custom Questions (`custom`)

**Purpose**: Create custom questions with various input types

**Answer Types Available**:
1. **Short Text** (`short_text`): Max 500 characters
2. **Long Text** (`long_text`): Max 5000 characters
3. **Number/Amount** (`number_amount`): Can be money (with currency), phone, or percentage
4. **File Upload** (`file_upload`): Single or multiple files
5. **Time/Date** (`time_date`): Time, Date, or DateTime
6. **Yes/No** (`yes_no`): Boolean with optional "Unsure" option
7. **Single Select** (`single_select`): One option from a list
8. **Multi Select** (`multi_select`): Multiple options from a list
9. **Statement** (`statement`): Text statement with optional agreement checkbox

**Data Collected**:
- Stored in `customQuestionsData` JSON field
- Structure: `{ [questionId]: { answerType: string, value: any } }`

**Validation**: Varies by answer type

**Display**: Formatted based on answer type (see `parseCustomQuestionsData.ts`)

**File Storage**: Custom question files stored in `lead-attachments` bucket under: `{leadId}/custom-files/{questionId}/{filename}`

---

### 12. Submit Button (`submitButton`)

**Purpose**: Final submission button with Terms & Conditions checkbox

**Input Type**: Checkbox + Submit button

**Data Collected**:
- `termsAccepted`: boolean (must be true to submit)

**Validation**: Must be checked (true) to submit

**Display**: Not displayed in detail view (only used during submission)

---

## Data Collection

### Form Submission Flow

1. **User Input**: User fills out form fields across pages
2. **Page Validation**: On "Next", validate current page
3. **File Upload**: Files uploaded to Supabase Storage client-side before submission
4. **Data Processing**: Form data transformed to database schema
5. **Submission**: Data saved to `leads` table
6. **Success**: User sees success message, form resets

### Data Transformation

The `transformFormDataToLead` function (`src/lib/transformLeadData.ts`) converts form data to database format:

- **Question ID → Database Field Mapping**: Each question type maps to specific database fields
- **Type Conversion**: Strings, objects, and files converted to appropriate database types
- **File URLs**: File objects replaced with Supabase Storage URLs
- **Custom Questions**: Custom question data aggregated into `customQuestionsData` JSON

---

## Data Storage Structure

### Database Table: `leads`

```typescript
{
  id: string (UUID)
  formId: string (references leadForms.id)
  listingId: string | null (references listings.id, if listing selected)
  customListingAddress: string | null (if free-form address entered)
  
  // Contact Information
  submitterFirstName: string | null
  submitterLastName: string | null
  submitterEmail: string | null
  submitterPhone: string | null
  
  // Role & Interest
  submitterRole: 'buyerSelf' | 'buyerWithAgent' | 'buyersAgent' | null
  areYouInterested: 'yesVeryInterested' | 'yes' | 'no' | 'maybe' | null
  followAllListings: 'thisAndFuture' | 'thisOnly' | null
  
  // Additional Data
  opinionOfSalePrice: string | null (JSON string if number, plain text if text)
  financeInterest: 'yes' | 'no' | null
  messageToAgent: JSON | null ({ message: string, attachmentUrls?: string[] })
  customQuestionsData: JSON | null ({ [questionId]: { answerType: string, value: any } })
  formData: JSON | null (catch-all for any other question types)
  
  // Metadata
  termsAccepted: boolean | null
  createdAt: string (timestamp)
  updatedAt: string | null (timestamp)
}
```

### File Storage Structure

**Supabase Storage Bucket**: `lead-attachments`

**File Paths**:
- Message attachments: `{leadId}/message-attachments/{filename}`
- Custom question files: `{leadId}/custom-files/{questionId}/{filename}`

**File Handling**:
- Files uploaded client-side before form submission
- URLs stored in database (not File objects)
- Files associated with lead via `leadId` in path

---

## Data Validation

### Validation Schema

Uses Yup validation library (`src/lib/leadFormValidation.ts`):

- **Per-Field Validation**: Each question type has specific validation rules
- **Required Fields**: Required questions must have values
- **Format Validation**: Email, phone, dates validated for correct format
- **Length Limits**: Text fields have maximum character limits
- **Page-Level Validation**: Validates current page before allowing "Next"
- **Full Validation**: Validates entire form on submit

### Validation Rules by Question Type

| Question Type | Validation Rules |
|--------------|------------------|
| `name` | firstName & lastName: max 150 chars, required if question required |
| `email` | Valid email format, max 150 chars |
| `tel` | Country code: `+[1-3 digits]`, Number: min 4 digits |
| `listingInterest` | Max 500 characters |
| `messageToAgent` | Message: max 5000 chars |
| `opinionOfSalePrice` | Text: max 1000 chars, Number: valid number + currency |
| `custom` | Varies by answer type (see validation file) |

### Validation Flow

1. **Real-time Validation**: Fields validated on blur
2. **Page Validation**: All fields on current page validated on "Next"
3. **Submit Validation**: Full form validated on submit
4. **Error Display**: Errors shown below fields with error messages
5. **Scroll to Error**: Form scrolls to first error field on validation failure

---

## Data Display

### Lead Detail Page

The lead detail page (`src/components/lead/LeadDetailPage.tsx`) displays all collected data:

#### Standard Fields Display

- **Property**: Listing address (link if listing exists) or custom address
- **Received**: Formatted date (e.g., "January 15, 2024")
- **Name**: Full name (firstName + lastName)
- **Email**: Email address (mailto link)
- **Phone**: Phone number
- **Role**: Badge with role label (color-coded)
- **Are You Interested?**: Badge with interest level
- **Follow All Listings?**: Human-readable text
- **Opinion of Sale Price**: Formatted value (text or currency)
- **Finance Interest**: Capitalized value
- **Message to Agent**: Message text + attachment links

#### Custom Questions Display

Custom questions are parsed and formatted using `parseCustomQuestionsData`:
- **Text**: Display as-is
- **Numbers**: Formatted with appropriate formatting (currency, percentage, phone)
- **Dates/Times**: Formatted as readable date/time strings
- **Files**: Clickable links with file icons
- **Yes/No**: "Yes" or "No" text
- **Selects**: Comma-separated selected values
- **Statements**: Display statement text

### Formatting Functions

Located in `src/lib/formatLeadData.tsx`:
- `formatSubmitterRole()`: Converts enum to readable label
- `formatAreYouInterested()`: Converts enum to readable text
- `formatFollowAllListings()`: Converts enum to readable text
- `formatFinanceInterest()`: Capitalizes value
- `formatMessageToAgent()`: Formats message + attachments as JSX
- `getRoleBadgeVariant()`: Returns badge color variant for role

### Lead List View

Leads displayed in a table with:
- Name
- Property (listing address or custom address)
- Received date
- Role badge
- Actions (view, delete, assign to listing)

---

## File Handling

### File Upload Process

1. **Client-Side Upload**: Files uploaded to Supabase Storage before form submission
2. **Temporary ID**: Uses `crypto.randomUUID()` to generate temporary lead ID for file paths
3. **Upload Location**: Files uploaded to `lead-attachments` bucket
4. **URL Storage**: File URLs stored in database, not File objects
5. **Path Structure**: Organized by lead ID and question ID

### File Types Supported

- **Accepted Formats**: PDF, DOC, DOCX, JPG, JPEG, PNG
- **Size Limits**: 
  - Message attachments: Configurable (typically 10MB per file)
  - Multiple files: 10MB total
  - Max 5 files per upload field

### File Storage Paths

```
lead-attachments/
  {leadId}/
    message-attachments/
      {filename}
    custom-files/
      {questionId}/
        {filename}
```

### File Display

- Files displayed as clickable links with file icons
- Opens in new tab/window
- File names extracted from URL or stored separately

---

## Form Builder Features

### Question Management

**Add Questions**:
- Click "Add Question" button
- Select question type from modal
- Configure question setup (if applicable)
- Question inserted after selected position

**Edit Questions**:
- Click question card to edit
- Modify label, placeholder, description
- Change required status (for non-required question types)
- Update setup configuration

**Delete Questions**:
- Click delete button on question card
- Confirmation dialog appears
- Cannot delete required questions (listingInterest, name, email, tel, submitButton)

**Reorder Questions**:
- Drag and drop questions
- Move up/down buttons
- Restrictions: listingInterest must stay first, submitButton must stay last

### Page Management

**Create Page Breaks**:
- Insert page break after any question
- Questions after break move to new page
- Minimum 1 question per page

**Delete Page Breaks**:
- Remove page break
- Questions merge with previous page

**Move Page Breaks**:
- Move break up or down
- Must maintain minimum 1 question per page

### Default Questions

When form is created or reset, default questions are:
1. `listingInterest` (required) - Order 1
2. `submitterRole` (optional) - Order 2
3. `name` (required) - Order 3
4. `email` (required) - Order 4
5. `tel` (required) - Order 5
6. `submitButton` (required) - Order 6

### Restrictions

- `listingInterest` must be first question (order 1)
- `submitButton` must be last question
- Cannot delete required questions
- Cannot move `listingInterest` from position 1
- Cannot move `submitButton` from last position

---

## Key Files Reference

### Core Components
- `src/components/leadForm/LeadFormPageContent.tsx`: Main form page
- `src/components/leadForm/LeadFormInteractiveView.tsx`: Interactive form component
- `src/components/leadForm/builder/LeadFormBuilderPageContent.tsx`: Form builder

### Data Management
- `src/app/actions/leadForm.ts`: Server actions for CRUD operations
- `src/lib/transformLeadData.ts`: Transform form data to database schema
- `src/lib/leadFormValidation.ts`: Validation schema builder

### Display & Formatting
- `src/components/lead/LeadDetailPage.tsx`: Lead detail view
- `src/lib/formatLeadData.tsx`: Formatting utilities for display
- `src/lib/parseCustomQuestionsData.ts`: Parse custom question data
- `src/lib/formatLeadFormData.ts`: Format form data fields

### Constants & Types
- `src/constants/leadFormQuestions.ts`: Question definitions and constants
- `src/types/lead.ts`: TypeScript types for leads
- `src/types/form.ts`: Question type definitions

### Shared Components
- `src/components/offerForm/QuestionRenderer.tsx`: Question input renderer (shared)
- `src/components/shared/FormPreview.tsx`: Form preview component (shared)

---

## Summary

The Lead Form is designed to be simpler and more accessible than the Offer Form, focusing on collecting initial interest and contact information from potential buyers. It supports:

- **Simple contact collection**: Name, email, phone
- **Interest tracking**: Interest levels, listing preferences
- **Flexible customization**: Custom questions with various input types
- **File attachments**: Optional file uploads for messages and custom questions
- **Multi-page forms**: Page breaks for better UX
- **Branding**: Customizable appearance

All collected data is stored in the `leads` table, with files stored in Supabase Storage, and can be viewed, filtered, and managed through the leads dashboard.

