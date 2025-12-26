# Name of Purchaser Question Schema Documentation

This document explains the comprehensive TypeScript schema for the "Name of Purchaser" question. The schema is designed to be self-documenting, type-safe, and easy to extend.

## Overview

The Name of Purchaser question schema is divided into three main parts:

1. **Setup Configuration** (`NameOfPurchaserSetupConfig`) - What form builders configure
2. **Generated Questions** - What buyers see (implicit in the UI rendering)
3. **Collected Data** (`NameOfPurchaserCollectedData`) - What gets saved

## Structure

### 1. Setup Configuration (`NameOfPurchaserSetupConfig`)

This represents the configuration that form builders set up when creating a Name of Purchaser question. It includes:

- **Collection Method** (`collection_method`):
  - `"single_field"`: Use one freeform text field to collect the name of the Purchaser(s)
  - `"individual_names"`: Ascertain the number of Purchasers, and collect each name individually

- **Collect Middle Names** (`collect_middle_names`): 
  - `"yes"`: Collect middle names (only applicable when `collection_method === "individual_names"`)
  - `"no"`: Don't collect middle names
  - Only shown when `collection_method === "individual_names"`

- **Collect Identification** (`collect_identification`):
  - `"mandatory"`: ID upload is required
  - `"optional"`: ID upload is optional
  - `"no"`: Don't collect ID
  - Applies to both collection methods

### 2. Collected Data Variants

The data structure depends on the `collection_method`:

#### Single Field Method (`collection_method === "single_field"`)

When using the single field method, the collected data can be:

**Option 1: Simple string**
```typescript
"John Doe"
```

**Option 2: Object with name and optional ID file**
```typescript
{
  name: "John Doe",
  idFile?: File | string  // Only if collect_identification !== "no"
}
```

#### Individual Names Method (`collection_method === "individual_names"`)

When using the individual names method, the collected data is always an object with a `scenario` field. There are four possible scenarios:

##### Scenario 1: Single Person (`scenario === "single"`)

1 Person is Buying

```typescript
{
  scenario: "single",
  nameFields: {
    "single": {
      firstName: "John",
      middleName?: "Michael",  // Only if collect_middle_names === "yes"
      lastName: "Doe",
      skipMiddleName?: boolean  // Only if collect_middle_names === "yes"
    }
  },
  idFiles?: {
    "single": File | string  // Only if collect_identification !== "no"
  }
}
```

##### Scenario 2: Multiple People (`scenario === "multiple"`)

2 or more People are Buying

```typescript
{
  scenario: "multiple",
  numPurchasers: 3,  // 2-10
  nameFields: {
    "purchaser-1": {
      firstName: "John",
      middleName?: "Michael",
      lastName: "Doe"
    },
    "purchaser-2": {
      firstName: "Jane",
      lastName: "Smith"
    },
    "purchaser-3": {
      firstName: "Bob",
      lastName: "Johnson"
    }
  },
  idFiles?: {
    "purchaser-1": File | string,
    "purchaser-2": File | string,
    "purchaser-3": File | string
  }
}
```

##### Scenario 3: Corporation (`scenario === "corporation"`)

A Corporation is Buying

```typescript
{
  scenario: "corporation",
  corporationName: "ABC Corporation Ltd",
  numRepresentatives: 2,  // 1+
  nameFields: {
    "rep-1": {
      firstName: "John",
      lastName: "Doe"
    },
    "rep-2": {
      firstName: "Jane",
      lastName: "Smith"
    }
  },
  idFiles?: {
    "rep-1": File | string,
    "rep-2": File | string
  }
}
```

##### Scenario 4: Other (`scenario === "other"`)

Mixed scenario with persons and/or corporations

```typescript
{
  scenario: "other",
  numPurchasers: 2,  // 1+
  purchaserTypes: {
    1: "person",
    2: "corporation"
  },
  // Corporation name for purchaser 2 (since it's a corporation)
  "corporationName_2": "XYZ Corp",
  nameFields: {
    // Person purchaser
    "other-person-1": {
      firstName: "John",
      lastName: "Doe"
    },
    // Corporation representative
    "other-corp-2-rep": {
      firstName: "Jane",
      lastName: "Smith"
    }
  },
  idFiles?: {
    "other-person-1": File | string,
    "other-corp-2-rep": File | string
  }
}
```

