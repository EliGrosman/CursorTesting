# ANTHROPIC_API_KEY Issue - Findings and Solutions

## Problem Description
The application shows "missing ANTHROPIC_API_KEY" error even when users believe they have added their API key.

## Root Cause Analysis

### 1. Missing `.env` File
The `.env` file in the `server/` directory didn't exist initially. The `start.sh` script creates it from `.env.example` but the user needs to manually update it with their actual API key.

### 2. Placeholder Value Detection
The `start.sh` script includes a check that prevents the application from starting if the API key is still the placeholder value:

```bash
# Check if API key is set
if grep -q "your_anthropic_api_key_here" server/.env; then
    echo "⚠️  Please update your Anthropic API key in server/.env"
    echo "Get your API key at: https://console.anthropic.com/"
    exit 1
fi
```

### 3. Environment Variable Loading
The application loads environment variables from `server/.env` in development mode:

```typescript
// In server/src/index.ts
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}
```

The Anthropic service then checks for the API key:

```typescript
// In server/src/services/anthropic.ts
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is required');
}
```

## Current State
- ✅ `.env` file has been created from `.env.example`
- ⚠️ API key is still set to placeholder value: `your_anthropic_api_key_here`
- ⚠️ Application will not start until real API key is provided

## Solutions

### Solution 1: Manual Edit (Recommended)
1. **Get your Anthropic API key** from https://console.anthropic.com/
2. **Edit the `.env` file** in the `server/` directory:
   ```bash
   # Open in your preferred editor
   nano server/.env
   # or
   code server/.env
   # or
   vim server/.env
   ```
3. **Replace the placeholder** with your actual API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
   ```
4. **Save the file** and restart the application

### Solution 2: Command Line Replacement
Run this command to replace the placeholder (substitute with your actual key):
```bash
sed -i 's/your_anthropic_api_key_here/sk-ant-your-actual-api-key-here/g' server/.env
```

### Solution 3: Environment Variable Override
Set the environment variable directly when starting the application:
```bash
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here npm run dev
```

### Solution 4: Export Environment Variable
Export the variable in your shell session:
```bash
export ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
npm run dev
```

## Verification Steps
1. **Check the `.env` file** to ensure it contains your actual API key:
   ```bash
   grep ANTHROPIC_API_KEY server/.env
   ```
2. **Run the start script** to verify it doesn't show the API key warning:
   ```bash
   ./start.sh
   ```
3. **Check the server logs** for successful API key loading when the application starts

## Prevention
To avoid this issue in the future:
1. Always check that `.env` files contain actual values, not placeholders
2. The `start.sh` script provides clear warnings when configuration is incomplete
3. Consider using environment variable management tools for production deployments

## Security Notes
- ⚠️ Never commit `.env` files with real API keys to version control
- ⚠️ The `.env` file is already included in `.gitignore` to prevent accidental commits
- ✅ Use environment variables or secure secret management in production

## Additional Configuration
The `.env` file also contains other important settings that may need to be configured:
- `JWT_SECRET` - Change from default in production
- `ENCRYPTION_KEY` - Change from default in production  
- `DATABASE_URL` - Configure your database connection
- `ALLOWED_ORIGINS` - Configure CORS for your deployment URLs