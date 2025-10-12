# AI Infrastructure Testing Guide

This guide will walk you through testing all components of the AI infrastructure.

## Prerequisites

1. ✅ Backend built successfully
2. ✅ Database migration run
3. ⏳ API keys configured (we'll do this now)

---

## Step 1: Get API Keys

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Name it "CrossFit Routines Dev"
5. Copy the key (starts with `sk-proj-...`)

### Google Gemini API Key (Optional but recommended)
1. Go to https://ai.google.dev
2. Click "Get API key"
3. Create a new project
4. Click "Create API key"
5. Copy the key

---

## Step 2: Configure Environment Variables

Add these to `backend/.env`:

```bash
# AI Provider Configuration
AI_PROVIDER=openai
AI_ENABLE_FALLBACK=true

# OpenAI (Primary Provider)
OPENAI_API_KEY=sk-proj-YOUR-KEY-HERE
OPENAI_MODEL=gpt-3.5-turbo          # Use cheaper model for testing

# Google Gemini (Fallback Provider)
GEMINI_API_KEY=YOUR-GEMINI-KEY-HERE  # Optional
GEMINI_MODEL=gemini-pro

# Rate Limiting (Relaxed for testing)
AI_RATE_LIMIT_REQUESTS_PER_DAY=100  # High limit for testing
AI_ENABLE_RATE_LIMITING=true

# Caching
AI_ENABLE_CACHING=true
AI_CACHE_TTL=300                     # 5 minutes for testing
AI_CACHE_MAX_ITEMS=100
```

---

## Step 3: Start the Backend

```bash
cd backend
npm run start:dev
```

Wait for the server to start. You should see:
```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [InstanceLoader] AIModule dependencies initialized
✅ OpenAI service initialized with model: gpt-3.5-turbo
✅ Gemini service initialized with model: gemini-pro
🤖 AI Provider Factory initialized - Primary: openai, Fallback: enabled
🚦 Rate limiter initialized - 100 requests/day, enabled: true
💾 AI Cache service initialized - enabled: true, TTL: 300s (0.08333333333333333h)
```

---

## Step 4: Get Authentication Token

You'll need a JWT token to test protected endpoints.

### Option A: Use existing user
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

### Option B: Register new user
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "aitest@example.com",
    "password": "Test123"
  }'
