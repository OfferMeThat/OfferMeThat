# Subject to Loan Approval Question Schema Documentation

This document explains the comprehensive TypeScript schema for the "Subject to Loan Approval" question. The schema is designed to be self-documenting, type-safe, and easy to extend.

## Overview

The Subject to Loan Approval question schema is divided into three main parts:

1. **Setup Configuration** (`SubjectToLoanApprovalSetupConfig`) - What form builders configure
2. **Generated Questions** - What buyers see (implicit in the UI rendering)
3. **Collected Data** (`SubjectToLoanApprovalCollectedData`) - What gets saved

## Structure

### 1. Setup Configuration (`SubjectToLoanApprovalSetupConfig`)

This represents the configuration that form builders set up when creating a Subject to Loan Approval question. It includes:

- **Loan Amount Type** (`loan_amount_type`):
  - `"fixed_amount"`: Buyer must enter a fixed amount
  - `"percentage"`: Buyer must enter a percentage of purchase price
  - `"amount_or_percentage"`: Buyer can choose between amount or percentage
  - `"no_amount"`: Don't collect loan amount

- **Lender Details** (`lender_details`):
  - `"required"`: Lender details must be provided
  - `"optional"`: Lender details are optional, buyer can say "I don't know yet"
  - `"not_required"`: Don't collect lender details

- **Attachments** (`attachments`):
  - `"required"`: 1 or more attachments are required
  - `"optional"`: Attachments are optional
  - `"not_required"`: Don't ask for attachments

- **Loan Approval Due Date** (`loan_approval_due`):
  - `"no_due_date"`: Buyers don't need to provide a Due Date
  - `"calendar"`: Buyer selects Due Date using calendar selector
  - `"datetime"`: Buyer sets deadline time and date
  - `"buyer_text"`: Buyer provides due date by writing text field
  - `"seller_text"`: Seller sets due date by writing text field (buyers must agree)
  - `"within_time"`: Within X days of Offer Acceptance
  - `"custom"`: Something Else (Create your Own)

- **Finance Approval Due Date** (`finance_approval_due_date`):
  - Text field (only when `loan_approval_due === "seller_text"`)
  - Example: "Within 30 business days of Offer Acceptance"

- **Finance Communications** (`finance_communications`):
  - `"referral_partner"`: Send leads to Finance Referral Partner
  - `"self_manage"`: Send leads to seller, seller manages them
  - `"no_thanks"`: Don't send finance communications

- **Lead Recipient Email** (`lead_recipient_email`):
  - Email address (only when `finance_communications === "referral_partner"`)

- **Evidence of Funds** (`evidence_of_funds`):
  - `"required"`: An attachment must be provided (when NOT subject to loan)
  - `"optional"`: Attachment is optional (when NOT subject to loan)
  - `"not_required"`: Don't ask for evidence of funds

### 2. Collected Data Variants

The data structure depends on the `subjectToLoan` value:

#### When Subject to Loan (`subjectToLoan === "yes"`)

```typescript
{
  subjectToLoan: "yes",
  loanData: {
    // Loan amount type selection (only if loan_amount_type === "amount_or_percentage")
    loanAmountType?: "amount" | "percentage",
    
    // Loan amount (when loanAmountType === "amount" or loan_amount_type === "fixed_amount")
    loanAmount?: number | string,
    
    // Loan percentage (when loanAmountType === "percentage" or loan_amount_type === "percentage")
    loanPercentage?: number | string,
    
    // Lender details (only if lender_details !== "not_required")
    lenderDetails?: {
      companyName?: string,
      unknownLender?: boolean,  // If true, buyer doesn't know lender details yet
      contactName?: string,     // Only if unknownLender is false
      contactPhone?: string,   // Only if unknownLender is false
      contactEmail?: string    // Only if unknownLender is false
    },
    
    // Supporting documents (only if attachments !== "not_required")
    supportingDocs?: File[] | string[],
    
    // Loan approval due date (only if loan_approval_due !== "no_due_date")
    loanApprovalDue?: {
      loanDueDate?: string,           // For buyer_text, seller_text, custom
      loanDueDateTime?: string | Date, // For calendar, datetime
      loanDueText?: string,           // For seller_text
      loanDueWithin?: {               // For within_time
        number: number,
        unit: "business_days" | "days"
      }
    },
    
    // Finance specialist communication (only if finance_communications is set)
    financeSpecialist?: "yes" | "no"
  }
}
```

#### When NOT Subject to Loan (`subjectToLoan === "no"`)

```typescript
{
  subjectToLoan: "no",
  evidenceData: {
    // Evidence of funds (only if evidence_of_funds !== "not_required")
    evidenceOfFunds?: File[] | string[]
  }
}
```

## Field-Level Optionality/Mandatory