## Field Naming Conventions

### Name Field Prefixes

The `nameFields` object uses specific prefixes to identify different purchasers:

- **Single scenario**: `"single"`
- **Multiple scenario**: `"purchaser-1"`, `"purchaser-2"`, etc.
- **Corporation scenario**: `"rep-1"`, `"rep-2"`, etc. (representatives)
- **Other scenario - Person**: `"other-person-1"`, `"other-person-2"`, etc.
- **Other scenario - Corporation**: `"other-corp-1-rep"`, `"other-corp-2-rep"`, etc.

The `idFiles` object uses the same prefixes as `nameFields`.

### Person Name Data Structure

Each entry in `nameFields` follows this structure:

```typescript
{
  firstName: string      // Required when ID is mandatory or question is required
  middleName?: string    // Optional, only if collect_middle_names === "yes"
  lastName: string        // Required when ID is mandatory or question is required
  skipMiddleName?: boolean  // Only if collect_middle_names === "yes"
}
```

## Field-Level Optionality/Mandatory

The Name of Purchaser question supports field-level required/optional settings:

- **Question-level required**: The entire question can be marked as required or optional
- **Field-level required**: The "Purchaser Identification" (ID upload) field can be independently marked as required or optional via `uiConfig.subQuestions.idUploadLabel.required`

### Rules:

1. If the question is **Mandatory** and ID collection is set to **Optional** (field-level), only the ID field becomes optional, not the entire question.

2. If the question is **Optional** and ID collection is set to **Mandatory** (field-level), the entire question becomes mandatory, and all name fields (First Name, Last Name) become required.

3. When ID is mandatory (either via setup config or field-level), First Name and Last Name are required for all purchasers with names.

## Validation Rules

### Single Field Method

- If question is required: `name` must be provided
- Maximum length: 150 characters
- If ID is required and name is provided: `idFile` must be provided

### Individual Names Method

- If question is required OR ID is mandatory: At least one complete name (firstName + lastName) must be provided
- If ID is mandatory: All purchasers with names must have both firstName and lastName
- If ID is mandatory: All purchasers with complete names must have an ID file
- Scenario must be selected
- For "multiple" scenario: `numPurchasers` must be 2-10
- For "corporation" scenario: `corporationName` must be provided, `numRepresentatives` must be 1+
- For "other" scenario: `numPurchasers` must be 1+, `purchaserTypes` must be provided for each purchaser

## Type Guards

The schema includes helpful type guards:

```typescript
// Check if data is single field format
if (isSingleFieldPurchaserData(data, setupConfig)) {
  // TypeScript knows data is SingleFieldPurchaserData
}

// Check if data is individual names format
if (isIndividualNamesPurchaserData(data, setupConfig)) {
  // TypeScript knows data is IndividualNamesPurchaserDataVariant
}

// Check scenario type
if (isSinglePersonScenario(data)) {
  // TypeScript knows data is SinglePersonPurchaserData
}

if (isMultiplePeopleScenario(data)) {
  // TypeScript knows data is MultiplePeoplePurchaserData
}

if (isCorporationScenario(data)) {
  // TypeScript knows data is CorporationPurchaserData
}

if (isOtherScenario(data)) {
  // TypeScript knows data is OtherPurchaserData
}
```

## Helper Functions

### `getNameFieldPrefixes(data: IndividualNamesPurchaserData): string[]`

Returns all name field prefixes for a given scenario. Useful for iterating over all purchasers.

### `isIdRequired(setupConfig, questionRequired, fieldLevelRequired?): boolean`

Checks if ID collection is required, taking into account:
- Field-level required setting (highest priority)
- Setup config (`collect_identification === "mandatory"`)
- Question required status

### `shouldCollectMiddleNames(setupConfig): boolean`

Checks if middle names should be collected based on setup config.

### `isPersonNameComplete(nameData: PersonNameData): boolean`

Checks if a person's name data is complete (has firstName and lastName).

### `areAllNamesComplete(data, setupConfig): boolean`

Checks if all required name fields are filled for a scenario.