```

**Save the `accessToken` from the response!**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

---

## Step 5: Run Tests

### Test 1: Check Provider Status ✅

**No authentication required**

```bash
curl http://localhost:3001/api/ai/test/providers/status
```

**Expected Response:**
```json
{
  "message": "AI Provider Status",
  "providers": {
    "openai": {
      "available": true,
      "isPrimary": true
    },
    "gemini": {
      "available": true,
      "isPrimary": false
    }
  },
  "timestamp": "2025-10-06T..."
}
```

**✅ Success**: Both providers show `"available": true`
**❌ Failed**: If `"available": false`, check your API key in `.env`

---

### Test 2: Simple Text Completion ✅

**Tests basic AI text generation**

```bash
curl -X POST http://localhost:3001/api/ai/test/completion/simple \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "prompt": "Explain the benefits of burpees in 2 sentences"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "response": {
    "content": "Burpees are a full-body exercise that combines...",
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "tokensUsed": 45
  },
  "performance": {
    "durationMs": 1523
  },
  "timestamp": "2025-10-06T..."
}
```

**✅ Success**: You get AI-generated text about burpees
**⏱️ Performance**: Should take 1-3 seconds
**💰 Cost**: ~$0.0002 per request with GPT-3.5

---

### Test 3: Structured JSON Output ✅

**Tests AI generating JSON (key feature for workouts!)**

```bash
curl -X POST http://localhost:3001/api/ai/test/completion/structured \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "response": {
    "data": {
      "name": "Quick Burn Workout",
      "description": "A fast-paced 3-exercise routine...",
      "estimatedDuration": 15,
      "exercises": [
        {
          "name": "Push-ups",
          "sets": 3,
          "reps": 15,
          "notes": "Keep your core tight"
        },
        {
          "name": "Squats",
          "sets": 3,
          "reps": 20,
          "notes": "Go down to parallel"
        },
        {
          "name": "Plank",
          "sets": 3,
          "reps": 60,
          "notes": "Hold for 60 seconds"
        }
      ]
    },
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "tokensUsed": 156
  },
  "performance": {
    "durationMs": 2341
  }
}
```

**✅ Success**: You get a valid workout routine JSON
**🎯 Important**: This is the method we'll use for Recommendations & Generator!

---

### Test 4: Caching ⚡

**Tests that repeated requests are instant**

**First Request** (fresh generation):
```bash
curl -X POST http://localhost:3001/api/ai/test/cache/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "message": "Fresh response generated and cached",
  "cached": false,
  "response": {
    "content": "1. Improves cardiovascular endurance...",
    "provider": "openai",
    "tokensUsed": 67
  },
  "performance": {
    "durationMs": 1876
  },
  "tip": "Make the same request again within 5 minutes to see cache in action!"
}
```

**Second Request** (immediate):
```bash
# Run the SAME command again within 5 minutes
curl -X POST http://localhost:3001/api/ai/test/cache/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "message": "Response served from cache ⚡",
  "cached": true,
  "data": {
    "content": "1. Improves cardiovascular endurance...",
    "provider": "openai",
    "tokensUsed": 67
  },
  "tip": "This was instant! Make a different request to test fresh generation."
}
```

**✅ Success**: Second request is instant (< 10ms)
**💰 Savings**: No AI API call made on cached requests!

---

### Test 5: Rate Limiting 🚦

**Tests that users can't exceed daily quota**

**Check current status:**
```bash
curl http://localhost:3001/api/ai/test/rate-limit/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "currentStatus": {
    "allowed": true,
    "remaining": 100,
    "limit": 100,
    "resetAt": "2025-10-07T..."
  },
  "last7Days": {
    "totalRequests": 0,
    "totalTokens": 0,
    "byType": {},
    "byProvider": {},
    "successRate": 100
  }
}
```

**Make rate-limited requests:**
```bash
# Request 1
curl -X POST http://localhost:3001/api/ai/test/rate-limit/test \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Request 2
curl -X POST http://localhost:3001/api/ai/test/rate-limit/test \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Request 3
curl -X POST http://localhost:3001/api/ai/test/rate-limit/test \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Each should show:**
```json
{
  "message": "Rate limit test - this request was allowed",
  "rateLimit": {
    "allowed": true,
    "remaining": 99,  // Decreases with each request
    "limit": 100,
    "resetAt": "2025-10-07T..."
  }
}
```

**Note**: With `AI_RATE_LIMIT_REQUESTS_PER_DAY=100`, you can make 100 requests. Change it to `3` in `.env` to test the real limit.

**To test 429 error** (rate limit exceeded):
1. Change `.env`: `AI_RATE_LIMIT_REQUESTS_PER_DAY=3`
2. Restart backend
3. Make 4 requests
4. 4th request should return:
   ```json
   {
     "statusCode": 429,
     "message": "Rate limit exceeded. You have used 3/3 AI requests...",
     "error": "Too Many Requests"
   }
   ```

**Reset rate limit** (for testing):
```bash
curl -X POST http://localhost:3001/api/ai/test/rate-limit/reset \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Test 6: Automatic Fallback 🔄

**Tests that Gemini is used when OpenAI fails**

**Steps:**

1. **Temporarily break OpenAI:**
   ```bash
   # In backend/.env, change to invalid key
   OPENAI_API_KEY=sk-invalid-key-for-testing
   ```

2. **Restart backend**

3. **Make a request:**
   ```bash
   curl -X POST http://localhost:3001/api/ai/test/completion/simple \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -d '{"prompt": "What is CrossFit?"}'
   ```

4. **Expected Response:**
   ```json
   {
     "success": true,
     "response": {
       "content": "CrossFit is a high-intensity fitness program...",
       "provider": "gemini",  // ← Notice it used Gemini!
       "model": "gemini-pro",
       "tokensUsed": 52
     }
   }
   ```

5. **Check backend logs** - you should see:
   ```
   ⚠️  openai not available, attempting fallback...
   ✅ Using fallback provider: gemini
   ```

6. **Restore OpenAI key and restart**

**✅ Success**: Request succeeds even though OpenAI is broken
**🎯 Important**: This ensures high availability!

---

## Step 6: Monitor Performance

### Check Database

**AI Interactions logged:**
```sql
SELECT 
  "interactionType", 
  "aiProvider", 
  status, 
  "tokensUsed", 
  "responseTimeMs",
  COUNT(*) as count