The Subject to Loan Approval question supports field-level required/optional settings:

- **Question-level required**: The entire question can be marked as required or optional
- **Field-level required**: Individual fields can be independently marked as required or optional via `uiConfig.subQuestions`:
  - `lenderDetails` - Controls lender details fields (company name, contact info)
  - `loan_attachments` - Controls supporting documents/attachments
  - `evidence_of_funds_attachment` - Controls evidence of funds attachment

### Rules:

1. If the question is **Mandatory** and a field (e.g., "Lender Details") is set to **Optional** (field-level), only that field becomes optional, not the entire question.

2. If the question is **Optional** and a field is set to **Mandatory** (field-level), the entire question becomes mandatory, and that specific field becomes required.

3. If "Evidence of Funds" is **Optional** (field-level), the initial question ("Is your Offer Subject to Loan Approval?") can still be **Mandatory**, but the field should remain Optional.

4. If "Evidence of Funds" is **Mandatory** (field-level), it should enforce that the initial question ("Is your Offer Subject to Loan Approval?") is also Mandatory.

## Validation Rules

### Main Question

- `subjectToLoan` must be "yes" or "no"
- If question is required: `subjectToLoan` must be provided

### When Subject to Loan (`subjectToLoan === "yes"`)

- **Loan Amount**:
  - If `loan_amount_type !== "no_amount"`: Loan amount or percentage must be provided
  - If `loan_amount_type === "amount_or_percentage"`: `loanAmountType` must be selected first
  - If `loanAmountType === "amount"` or `loan_amount_type === "fixed_amount"`: `loanAmount` must be a valid number
  - If `loanAmountType === "percentage"` or `loan_amount_type === "percentage"`: `loanPercentage` must be a valid number

- **Lender Details** (if `lender_details !== "not_required"`):
  - If `lender_details === "required"` or field-level required: All fields must be provided (unless `unknownLender` is true)
  - If `unknownLender` is true: No lender detail fields are required
  - If `unknownLender` is false: `companyName`, `contactName`, `contactPhone`, `contactEmail` must be provided (if required)

- **Supporting Documents** (if `attachments !== "not_required"`):
  - If `attachments === "required"` or field-level required: At least one file must be provided
  - Maximum 3 files, 10MB total per file

- **Loan Approval Due Date** (if `loan_approval_due !== "no_due_date"`):
  - Must be provided based on the due date type (calendar, datetime, text, etc.)

### When NOT Subject to Loan (`subjectToLoan === "no"`)

- **Evidence of Funds** (if `evidence_of_funds !== "not_required"`):
  - If `evidence_of_funds === "required"` or field-level required: At least one file must be provided
  - Maximum 3 files, 10MB total per file

## Type Guards

The schema includes helpful type guards:

```typescript
// Check if subject to loan
if (isSubjectToLoan(data)) {
  // TypeScript knows data.subjectToLoan === "yes" and loanData is present
  const loanAmount = data.loanData?.loanAmount
}

// Check if NOT subject to loan
if (isNotSubjectToLoan(data)) {
  // TypeScript knows data.subjectToLoan === "no" and evidenceData is present
  const evidence = data.evidenceData?.evidenceOfFunds
}

// Check if loan amount is required
if (isLoanAmountRequired(setupConfig)) {
  // TypeScript knows loan_amount_type !== "no_amount"
}

// Check if lender details are required
if (isLenderDetailsRequired(setupConfig, questionRequired, fieldLevelRequired)) {
  // Returns true if lender details should be required
}

// Check if attachments are required
if (isAttachmentsRequired(setupConfig, questionRequired, fieldLevelRequired)) {
  // Returns true if attachments should be required
}

// Check if evidence of funds is required
if (isEvidenceOfFundsRequired(setupConfig, questionRequired, fieldLevelRequired)) {
  // Returns true if evidence of funds should be required
}

// Check if buyer can choose between amount and percentage
if (allowsLoanAmountChoice(setupConfig)) {
  // TypeScript knows loan_amount_type === "amount_or_percentage"
}

// Check if buyer can say "I don't know yet" for lender details
if (allowsUnknownLender(setupConfig)) {
  // TypeScript knows lender_details === "optional"
}
```

## Helper Functions

### `isLenderDetailsComplete(lenderDetails, setupConfig): boolean`

