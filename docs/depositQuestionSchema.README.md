# Deposit Question Schema Documentation

This document explains the comprehensive TypeScript schema for deposit questions. The schema is designed to be self-documenting, type-safe, and easy to extend.

## Overview

The deposit question schema is divided into three main parts:

1. **Setup Configuration** (`DepositSetupConfig`) - What sellers configure
2. **Generated Questions** (`DepositQuestion`) - What buyers see
3. **Collected Data** (`DepositCollectedData`) - What gets saved

## Structure

### 1. Setup Configuration (`DepositSetupConfig`)

This represents the configuration that sellers set up when creating a deposit question. It includes:

- **Instalment Configuration**: How many instalments (single, two_always, one_or_two, three_plus)
- **Deposit Amount Management**: How amounts are handled (buyer_enters, buyer_percentage, buyer_choice, fixed_amount, fixed_percentage)
- **Currency Stipulation**: How currency selection works (any, options, fixed)
- **Deposit Due Date Management**: How due dates are handled (immediately, calendar, datetime, buyer_text, seller_text, within_time, custom)
- **Deposit Holding**: How holding location is handled (buyer_input, stipulate, not_ascertain)

Each of these can be configured per-instalment for multi-instalment scenarios.

### 2. Generated Questions (`DepositQuestion`)

These are the questions that get generated based on the setup configuration and shown to buyers:

- **DepositTypeQuestion**: "What will your Deposit be?" (for buyer_choice scenarios)
- **DepositAmountQuestion**: "What is your Deposit Amount?"
- **DepositDueQuestion**: "When is your Deposit Due?"
- **DepositHoldingQuestion**: "Deposit to be held"
- **DepositInstalmentsQuestion**: "How many instalments will your Deposit be paid in?" (for one_or_two/three_plus)
- **DepositInstalmentHeader**: Display-only separator for instalments

### 3. Collected Data (`DepositCollectedData`)

This represents the data collected from buyers when they fill out the form. It includes:

- Instalment configuration
- Amount/percentage and currency for each instalment
- Due date information for each instalment
- Holding location for each instalment

## Usage Examples

### Example 1: Single Instalment with Fixed Amount

```typescript
const setupConfig: DepositSetupConfig = {
  instalments: "single",
  deposit_management: "fixed_amount",
  fixed_deposit_amount: 10000,
  fixed_deposit_currency: "USD",
  deposit_due: "immediately",
  deposit_holding: "buyer_input",
}

// This generates:
// - DepositAmountQuestion (display type): "10000 USD"
// - DepositDueQuestion (display type): "Immediately upon Offer Acceptance"
// - DepositHoldingQuestion (text type): "Enter where deposit will be held"
```

### Example 2: Two Instalments with Buyer Choice

```typescript
const setupConfig: DepositSetupConfig = {
  instalments: "two_always",
  deposit_management_instalment_1: "buyer_choice",
  currency_stipulation_instalment_1: "fixed",
  stipulated_currency_instalment_1: "GBP",
  deposit_due_instalment_1: "datetime",
  deposit_holding_instalment_1: "stipulate",
  deposit_holding_details_instalment_1: "Escrow with ABC Law Firm",

  deposit_management_instalment_2: "buyer_enters",
  currency_stipulation_instalment_2: "any",
  deposit_due_instalment_2: "calendar",
  deposit_holding_instalment_2: "buyer_input",
}

// This generates questions for both instalments with their respective configurations
```

### Example 3: One or Two Instalments (Buyer Chooses)

```typescript
const setupConfig: DepositSetupConfig = {
  instalments: "one_or_two",
  deposit_management: "buyer_enters",
  currency_stipulation: "options",
  currency_options_1: "USD",
  currency_options_2: "EUR",
  deposit_due: "within_time",
  deposit_holding: "buyer_input",
}

// This generates:
// - DepositInstalmentsQuestion: "How many instalments will your Deposit be paid in?" (options: 1, 2)
// - Additional questions are generated dynamically based on buyer's selection
```

## Type Guards

The schema includes helpful type guards:

```typescript
// Check if config is for multi-instalment
if (isMultiInstalmentConfig(setupConfig)) {
  // TypeScript knows instalments is "two_always" | "one_or_two" | "three_plus"
}

// Check if instalment selector is required
if (requiresInstalmentSelector(setupConfig)) {
  // TypeScript knows instalments is "one_or_two" | "three_plus"
}

// Check if deposit management allows buyer choice
if (allowsBuyerChoice(setupConfig.deposit_management)) {
  // TypeScript knows deposit_management is "buyer_choice"
}

// Check if deposit is fixed
if (isFixedDeposit(setupConfig.deposit_management)) {
  // TypeScript knows deposit_management is "fixed_amount" | "fixed_percentage"
}

// Check if deposit holding is configured
if (isDepositHoldingConfigured(setupConfig.deposit_holding)) {
  // TypeScript knows deposit_holding is "buyer_input" | "stipulate"
}
```

## Field Naming Conventions

### Setup Configuration Fields

- Base fields (for single instalment): `deposit_management`, `deposit_due`, etc.
- Instalment-specific fields: `deposit_management_instalment_1`, `deposit_due_instalment_2`, etc.
- Currency fields: `currency_stipulation`, `currency_options_1`, `stipulated_currency`
- Fixed amount fields: `fixed_deposit_amount`, `fixed_deposit_currency`
- Fixed percentage fields: `fixed_deposit_percentage`

### Generated Question IDs

- Single instalment: `deposit_amount`, `deposit_due`, `deposit_holding`
- Instalment-specific: `deposit_amount_instalment_1`, `deposit_due_instalment_2`, etc.
- Alternative format: `deposit_amount_1`, `deposit_due_2`, etc.
- Deposit type: `deposit_type`, `deposit_type_instalment_1`, etc.
- Instalment selector: `deposit_instalments`
- Instalment headers: `instalment_1_header`, `instalment_2_header`, etc.

### Collected Data Fields

- Structured format: `instalment_1`, `instalment_2`, `instalment_3`
- Legacy format: `deposit_amount_1`, `deposit_due_instalment_2`, etc.

## Extending the Schema

To add new features:

1. **Add new enum/literal types** at the top of the file
2. **Extend `DepositSetupConfig`** with new configuration fields
3. **Create new question types** extending `DepositQuestionBase`
4. **Add to `DepositQuestion` union type**
5. **Update `DepositCollectedData`** if new data needs to be collected
6. **Add type guards** if needed for new variants

## Migration Guide

When updating the schema:

1. **Backward Compatibility**: The schema includes legacy field names for backward compatibility
2. **Type Safety**: Use type guards to safely access instalment-specific fields
3. **Validation**: Always validate setup configs before generating questions
4. **Testing**: Test all instalment configurations and management types

## Related Files

- `src/data/smartQuestions.ts` - Question generation logic
- `src/components/offerForm/DepositPreview.tsx` - Question rendering
- `src/types/offerData.ts` - Data collection types
- `src/lib/depositDataHelpers.ts` - Data normalization utilities
