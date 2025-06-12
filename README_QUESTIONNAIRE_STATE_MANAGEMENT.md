# Questionnaire State Management Tool

This document describes the new questionnaire state management system that provides four different input methods for collecting practice information.

## Overview

The questionnaire state management tool allows users to input practice information through four different modes:

1. **Scrape** - Extract content from existing websites
2. **Questionnaire Form** - Fill out a structured questionnaire
3. **Template Questionnaire Markdown** - Paste markdown template content
4. **Content Document** - Paste content document markdown

## ✨ NEW: Comprehensive Markdown Data Source Integration

When users select **Template Questionnaire Markdown** or **Content Document** modes, the system now:
- Uses the markdown content as the **primary data source** across ALL components
- **Sitemap component**: Automatically converts markdown to structured format with visual indicators
- **Generate Content**: Uses markdown data for content generation with visual feedback
- **Generate Global**: Uses markdown data for global content generation with visual feedback
- **SitemapContentExport**: Uses markdown data when exporting content (when enabled)
- Maintains all existing functionality while seamlessly handling markdown data sources

## Components with Markdown Integration

### QuestionnaireManager ✅
- Automatically sets `formData` to markdown content when in markdown modes
- Real-time sync between markdown input and form data
- Visual feedback about data source usage

### Sitemap ✅
- Detects markdown data source and shows visual indicators
- Converts markdown to structured format for backend compatibility
- Shows "📝 Using Markdown Data Source" banner

### GenerateContentProgress ✅ **NEW**
- Uses `getEffectiveQuestionnaireData()` to handle both structured and markdown data
- Shows markdown data source indicator when active
- Passes proper data format to both generate-content and generate-global services
- Maintains full functionality with markdown content

### SitemapContentExport ✅ **NEW**
- Updated to use effective questionnaire data
- Shows markdown data source indicator
- Exports content using proper data format regardless of source

## State Management

### useQuestionnaireState Hook
A custom React hook that manages the questionnaire state across all modes.

**Location**: `src/hooks/useQuestionnaireState.ts`

**Returns**: `[state, actions]`
- `state`: Current questionnaire state
- `actions`: Object with methods to update state

**State Structure**:
```typescript
interface QuestionnaireState {
  activeMode: QuestionnaireMode;
  dataSource: QuestionnaireDataSource; // 'structured' | 'markdown'
  data: {
    scrape?: {
      domain: string;
      scraped_data?: Record<string, unknown>;
    };
    questionnaire?: Record<string, unknown>;
    templateMarkdown?: string;
    contentDocument?: string;
  };
}
```

## Utility Functions

### questionnaireDataUtils.ts ✅ **UPDATED**
**Location**: `src/utils/questionnaireDataUtils.ts`

**Key Functions**:
- `isMarkdownData(data)`: Type guard to check if data is markdown-based
- `convertMarkdownToQuestionnaireData(markdown)`: Convert markdown to structured data format
- `getEffectiveQuestionnaireData(data)`: **Core function** - Returns usable questionnaire data regardless of source
- `extractMarkdownContent(data)`: Extract markdown content from any data format
- `createMarkdownFormData(content, type)`: Create properly formatted markdown form data

**Type Safety Improvements**:
- Replaced `any` types with `unknown` for better type safety
- Added proper type guards and assertions
- Enhanced error handling and null checks

## Integration Architecture

### Data Flow for Generate Content/Global
1. User selects markdown mode and inputs content
2. `QuestionnaireManager` updates form data with markdown metadata
3. Data flows to `GenerateContentProgress` component
4. Component uses `getEffectiveQuestionnaireData()` to convert markdown to structured format
5. Structured data is sent to backend services
6. Visual indicators show when markdown is being used as data source

### Backend Compatibility
All components that interact with backend services now use `getEffectiveQuestionnaireData()` which:
- Detects if data is markdown-based using `isMarkdownData()` type guard
- Converts markdown content to proper `QuestionnaireData` structure
- Preserves all required fields with sensible defaults
- Maintains backward compatibility with existing structured data

## Visual Indicators

### Sitemap Component
```jsx
{isMarkdownData(questionnaireData) && (
  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <p className="text-sm text-blue-800">
      <strong>📝 Using Markdown Data Source:</strong> 
      The sitemap is using markdown content as the questionnaire data.
    </p>
  </div>
)}
```

### Generate Content Progress
```jsx
{isMarkdownData(questionnaireData) && (
  <div className="generate-content-progress__markdown-info">
    <p className="generate-content-progress__info-text">
      <strong>📝 Using Markdown Data Source:</strong> 
      Content generation will use the markdown content as questionnaire data.
    </p>
  </div>
)}
```

## CSS Styling

All markdown indicators use consistent styling:
- Light mode: Blue background (`#e0f2fe`) with blue text (`#01579b`)
- Dark mode: Dark blue background (`#1e3a8a`) with light blue text (`#bfdbfe`)
- Consistent padding, margins, and border radius
- Accessible color contrast ratios

## Usage Examples

### Using Markdown Data in Any Component

```tsx
import { getEffectiveQuestionnaireData, isMarkdownData } from './utils/questionnaireDataUtils';

const MyComponent = ({ questionnaireData }) => {
  // Always get usable data regardless of source
  const effectiveData = getEffectiveQuestionnaireData(questionnaireData);
  
  // Check if original data was markdown
  const isUsingMarkdown = isMarkdownData(questionnaireData);
  
  // Use effectiveData for backend calls, isUsingMarkdown for UI indicators
  return (
    <div>
      {isUsingMarkdown && <MarkdownIndicator />}
      <BackendComponent data={effectiveData} />
    </div>
  );
};
```

## Benefits of Complete Integration

1. **Seamless Experience**: Users can switch between data input methods without losing functionality
2. **Universal Compatibility**: All components work with both structured and markdown data
3. **Visual Feedback**: Clear indicators show which data source is active
4. **Type Safety**: Improved TypeScript types prevent runtime errors
5. **Backend Transparency**: Backend services receive properly formatted data regardless of input method
6. **Future-Proof**: Architecture supports easy addition of new data sources or components

## Testing the Integration

To test the markdown integration:

1. Start the development server: `npm start`
2. Open the questionnaire manager
3. Select "Template Questionnaire Markdown" mode
4. Paste markdown content
5. Navigate to different sections (Sitemap, Generate Content)
6. Verify that markdown indicators appear
7. Test generate content/global functionality
8. Confirm that backend receives properly formatted data

The system should seamlessly handle markdown content across all components while maintaining full backward compatibility with structured form data. 