# GitHub File Updater Component

A React component for updating individual files in GitHub repositories through the `/update-github-repo-file` API endpoint.

## Features

- ✅ Update single files in any GitHub repository
- ✅ Support for both new file creation and existing file updates
- ✅ Real-time status tracking with loading states
- ✅ Comprehensive error handling and validation
- ✅ Responsive design with modern UI/UX
- ✅ Accessibility features (ARIA labels, keyboard navigation)
- ✅ Success feedback with links to GitHub
- ✅ Built-in help and tips

## Usage

### Basic Usage

```tsx
import GithubFileUpdater from '../components/GithubFileUpdater';

const MyComponent = () => {
  const handleUpdateComplete = (response) => {
    console.log('File updated successfully:', response);
  };

  return (
    <GithubFileUpdater onUpdateComplete={handleUpdateComplete} />
  );
};
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onUpdateComplete` | `(response: any) => void` | No | Callback function called when file update is successful |

## API Integration

This component integrates with the `/update-github-repo-file` endpoint and expects the following request/response format:

### Request Format
```typescript
{
  owner: string;        // GitHub repository owner
  repo: string;         // Repository name
  path: string;         // File path in repository
  content: string;      // File content (will be base64 encoded by API)
  message?: string;     // Commit message (optional)
  branch?: string;      // Target branch (defaults to 'main')
  sha?: string;         // Required for updating existing files
}
```

### Response Format
```typescript
{
  success: boolean;
  message?: string;
  commit?: {
    sha: string;
    url: string;
  };
  content?: {
    sha: string;
    download_url: string;
  };
}
```

## Form Fields

### Repository Information
- **GitHub Owner** (required): The owner/organization of the repository
- **Repository Name** (required): The name of the repository
- **Branch**: Target branch (defaults to 'main')
- **File SHA**: Required when updating existing files, leave empty for new files

### File Information
- **File Path** (required): Path to the file in the repository (e.g., `src/components/Header.tsx`)
- **Commit Message**: Custom commit message (auto-generates if empty)
- **File Content** (required): The content to write to the file

## States and Feedback

The component provides real-time feedback through different states:

- **Idle**: Initial state, ready for input
- **Pending**: File update in progress
- **Success**: File updated successfully with links to GitHub
- **Error**: Error occurred with detailed error message

## Styling

The component uses SASS with BEM methodology and includes:
- Responsive design for mobile and desktop
- Dark mode support
- Smooth animations and transitions
- Accessible color contrasts
- Modern card-based layout

## Accessibility

- Full keyboard navigation support
- ARIA labels and roles
- Screen reader compatible
- Focus management
- High contrast color schemes

## Error Handling

The component handles various error scenarios:
- Missing required fields
- Invalid repository information
- Network errors
- API errors
- File permission issues

## Tips for Users

1. **File SHA**: Required when updating existing files. You can get this from the GitHub API or leave empty for new files.
2. **File Path**: Use forward slashes (/) for directory separators, exactly as they appear in GitHub.
3. **Branch**: Defaults to 'main' if not specified.
4. **Commit Message**: Will auto-generate based on the file path if left empty.

## Demo

Access the component demo at: `http://localhost:5173/github-file-updater`

## Related Files

- **Types**: `src/types/APIServiceTypes.ts`
- **Service**: `src/services/updateGithubRepoFileService.ts`
- **Hook**: `src/hooks/useUpdateGithubRepoFile.ts`
- **Styles**: `src/components/GithubFileUpdater/GithubFileUpdater.sass`
- **Demo**: `src/pages/GithubFileUpdaterDemo.tsx`
