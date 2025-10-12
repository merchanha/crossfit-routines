# Quick Start: AI Testing

Get your AI infrastructure tested in 5 minutes!

## Step 1: Add API Keys (2 minutes)

Edit `backend/.env` and add:

```bash
# OpenAI (Required)
OPENAI_API_KEY=sk-proj-YOUR-KEY-HERE    # Get from: https://platform.openai.com
OPENAI_MODEL=gpt-3.5-turbo              # Cheaper for testing

# Gemini (Optional)
GEMINI_API_KEY=YOUR-KEY-HERE            # Get from: https://ai.google.dev

# AI Configuration
AI_PROVIDER=openai
AI_ENABLE_FALLBACK=true
AI_RATE_LIMIT_REQUESTS_PER_DAY=100      # High limit for testing
AI_ENABLE_CACHING=true
AI_CACHE_TTL=300                        # 5 minutes
```

## Step 2: Start Backend (1 minute)

```bash
cd backend
npm run start:dev
```

Wait for:
```
✅ OpenAI service initialized with model: gpt-3.5-turbo
✅ Gemini service initialized with model: gemini-pro
🤖 AI Provider Factory initialized
```

## Step 3: Get Auth Token (1 minute)

**Login** (if you have an account):
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpass"}'
```

**Or Register** (new account):
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"AI Tester","email":"aitest@test.com","password":"Test123"}'
```

**Copy the `accessToken`** from the response!

## Step 4: Run Tests (1 minute)

### Option A: Automated Test Script

```bash
# From project root
./test-ai.sh YOUR_TOKEN_HERE
```

This runs all tests automatically and shows results!

### Option B: Manual Tests

**Test 1: Check Providers**
```bash
curl http://localhost:3001/api/ai/test/providers/status
```
✅ Should show both providers as available

**Test 2: Simple AI Generation**
```bash
curl -X POST http://localhost:3001/api/ai/test/completion/simple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is CrossFit?"}'
```
✅ Should return AI-generated text

**Test 3: Structured Workout Generation**
```bash
curl -X POST http://localhost:3001/api/ai/test/completion/structured \
  -H "Authorization: Bearer YOUR_TOKEN"
```
✅ Should return a complete workout routine as JSON

**Test 4: Cache Test** (run twice)
```bash
curl -X POST http://localhost:3001/api/ai/test/cache/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- First call: Takes 2-4 seconds
- Second call: Instant (< 10ms) ⚡

## What Success Looks Like

```json
// Provider Status
{
  "providers": {
    "openai": { "available": true, "isPrimary": true },
    "gemini": { "available": true, "isPrimary": false }
  }
}

// Simple Completion
{
  "success": true,
  "response": {
    "content": "CrossFit is a high-intensity...",
    "provider": "openai",
    "tokensUsed": 45
  },
  "performance": { "durationMs": 1523 }
}

// Structured Output
{
  "success": true,
  "response": {
    "data": {
      "name": "Quick Burn Workout",
      "exercises": [
        { "name": "Push-ups", "sets": 3, "reps": 15 },
        { "name": "Squats", "sets": 3, "reps": 20 },
        { "name": "Plank", "sets": 3, "reps": 60 }
      ]
    },
    "provider": "openai"
  }
}
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "OpenAI client not initialized" | Check `OPENAI_API_KEY` in `.env` |
| "401 Unauthorized" | Token expired, login again |
| "Cannot GET /api/ai/test..." | Backend not running, check port 3001 |
| Slow responses (> 10s) | Network issues, try again |

## Cost Check

These tests cost less than **$0.01 total** with GPT-3.5 Turbo!

- Provider status: $0 (no AI call)
- Simple completion: ~$0.0002
- Structured output: ~$0.0006
- Cache test: ~$0.0003 (first call only)

## Next Steps

✅ **All tests pass?** Your AI infrastructure is ready!

Now you can:
1. Review detailed documentation in `AI_TESTING_GUIDE.md`
2. Test provider fallback (break OpenAI, see Gemini take over)
3. **Start Phase 2**: Build the Recommendations feature

## Quick Commands Reference

```bash
# Check provider status
curl http://localhost:3001/api/ai/test/providers/status

# Test AI generation
curl -X POST http://localhost:3001/api/ai/test/completion/simple \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Your prompt here"}'

# Check rate limit status
curl http://localhost:3001/api/ai/test/rate-limit/status \
  -H "Authorization: Bearer TOKEN"

# Reset rate limit (for testing)
curl -X POST http://localhost:3001/api/ai/test/rate-limit/reset \
  -H "Authorization: Bearer TOKEN"

# Clear cache
curl -X POST http://localhost:3001/api/ai/test/cache/clear \
  -H "Authorization: Bearer TOKEN"
```

## Done! 🎉

Your AI infrastructure is tested and ready for Phase 2!

