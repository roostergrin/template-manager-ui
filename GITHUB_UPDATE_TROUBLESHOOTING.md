# GitHub Update Endpoint Troubleshooting Guide

## 🎯 Summary

The `/update-github-repo-file` endpoint is **working correctly**. Issues are typically caused by repository access problems, not endpoint failures.

## 🔍 Diagnosis Results

✅ **Backend Server**: Running at `http://localhost:8000/`  
✅ **Endpoint**: `/update-github-repo-file` responding correctly  
✅ **Authentication**: API key working  
✅ **Request Format**: Proper transformation from frontend to backend  

## 🚨 Common Issues & Solutions

### 1. Repository Not Found (404 Error)
**Error Message**: `Repository owner/repo not found or not accessible`

**Causes**:
- Repository name or owner is incorrect
- Repository doesn't exist
- Repository is private and backend lacks access

**Solutions**:
- ✅ Verify repository exists on GitHub
- ✅ Check owner/repo names are exactly correct (case-sensitive)
- ✅ For private repos: ensure backend has GitHub token with proper permissions

### 2. Authentication Failure (401 Error)
**Error Message**: Authentication failed or similar

**Causes**:
- Backend missing GitHub API token
- Invalid or expired GitHub token
- Insufficient token permissions

**Solutions**:
- ✅ Set `GITHUB_TOKEN` environment variable on backend
- ✅ Ensure token has `repo` or `public_repo` scope
- ✅ Regenerate token if expired

### 3. Validation Errors (422 Error)
**Error Message**: Request validation failed

**Causes**:
- Missing required fields
- Invalid file path
- Invalid branch name

**Solutions**:
- ✅ Ensure all required fields are provided:
  ```javascript
  {
    owner: "your-username",
    repo: "your-repo",
    file_path: "path/to/file.txt",
    file_content: "file contents",
    message: "commit message",
    branch: "main" // optional, defaults to default branch
  }
  ```

### 4. File Already Exists (409 Error)
**Error Message**: File exists but no SHA provided

**Causes**:
- Trying to update existing file without providing `sha`

**Solutions**:
- ✅ For updates: include file's current `sha` in request
- ✅ For new files: omit `sha` field

## 🧪 Testing Your Setup

### Step 1: Test Backend Connection
```bash
curl -H "X-API-Key: your-api-key" http://localhost:8000/
```

### Step 2: Test with Real Repository
Edit and run `test-with-real-repo.js`:
```javascript
const testRequest = {
  owner: "your-github-username",     // ← Change this
  repo: "your-repository-name",      // ← Change this
  file_path: "test-file.txt",
  file_content: "Test content",
  message: "Test commit via API",
  branch: "main"
};
```

### Step 3: Monitor Backend Logs
Check backend logs for detailed error information:
```bash
# If using Docker
docker logs your-backend-container

# If running directly
tail -f backend.log
```

## 🔧 Frontend Code Analysis

The frontend service correctly transforms requests:
- ✅ `path` → `file_path` 
- ✅ `content` → `file_content`
- ✅ Proper error handling and logging
- ✅ Correct API client usage

## 📝 How to Use the Endpoint

### Frontend Hook Usage
```typescript
import useUpdateGithubRepoFile from '../hooks/useUpdateGithubRepoFile';

const [response, status, updateFile] = useUpdateGithubRepoFile();

// Update a file
const handleUpdate = async () => {
  try {
    const result = await updateFile({
      owner: 'roostergrin',
      repo: 'your-repo-name',
      path: 'data/config.json',
      content: JSON.stringify(config, null, 2),
      message: 'Update configuration',
      branch: 'main'
    });
    console.log('Update successful:', result);
  } catch (error) {
    console.error('Update failed:', error);
  }
};
```

### Direct Service Call
```typescript
import updateGithubRepoFileService from '../services/updateGithubRepoFileService';

const result = await updateGithubRepoFileService({
  owner: 'roostergrin',
  repo: 'your-repo-name',
  path: 'README.md',
  content: '# Updated README\n\nContent here...',
  message: 'Update README',
  branch: 'main'
});
```

## 🎯 Quick Fixes

### Most Common Fix
```javascript
// ❌ Wrong - using fake/non-existent repository
{
  owner: "test-owner",
  repo: "test-repo"
}

// ✅ Correct - using real repository you have access to
{
  owner: "roostergrin",
  repo: "actual-repo-name"
}
```

### Backend Environment Setup
```bash
# Add to backend .env file
GITHUB_TOKEN=ghp_your_actual_github_token_here
```

## 📞 Next Steps

1. **Verify Repository Details**: Ensure owner/repo names are correct
2. **Check Backend GitHub Token**: Verify backend has proper GitHub API access  
3. **Test with Real Repository**: Use the provided test script
4. **Monitor Backend Logs**: Check for detailed error messages
5. **Verify Permissions**: Ensure backend token has necessary repository permissions

## 🔗 Related Files

- **Service**: `src/services/updateGithubRepoFileService.ts`
- **Hook**: `src/hooks/useUpdateGithubRepoFile.ts`
- **Types**: `src/types/APIServiceTypes.ts`
- **Test Script**: `test-with-real-repo.js`

---

**Summary**: The endpoint works correctly. Most issues are repository access related, not code problems.
