# Special Conditions Question Schema Documentation

This document explains the comprehensive TypeScript schema for Special Conditions questions. The schema is designed to be self-documenting, type-safe, and easy to extend.

## Overview

The Special Conditions question schema is divided into three main parts:

1. **Setup Configuration** (`SpecialConditionsSetupConfig`) - What form builders configure
2. **Generated Questions** - What buyers/SUBMITTERS see (implicit in the UI rendering)
3. **Collected Data** (`SpecialConditionsCollectedData`) - What gets saved

## Structure

### 1. Setup Configuration (`SpecialConditionsSetupConfig`)

This represents the configuration that form builders set up when creating a Special Conditions question. It includes:

- **Allow Custom Conditions** (`allow_custom_conditions`):
  - `"yes"`: SUBMITTERS can add their own custom conditions via textarea
  - `"no"`: Only predefined conditions are available

- **Predefined Conditions** (`conditions`):
  - Array of up to 15 condition definitions
  - Each condition has:
    - `name`: Condition name/identifier (required)
    - `details`: Additional details or description (optional)
    - `attachments`: Setup attachments for reference (optional)
      - Uploaded by form builder
      - Stored in `"special-conditions"` storage bucket
      - Visible to SUBMITTERS as read-only reference documents
      - Max 10 files per condition, 50MB total per condition

### 2. Generated Questions

Based on the setup configuration, the following UI is generated:

#### Predefined Conditions

- **Checkboxes**: Each predefined condition appears as a checkbox
- **Setup Attachments**: If a condition has setup attachments, they are displayed below the condition name
  - Label: "Attachments (for review):"
  - Display: Clickable file links (read-only)
  - Visible: Always shown (in builder, preview, and final form)
  - Note: SUBMITTERS cannot upload files for predefined conditions

#### Custom Condition (if `allow_custom_conditions === "yes"`)

- **Textarea**: "Add Custom Condition" textarea
  - Placeholder: "Type your custom condition here..."
  - Editable by SUBMITTERS
  
- **File Upload**: File input below the textarea
  - Label: "Attachments"
  - Accepts: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT
  - Max files: 10
  - Max size: 50MB total
  - Files are uploaded to `"offer-documents"` bucket
  - Files are shown in offer pages/reports

### 3. Collected Data (`SpecialConditionsCollectedData`)

This represents the data collected from SUBMITTERS when they fill out the form:

```typescript
{
  // Selected predefined condition indices (e.g., [0, 2] means conditions 0 and 2 were selected)
  selectedConditions?: number[],
  
  // Custom condition text (if allow_custom_conditions === "yes" and SUBMITTER entered text)
  customCondition?: string,
  
  // Attachment URLs for predefined conditions
  // Note: This is legacy/not used in current implementation
  // SUBMITTERS cannot upload attachments for predefined conditions
  conditionAttachmentUrls?: Record<number, string[]>,
  
  // Attachment URLs for custom condition
  // Files uploaded by SUBMITTERS for their custom condition
  customConditionAttachmentUrls?: string[]
}
```

## Field Naming Conventions

### Setup Configuration Fields

- `allow_custom_conditions`: Whether custom conditions are allowed
- `conditions`: Array of condition definitions
  - `conditions[index].name`: Condition name
  - `conditions[index].details`: Condition details
  - `conditions[index].attachments`: Setup attachments array

### Collected Data Fields

- `selectedConditions`: Array of selected condition indices
- `customCondition`: Custom condition text
- `customConditionAttachmentUrls`: Array of uploaded file URLs for custom condition

### Storage Paths

**Setup Attachments** (form builder uploads):
- Bucket: `"special-conditions"`
- Path: `question-setup/{formId}/{questionId}/condition_{index}/{filename}`

**Custom Condition Attachments** (SUBMITTER uploads):
- Bucket: `"offer-documents"`
- Path: `{offerId}/custom-condition-attachments/{filename}`

## Data Flow

### 1. Setup Phase (Form Builder)

1. Form builder adds Special Conditions question
2. Configures:
   - Whether to allow custom conditions
   - Predefined conditions (up to 15)
   - Setup attachments for each condition (optional)
3. Setup attachments are uploaded to `"special-conditions"` bucket
4. Configuration saved in `question.setupConfig`

### 2. Preview/Final Form Phase (SUBMITTERS)

1. SUBMITTERS see:
   - Checkboxes for predefined conditions
   - Setup attachments as read-only reference documents (always visible)
   - Custom condition textarea (if enabled)
   - Custom condition file upload (if enabled)
2. SUBMITTERS can:
   - Select/deselect predefined conditions
   - View setup attachments (read-only)
   - Enter custom condition text
   - Upload files for custom condition
3. Data collected in form state

### 3. Submission Phase

1. Custom condition files are uploaded to `"offer-documents"` bucket
2. Data structure:
   - `selectedConditions`: Array of selected indices
   - `customCondition`: Custom condition text (if provided)
   - `customConditionAttachmentUrls`: Array of uploaded file URLs
3. Data saved to `offer.specialConditions`

