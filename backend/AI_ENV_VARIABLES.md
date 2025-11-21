# AI Features - Environment Variables

Add these variables to your `.env` file to enable AI features.

## Required Variables

```bash
# ============================================
# AI Provider Selection
# ============================================
AI_PROVIDER=openai                    # Primary provider: 'openai' | 'gemini'
AI_ENABLE_FALLBACK=true              # Enable automatic fallback

# ============================================
# OpenAI Configuration
# ============================================
OPENAI_API_KEY=sk-proj-your-key-here # Get from: https://platform.openai.com
OPENAI_MODEL=gpt-4-turbo-preview     # Options: gpt-4-turbo-preview | gpt-3.5-turbo

# ============================================
# Google Gemini Configuration (Fallback)
# ============================================
GEMINI_API_KEY=your-gemini-key-here  # Get from: https://ai.google.dev
GEMINI_MODEL=gemini-pro              # gemini-pro is recommended

# ============================================
# YouTube API (for video search in Generator)
# ============================================
YOUTUBE_API_KEY=your-youtube-key     # Get from: https://console.cloud.google.com

# ============================================
# Rate Limiting
# ============================================
AI_RATE_LIMIT_REQUESTS_PER_DAY=3    # Max requests per user per day
AI_ENABLE_RATE_LIMITING=true        # Enable rate limiting

# ============================================
# Caching
# ============================================
AI_ENABLE_CACHING=true              # Enable response caching
AI_CACHE_TTL=86400                  # Cache TTL in seconds (86400 = 24 hours)
AI_CACHE_MAX_ITEMS=100              # Max items in cache
```

## Development vs Production

### Development Settings (Cheaper, More Flexible)
```bash
AI_PROVIDER=openai
OPENAI_MODEL=gpt-3.5-turbo                # Cheaper model
AI_RATE_LIMIT_REQUESTS_PER_DAY=100        # Higher limit for testing
AI_ENABLE_RATE_LIMITING=false             # Disable for easier testing
AI_ENABLE_CACHING=true
```

### Production Settings (Better Quality, Cost Control)
```bash
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4-turbo-preview          # Better quality
AI_RATE_LIMIT_REQUESTS_PER_DAY=3          # Strict limit
AI_ENABLE_RATE_LIMITING=true              # Enforce limits
AI_ENABLE_CACHING=true                    # Save money
```

## How to Get API Keys

### OpenAI
1. Go to https://platform.openai.com
2. Sign up or log in
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-proj-...`)

### Google Gemini
1. Go to https://ai.google.dev
2. Click "Get API key"
3. Create a new project or select existing
4. Click "Create API key"
5. Copy the key

### YouTube Data API
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Navigate to "Credentials"
5. Click "Create Credentials" → "API Key"
6. Copy the key

## Cost Estimation

### OpenAI Pricing
- **GPT-4 Turbo**: $0.01/1K input + $0.03/1K output tokens
  - Typical request: ~$0.05
- **GPT-3.5 Turbo**: $0.001/1K input + $0.002/1K output tokens
  - Typical request: ~$0.004

### Gemini Pricing
- **Free tier**: 60 requests/minute
- **Paid**: Much cheaper than OpenAI

### Monthly Cost (100 active users, 3 requests/day)
- **GPT-4 Turbo** + caching: ~$20-50/month
- **GPT-3.5 Turbo** + caching: ~$5-10/month
- **Gemini Pro** (free tier): $0/month

## Troubleshooting

### Error: "OpenAI client not initialized"
- **Cause**: Missing or invalid `OPENAI_API_KEY`
- **Solution**: Double-check your API key in `.env`

### Error: "All AI providers failed"
- **Cause**: Both OpenAI and Gemini are unavailable
- **Solution**: Check your API keys and internet connection

### Error: "Rate limit exceeded"
- **Cause**: User has exceeded daily quota
- **Solution**: Wait 24 hours or increase `AI_RATE_LIMIT_REQUESTS_PER_DAY`

### Cache not working
- **Cause**: `AI_ENABLE_CACHING=false`
- **Solution**: Set to `true` in `.env`