Checks if lender details are complete based on the setup configuration:
- If `unknownLender` is true, returns true (user has indicated they don't know)
- If `lender_details === "required"`, all fields must be filled
- If `lender_details === "optional"`, at least company name should be provided

### `getLoanDataFieldName(fieldType): string`

Returns the data field name for a given field type. Used for consistent field naming in validation and data collection.

## Usage Examples

### Example 1: Basic Setup - No Loan Amount, Optional Lender Details

```typescript
const setupConfig: SubjectToLoanApprovalSetupConfig = {
  loan_amount_type: "no_amount",
  lender_details: "optional",
  attachments: "not_required",
  loan_approval_due: "no_due_date",
  evidence_of_funds: "not_required"
}

// Collected data when "yes":
{
  subjectToLoan: "yes",
  loanData: {
    lenderDetails: {
      companyName: "ABC Bank",
      unknownLender: false,
      contactName: "John Doe",
      contactPhone: "+1234567890",
      contactEmail: "john@abcbank.com"
    }
  }
}

// Collected data when "no":
{
  subjectToLoan: "no"
}
```

### Example 2: Full Setup - Amount or Percentage, Required Lender Details, Required Attachments

```typescript
const setupConfig: SubjectToLoanApprovalSetupConfig = {
  loan_amount_type: "amount_or_percentage",
  lender_details: "required",
  attachments: "required",
  loan_approval_due: "calendar",
  evidence_of_funds: "optional"
}

// Collected data when "yes":
{
  subjectToLoan: "yes",
  loanData: {
    loanAmountType: "amount",
    loanAmount: 500000,
    lenderDetails: {
      companyName: "XYZ Mortgage",
      unknownLender: false,
      contactName: "Jane Smith",
      contactPhone: "+1987654321",
      contactEmail: "jane@xyzmortgage.com"
    },
    supportingDocs: [File, File],  // At least 1 required
    loanApprovalDue: {
      loanDueDateTime: "2024-12-31T23:59:59"
    }
  }
}

// Collected data when "no":
{
  subjectToLoan: "no",
  evidenceData: {
    evidenceOfFunds: [File]  // Optional
  }
}
```

### Example 3: Optional Lender Details with "I Don't Know Yet"

```typescript
const setupConfig: SubjectToLoanApprovalSetupConfig = {
  loan_amount_type: "percentage",
  lender_details: "optional",
  attachments: "optional"
}

// Collected data when buyer doesn't know lender details:
{
  subjectToLoan: "yes",
  loanData: {
    loanPercentage: 80,
    lenderDetails: {
      unknownLender: true  // No other fields required
    },
    supportingDocs: [File]  // Optional
  }
}
```

### Example 4: Evidence of Funds Required

```typescript
const setupConfig: SubjectToLoanApprovalSetupConfig = {
  loan_amount_type: "no_amount",
  lender_details: "not_required",
  attachments: "not_required",
  evidence_of_funds: "required"
}

// Collected data when "no":
{
  subjectToLoan: "no",
  evidenceData: {
    evidenceOfFunds: [File, File]  // At least 1 required
  }
}
```

## Field Naming Conventions

### Setup Configuration Fields

- `loan_amount_type` - How loan amount is collected
- `lender_details` - Lender details requirement
- `attachments` - Attachments requirement
- `loan_approval_due` - Due date management type
- `finance_approval_due_date` - Seller-specified due date text
- `finance_communications` - Finance communications preference
- `lead_recipient_email` - Email for referral partner
- `evidence_of_funds` - Evidence of funds requirement

### Collected Data Fields

- `subjectToLoan` - Main question answer ("yes" | "no")
- `loanData` - Data when subjectToLoan === "yes"
  - `loanAmountType` - Selection when loan_amount_type === "amount_or_percentage"
  - `loanAmount` - Loan amount value
  - `loanPercentage` - Loan percentage value
  - `lenderDetails` - Lender information object
  - `supportingDocs` - Pre-approval documents
  - `loanApprovalDue` - Due date information
  - `financeSpecialist` - Finance specialist communication preference
- `evidenceData` - Data when subjectToLoan === "no"
  - `evidenceOfFunds` - Proof of funds documents

## Extending the Schema

To add new features:

1. **Add new setup options**: Extend the setup config types
2. **Add new data fields**: Extend `SubjectToLoanData` or `NotSubjectToLoanData`
3. **Add new type guards**: Create helper functions for new variants
4. **Update validation**: Add validation rules for new fields

## Migration Guide

When updating the schema:

1. **Backward Compatibility**: The schema includes legacy field names for backward compatibility
2. **Type Safety**: Use type guards to safely access conditional fields
3. **Validation**: Always validate setup configs before rendering questions
4. **Testing**: Test all setup configurations and data collection scenarios

## Related Files

- `src/types/questions/subjectToLoanApproval.ts` - Schema definition
- `src/data/smartQuestions.ts` - Question generation logic
- `src/components/offerForm/QuestionRenderer.tsx` - Question rendering
- `src/types/offerData.ts` - Data collection types (re-exports schema types)
- `src/lib/offerFormValidation.ts` - Yup validation schemas
- `src/components/offerForm/builder/SmartQuestionSetup.tsx` - Setup UI
- `src/types/questionUIConfig.ts` - UI configuration with field-level required support