### 4. Display Phase (Offer Pages/Reports)

1. Predefined conditions: Display selected condition names and details
2. Setup attachments: NOT shown in offer pages (they're reference docs only)
3. Custom condition: Display custom condition text
4. Custom condition attachments: Display as clickable links in offer pages/reports

## Validation Rules

### Setup Configuration

- Maximum 15 predefined conditions
- Each condition must have a `name`
- Setup attachments: Max 10 files per condition, 50MB total per condition

### Collected Data

- `selectedConditions`: Must be valid indices (0 to conditions.length - 1)
- `customCondition`: Optional, max length validation (if implemented)
- `customConditionAttachmentUrls`: Max 10 files, 50MB total

## UI/UX Features

### Setup Attachments (Reference Documents)

- **Purpose**: Reference documents for SUBMITTERS to review
- **Upload**: By form builder during setup
- **Visibility**: Always visible (builder, preview, final form)
- **Interaction**: Read-only (click to view/download)
- **Display**: Below condition name, labeled "Attachments (for review):"
- **Not shown in**: Offer pages/reports (they're setup references, not offer data)

### Custom Condition Attachments

- **Purpose**: Files SUBMITTERS upload for their custom condition
- **Upload**: By SUBMITTERS when filling out the form
- **Visibility**: Only shown when custom condition is enabled
- **Display in**: Offer pages and reports as clickable links

### Field Widths and Layout

- Labels: Standard width, above inputs
- Inputs: Full width (`w-full`)
- File uploads: Full width within their container
- Checkboxes: Standard checkbox size with label to the right

## Example Usage

### Example 1: Basic Setup with Predefined Conditions

```typescript
const setupConfig: SpecialConditionsSetupConfig = {
  allow_custom_conditions: "no",
  conditions: [
    {
      name: "Subject to Building Inspection",
      details: "Inspection must be completed within 14 days",
      attachments: [
        {
          url: "https://storage.../inspection-checklist.pdf",
          fileName: "inspection-checklist.pdf",
          fileSize: 245760
        }
      ]
    },
    {
      name: "Subject to Pest Inspection",
      details: "Must be completed before settlement"
    }
  ]
}

// SUBMITTERS see:
// - Checkbox: "Subject to Building Inspection" with setup attachment link
// - Checkbox: "Subject to Pest Inspection"
// - No custom condition option
```

### Example 2: With Custom Conditions Enabled

```typescript
const setupConfig: SpecialConditionsSetupConfig = {
  allow_custom_conditions: "yes",
  conditions: [
    {
      name: "Subject to Building Inspection",
      attachments: [
        {
          url: "https://storage.../guide.pdf",
          fileName: "inspection-guide.pdf",
          fileSize: 512000
        }
      ]
    }
  ]
}

// SUBMITTERS see:
// - Checkbox: "Subject to Building Inspection" with setup attachment link
// - Textarea: "Add Custom Condition"
// - File upload: "Attachments" (for custom condition)
```

### Example 3: Collected Data

```typescript
// When SUBMITTER fills out the form:
const collectedData: SpecialConditionsCollectedData = {
  selectedConditions: [0, 2], // Selected conditions at index 0 and 2
  customCondition: "Subject to seller completing repairs as per inspection report",
  customConditionAttachmentUrls: [
    "https://storage.../repair-list.pdf",
    "https://storage.../quote.pdf"
  ]
}
```

## Data Transformation

### From Form Data to Offer Data

1. `selectedConditions`: Stored as-is (array of numbers)
2. `customCondition`: Stored as-is (string)
3. `customConditionAttachments`: 
   - Files uploaded during submission
   - Converted to URLs
   - Stored as `customConditionAttachmentUrls`

### From Offer Data to Display

1. **Offer Pages**: 
   - Display selected condition names
   - Display custom condition text
   - Display custom condition attachments as links

2. **Reports**:
   - Format special conditions text
   - Include custom condition attachments

## Future Extensibility

To add new features, extend the schema:

```typescript
// Example: Add required/optional flags to conditions
export interface ConditionDefinition {
  name: string
  details?: string
  attachments?: SetupAttachment[]
  required?: boolean // New field
}

// Example: Add condition categories
export interface ConditionDefinition {
  name: string
  details?: string
  attachments?: SetupAttachment[]
  category?: string // New field
}
```

## Storage Configuration

### Buckets Required

1. **`special-conditions`**: For setup attachments
   - Uploaded by form builder
   - Read-only for SUBMITTERS
   - Path: `question-setup/{formId}/{questionId}/condition_{index}/{filename}`

2. **`offer-documents`**: For custom condition attachments
   - Uploaded by SUBMITTERS
   - Shown in offer pages
   - Path: `{offerId}/custom-condition-attachments/{filename}`

### Storage Policies

- Form builders need write access to `special-conditions` bucket
- SUBMITTERS need read access to `special-conditions` bucket (to view setup attachments)
- SUBMITTERS need write access to `offer-documents` bucket (to upload custom condition files)
- Public/authenticated users need read access to both buckets (to view in offer pages)

