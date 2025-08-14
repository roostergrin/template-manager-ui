# Environment Setup Instructions

## Automatic Environment Switching

The application now automatically switches between environments based on build mode:

- **Development mode** (`npm run dev`): Uses `localhost:8000` backend
- **Production mode** (`npm run build`): Uses AWS Lightsail production backend

## Environment File Setup

Create these files in your project root for automatic environment switching:

### .env.development
```bash
# Development Environment Configuration
# Used when running `npm run dev` or building with development mode
VITE_API_BASE_URL=http://localhost:8000/
VITE_INTERNAL_API_KEY=your_dev_api_key_here
```

### .env.production
```bash
# Production Environment Configuration  
# Used when running `npm run build` or building with production mode
VITE_API_BASE_URL=https://automation-tools.wjj7y49t8p9c2.us-west-2.cs.amazonlightsail.com/
VITE_INTERNAL_API_KEY=your_prod_api_key_here
```

### .env.local (optional - for testing overrides)
```bash
# Local Environment Variables (gitignored)
# Use this to override environment settings for testing

# To test production backend while in development:
VITE_API_BASE_URL=https://automation-tools.wjj7y49t8p9c2.us-west-2.cs.amazonlightsail.com/
VITE_INTERNAL_API_KEY=your_api_key_here

# You can also use VITE_INTERNAL_API_TOKEN instead
# VITE_INTERNAL_API_TOKEN=your_api_token_here
```

## npm Scripts

The available scripts work with the automatic environment system:

- `npm run dev` - Development mode → uses localhost backend (if .env.development exists)
- `npm run build` - Production build → uses AWS Lightsail backend (if .env.production exists)  
- `npm run dev:prod` - Development mode but with production environment variables
- `npm run build:dev` - Build with development environment variables
- `npm run preview` - Preview the built application

## How Automatic Environment Switching Works

1. **Development mode** (`npm run dev`):
   - Reads `.env.development`
   - Falls back to `localhost:8000` if file doesn't exist

2. **Production mode** (`npm run build`):
   - Reads `.env.production` 
   - Falls back to default if file doesn't exist

3. **Local overrides** (`.env.local`):
   - Always takes priority over other environment files
   - Useful for testing production backend while developing

## Testing the Production Backend

### Method 1: Create .env.local (Recommended for Development Testing)
1. Create `.env.local` with production URL (see example above)
2. Restart your development server
3. Your dev environment will now use the production backend

### Method 2: Environment Switcher (Manual Override)
1. Click "🔧 Environment Settings" button  
2. Switch to "Production" environment
3. Click "Test Connection"
4. This overrides the automatic detection temporarily

### Method 3: Command Line
```bash
npm run dev:prod
```

## API Key Configuration

Make sure to set your API key for the backend in either:
- `VITE_INTERNAL_API_KEY` environment variable
- The environment switcher will inherit the current API key from localStorage

## Troubleshooting

### Connection Issues
- Check that the backend URL is accessible
- Verify your API key is correct
- Check browser console for CORS errors
- Ensure the backend server is running

### Environment Not Loading
- Restart the development server after changing .env files
- Clear localStorage if switching between environments manually
- Check the browser console for environment loading messages

### CORS Issues
If you get CORS errors, the backend needs to allow requests from your frontend origin:
- Development: `http://localhost:5173` (default Vite port)
- Production: Your deployed frontend URL

## API Configuration Priority

The API client uses this priority order for determining the base URL:
1. Constructor config parameter (highest)
2. localStorage override (from Environment Switcher)
3. Environment variables (`VITE_API_BASE_URL`)
4. Default fallback (`http://localhost:8000/`)

This allows the Environment Switcher to dynamically override the configuration without restarting the application.