FROM ai_interactions
WHERE "deletedAt" IS NULL
GROUP BY "interactionType", "aiProvider", status, "tokensUsed", "responseTimeMs"
ORDER BY count DESC;
```

**Rate limit tracking:**
```sql
SELECT 
  "userId", 
  COUNT(*) as requests,
  SUM("tokensUsed") as total_tokens,
  MAX("createdAt") as last_request
FROM ai_interactions
WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
  AND "deletedAt" IS NULL
GROUP BY "userId";
```

### Backend Logs

Watch for these key indicators:
- ✅ `OpenAI service initialized`
- ✅ `Gemini service initialized`
- ✅ `AI Provider Factory initialized`
- ✅ `Rate limiter initialized`
- ✅ `AI Cache service initialized`
- ⚠️  `Rate limit exceeded for user...`
- ⚡ `Cache HIT` vs `Cache MISS`

---

## Expected Results Summary

| Test | Expected Result | Time | Cost |
|------|----------------|------|------|
| Provider Status | Both available | <100ms | $0 |
| Simple Completion | AI text generated | 1-3s | ~$0.0002 |
| Structured Output | Valid JSON workout | 2-4s | ~$0.0006 |
| Cache (1st) | Fresh generation | 2-4s | ~$0.0003 |
| Cache (2nd) | Instant response | <10ms | $0 |
| Rate Limiting | Enforced correctly | <50ms | $0 |
| Fallback | Uses Gemini | 2-5s | $0 (free) |

**Total test cost**: ~$0.002 (less than a penny!)

---

## Troubleshooting

### ❌ "OpenAI client not initialized"
- **Cause**: Missing or invalid `OPENAI_API_KEY`
- **Fix**: Check `.env` file, ensure key starts with `sk-proj-`

### ❌ "All AI providers failed"
- **Cause**: Both OpenAI and Gemini are unavailable
- **Fix**: Check both API keys, verify internet connection

### ❌ "Cannot GET /api/ai/test/providers/status"
- **Cause**: Backend not running or wrong port
- **Fix**: Ensure backend is running on port 3001

### ❌ "401 Unauthorized"
- **Cause**: Missing or expired JWT token
- **Fix**: Re-login and get fresh token

### ⚠️ Slow responses (> 10 seconds)
- **Cause**: Network issues or API rate limits
- **Fix**: Check internet connection, try again

### ❌ "Rate limit exceeded" on first request
- **Cause**: Old test data in database
- **Fix**: Run `POST /ai/test/rate-limit/reset`

---

## Cost Monitoring

### Current Usage
```bash
curl http://localhost:3001/api/ai/test/rate-limit/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Check `last7Days.totalTokens` to see usage.

### Cost Calculation
- **GPT-3.5 Turbo**: $0.002 per 1K tokens
- **GPT-4 Turbo**: $0.02 per 1K tokens
- **Gemini Pro**: Free (60 req/min)

**Example**: 10,000 tokens with GPT-3.5 = $0.02

---

## Next Steps

Once all tests pass:

1. ✅ **Phase 1 Complete**: AI infrastructure is working
2. 🚀 **Ready for Phase 2**: Start building Recommendations feature
3. 📊 **Monitor costs**: Keep an eye on token usage

## Clean Up (Optional)

Remove test endpoints before production:
1. Delete `backend/src/ai/controllers/ai-test.controller.ts`
2. Remove controller from `ai.module.ts`
3. Or add authentication/admin guard to test endpoints

---

## Questions?

If any test fails, check:
1. Backend logs for error details
2. `.env` file for correct API keys
3. Database connection
4. JWT token validity

**Everything working? Congratulations! 🎉**

Your AI infrastructure is ready for Phase 2!

