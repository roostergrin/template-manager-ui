# AWS CodePipeline Deployment Guide

This guide explains how to set up CI/CD for this Vite React project using AWS CodePipeline, CodeBuild, and S3 with CloudFront.

## Prerequisites

- AWS Account with appropriate permissions
- GitHub repository
- S3 bucket configured for static website hosting
- CloudFront distribution pointing to the S3 bucket

## Files Added for CI/CD

### 1. `buildspec.yml`
AWS CodeBuild specification that:
- Installs dependencies with `npm ci`
- Runs linting with `npm run lint`
- Runs tests with `npm run test:run`
- Builds production bundle with `npm run build:prod`
- Outputs artifacts to `dist/` directory

### 2. Updated `vite.config.ts`
Enhanced with production optimizations:
- Proper base path configuration
- Disabled source maps for security
- Code splitting for better caching
- Asset optimization

### 3. `.github/workflows/ci.yml`
GitHub Actions workflow for continuous integration testing.

## AWS CodePipeline Setup

### Step 1: Create CodeBuild Project

1. Go to AWS CodeBuild console
2. Create a new build project:
   - **Project name**: `template-manager-ui-build`
   - **Source provider**: GitHub
   - **Repository**: Connect to your GitHub repo
   - **Environment**:
     - Environment image: Managed image
     - Operating system: Amazon Linux 2
     - Runtime: Standard
     - Image: `aws/codebuild/amazonlinux2-x86_64-standard:5.0`
     - Service role: Create new or use existing
   - **Buildspec**: Use a buildspec file (buildspec.yml)
   - **Artifacts**:
     - Type: Amazon S3
     - Bucket name: Your S3 bucket
     - Path: `builds/`
     - Artifacts packaging: Zip

### Step 2: Configure CodePipeline

1. Go to AWS CodePipeline console
2. Create or update your pipeline:

#### Source Stage
- **Source provider**: GitHub (Version 2)
- **Repository**: Your repository
- **Branch**: main
- **Change detection**: GitHub webhooks

#### Build Stage
- **Build provider**: AWS CodeBuild
- **Project name**: `template-manager-ui-build`
- **Input artifacts**: SourceArtifact
- **Output artifacts**: BuildArtifact

#### Deploy Stage
- **Deploy provider**: Amazon S3
- **Bucket**: Your S3 bucket
- **Input artifacts**: BuildArtifact
- **Extract file before deploy**: Yes

### Step 3: S3 Bucket Configuration

Ensure your S3 bucket has:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

**Static website hosting**:
- Index document: `index.html`
- Error document: `index.html` (for SPA routing)

### Step 4: CloudFront Configuration

For single-page application routing, configure custom error pages:

1. Go to CloudFront console
2. Edit your distribution
3. Go to Error Pages tab
4. Create custom error response:
   - HTTP Error Code: 403
   - Error Caching Minimum TTL: 0
   - Customize Error Response: Yes
   - Response Page Path: `/index.html`
   - HTTP Response Code: 200

5. Create another custom error response:
   - HTTP Error Code: 404
   - Error Caching Minimum TTL: 0
   - Customize Error Response: Yes
   - Response Page Path: `/index.html`
   - HTTP Response Code: 200

### Step 5: Cache Invalidation (Optional)

To automatically invalidate CloudFront cache, add to buildspec.yml post_build:

```yaml
post_build:
  commands:
    - echo Build completed on `date`
    - aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## Environment Variables

Add these to your CodeBuild environment if needed:
- `NODE_ENV=production`
- Any API endpoints or configuration variables

## Monitoring

- **CloudWatch Logs**: Monitor build logs in CodeBuild
- **Pipeline History**: Track deployments in CodePipeline
- **CloudFront Metrics**: Monitor CDN performance

## Troubleshooting

### Common Issues

1. **Build fails at npm ci**
   - Check Node.js version in buildspec.yml
   - Verify package-lock.json is committed

2. **Tests fail in CI**
   - Ensure all test dependencies are in package.json
   - Check if tests require additional setup

3. **Build succeeds but site doesn't load**
   - Verify S3 bucket policy allows public read
   - Check CloudFront error page configuration
   - Ensure index.html is set as default document

4. **Assets not loading**
   - Check Vite base configuration
   - Verify CloudFront origin settings

### Debug Commands

```bash
# Test build locally
npm run build:prod

# Verify build output
ls -la dist/

# Test production build locally
npm run preview:prod
```

## Next Steps

1. Set up environment-specific deployments (staging/production)
2. Add automated testing stages
3. Configure monitoring and alerting
4. Set up feature branch deployments
5. Add security scanning to the pipeline