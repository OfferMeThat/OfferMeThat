# Question Type Schemas Documentation

This folder contains comprehensive documentation for each question type schema in the offer form system.

## Available Schemas

### [Deposit Question](./deposit.md)

Comprehensive schema for deposit questions, covering:

- Setup configuration (instalments, amount management, currency, due dates, holding)
- Generated questions structure
- Collected data variants
- All instalment scenarios (single, two_always, one_or_two, three_plus)

**Schema Location**: `src/types/questions/deposit.ts`

### [Name of Purchaser Question](./nameOfPurchaser.md)

Comprehensive schema for name of purchaser questions, covering:

- Setup configuration (collection method, middle names, identification)
- Collected data variants (single field vs individual names)
- All scenarios (single person, multiple people, corporation, other)
- Field-level optionality/mandatory handling

**Schema Location**: `src/types/questions/nameOfPurchaser.ts`

### [Subject to Loan Approval Question](./subjectToLoanApproval.md)

Comprehensive schema for subject to loan approval questions, covering:

- Setup configuration (loan amount, lender details, attachments, due dates, evidence of funds)
- Collected data variants (subject to loan vs not subject to loan)
- Field-level optionality/mandatory handling
- Conditional field display based on main question answer

**Schema Location**: `src/types/questions/subjectToLoanApproval.ts`

## Schema Structure

Each question type schema follows a consistent structure:

1. **Setup Configuration** - What form builders configure
2. **Generated Questions** - What buyers see (implicit in UI rendering)
3. **Collected Data** - What gets saved when the form is submitted

## Benefits

These schemas provide:

- **Type Safety**: Full TypeScript support for all variants
- **Documentation**: Self-documenting code with clear comments
- **Consistency**: Ensures consistent structure across setup, rendering, and data collection
- **Maintainability**: Easy to understand and extend
- **Validation**: Type guards and helper functions for runtime checks

## Usage

Import schemas from `src/types/questions/`:

```typescript
import type {
  DepositSetupConfig,
  DepositCollectedData,
  DepositQuestion,
} from "@/types/questions/deposit"

import type {
  NameOfPurchaserSetupConfig,
  NameOfPurchaserCollectedData,
  IndividualNamesPurchaserDataVariant,
} from "@/types/questions/nameOfPurchaser"

import type {
  SubjectToLoanApprovalSetupConfig,
  SubjectToLoanApprovalCollectedData,
  SubjectToLoanData,
} from "@/types/questions/subjectToLoanApproval"
```

## Adding New Question Schemas

When creating a new question type schema:

1. Create the schema file in `src/types/questions/[questionName].ts`
2. Follow the same structure:
   - Setup configuration types
   - Generated question types (if applicable)
   - Collected data types
   - Type guards and helper functions
3. Create documentation in `docs/questions/[questionName].md`
4. Update this README to include the new schema
5. Re-export types in `src/types/offerData.ts` or `src/types/questionConfig.ts` as needed