### `areAllIdFilesProvided(data, setupConfig, questionRequired, fieldLevelRequired?): boolean`

Checks if all required ID files are provided, taking into account field-level requirements.

## Usage Examples

### Example 1: Single Field with Optional ID

```typescript
const setupConfig: NameOfPurchaserSetupConfig = {
  collection_method: "single_field",
  collect_identification: "optional"
}

// Collected data can be:
"John Doe"
// or
{
  name: "John Doe",
  idFile: File  // Optional
}
```

### Example 2: Individual Names - Single Person with Mandatory ID

```typescript
const setupConfig: NameOfPurchaserSetupConfig = {
  collection_method: "individual_names",
  collect_middle_names: "yes",
  collect_identification: "mandatory"
}

// Collected data:
{
  scenario: "single",
  nameFields: {
    "single": {
      firstName: "John",
      middleName: "Michael",
      lastName: "Doe"
    }
  },
  idFiles: {
    "single": File  // Required
  }
}
```

### Example 3: Individual Names - Multiple People

```typescript
const setupConfig: NameOfPurchaserSetupConfig = {
  collection_method: "individual_names",
  collect_middle_names: "no",
  collect_identification: "no"
}

// Collected data:
{
  scenario: "multiple",
  numPurchasers: 2,
  nameFields: {
    "purchaser-1": {
      firstName: "John",
      lastName: "Doe"
    },
    "purchaser-2": {
      firstName: "Jane",
      lastName: "Smith"
    }
  }
  // No idFiles since collect_identification === "no"
}
```

### Example 4: Individual Names - Corporation

```typescript
const setupConfig: NameOfPurchaserSetupConfig = {
  collection_method: "individual_names",
  collect_identification: "mandatory"
}

// Collected data:
{
  scenario: "corporation",
  corporationName: "ABC Corporation Ltd",
  numRepresentatives: 2,
  nameFields: {
    "rep-1": {
      firstName: "John",
      lastName: "Doe"
    },
    "rep-2": {
      firstName: "Jane",
      lastName: "Smith"
    }
  },
  idFiles: {
    "rep-1": File,
    "rep-2": File
  }
}
```

### Example 5: Individual Names - Other (Mixed)

```typescript
const setupConfig: NameOfPurchaserSetupConfig = {
  collection_method: "individual_names",
  collect_identification: "optional"
}

// Collected data:
{
  scenario: "other",
  numPurchasers: 2,
  purchaserTypes: {
    1: "person",
    2: "corporation"
  },
  "corporationName_2": "XYZ Corp",
  nameFields: {
    "other-person-1": {
      firstName: "John",
      lastName: "Doe"
    },
    "other-corp-2-rep": {
      firstName: "Jane",
      lastName: "Smith"
    }
  },
  idFiles: {
    "other-person-1": File,  // Optional
    "other-corp-2-rep": File  // Optional
  }
}
```

## Extending the Schema

To add new features:

1. **Add new collection methods**: Extend `NameCollectionMethod` type and update `NameOfPurchaserSetupConfig`
2. **Add new scenarios**: Extend `PurchaserScenario` type and create new data variant interfaces
3. **Add new fields**: Extend `PersonNameData` or add new fields to scenario-specific data types
4. **Update type guards**: Add new type guard functions for new variants
5. **Update helper functions**: Extend helper functions to handle new variants

## Migration Guide

When updating the schema:

1. **Backward Compatibility**: The schema maintains compatibility with existing data structures
2. **Type Safety**: Use type guards to safely access scenario-specific fields
3. **Validation**: Always validate setup configs before rendering questions
4. **Testing**: Test all collection methods and scenarios

## Related Files

- `src/types/questions/nameOfPurchaser.ts` - Schema definition
- `src/data/smartQuestions.ts` - Question generation logic
- `src/components/offerForm/QuestionRenderer.tsx` - Question rendering (especially `PersonNameFields` component)
- `src/types/offerData.ts` - Data collection types (re-exports schema types)
- `src/lib/offerFormValidation.ts` - Yup validation schemas
- `src/components/offerForm/builder/SmartQuestionSetup.tsx` - Setup UI
- `src/types/questionUIConfig.ts` - UI configuration with field-level required support

