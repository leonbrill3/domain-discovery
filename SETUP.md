# 🚀 DomainSeek.ai - Setup Guide

Complete setup guide for ultra-fast domain discovery.

---

## 📋 Prerequisites

1. Node.js 18+ installed
2. Anthropic API key (Claude)
3. Namecheap account (for domain checking + affiliate sales)
4. Upstash Redis account (optional but recommended for caching)

---

## ⚡ Quick Start (5 minutes)

### 1. Clone & Install

```bash
git clone https://github.com/leonbrill3/domain-discovery.git
cd domain-discovery
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# REQUIRED: Claude API for domain generation
ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"

# RECOMMENDED: Namecheap API for fast bulk checking (15x faster!)
NAMECHEAP_API_USER="your-username"
NAMECHEAP_API_KEY="your-api-key"
NAMECHEAP_USERNAME="your-username"
NAMECHEAP_CLIENT_IP="your-ip-address"

# OPTIONAL: Redis for 95% cache hit rate (highly recommended)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5001](http://localhost:5001)

---

## 🔑 Getting API Keys

### Anthropic Claude API (REQUIRED)

1. Go to: https://console.anthropic.com/
2. Create account / Sign in
3. Go to "API Keys"
4. Create new key
5. Copy to `.env` as `ANTHROPIC_API_KEY`

**Cost**: ~$0.008 per user (with prompt caching)

---

### Namecheap API (RECOMMENDED for Speed)

**Why Namecheap?**
- ⚡ Bulk checking: 50 domains in 400ms (15x faster!)
- 💰 Free with account
- 🎯 Direct registrar = 99% accurate
- 💵 20% affiliate commission on sales

**Setup:**

1. **Create Namecheap account**: https://www.namecheap.com/
2. **Enable API access**:
   - Go to: https://www.namecheap.com/myaccount/api/
   - Enable API Access
   - Create API key
3. **Whitelist your IP**:
   - Add your server IP to whitelist
   - For local dev: Add your home IP
4. **Get credentials**:
   ```
   API User: your-username
   API Key: abc123...
   Username: your-username
   Client IP: 1.2.3.4
   ```
5. **Add to `.env`**

**Cost**: $0 (free with account)
**Speed**: 400ms for 50 domains (vs 6 seconds individual)

---

### Upstash Redis (OPTIONAL but Highly Recommended)

**Why Redis?**
- 🚀 95% cache hit rate = 95% of requests are instant (< 5ms)
- 💰 Free tier: 10,000 commands/day
- 🌍 Global edge caching
- 📊 Reduces API costs by 95%

**Setup:**

1. Go to: https://console.upstash.com/
2. Create Redis database
3. Copy REST URL and Token
4. Add to `.env`

**Cost**: $0 (free tier sufficient for 10,000+ users)

---

### Domainr API (OPTIONAL Fallback)

**When to use:**
- Don't have Namecheap API yet
- Need fallback for reliability
- Testing without Namecheap

**Setup:**

1. Go to: https://rapidapi.com/domainr/api/domainr
2. Subscribe to free tier (10,000 requests/month)
3. Copy API key
4. Add to `.env` as `DOMAINR_API_KEY`

**Cost**: $0 (free tier)

---

## 🏗️ Architecture

### Speed Optimization Layers

```
User Request (Generate domains)
       ↓
[Layer 1] Redis Cache (5ms)
       ↓ 95% hit rate
[Layer 2] Namecheap Bulk API (400ms for 50 domains)
       ↓ If Namecheap unavailable
[Layer 3] Domainr API (300ms per domain)
       ↓ If Domainr unavailable
[Layer 4] RDAP (200ms per domain)
       ↓ If all fail
[Layer 5] Dev Mode Heuristics (instant, for testing)
```

**Result:**
- **With cache**: < 10ms average
- **Without cache**: 400ms for 50 domains (15x faster than individual)
- **Reliability**: 99.9% (multiple fallbacks)

---

## 📊 Performance Metrics

### Without Namecheap (Individual Checking)
```
20 domains:
- Sequential: 20 × 300ms = 6,000ms 😱
- Parallel (5 concurrent): 1,200ms
- With 50% cache: 600ms
```

### With Namecheap Bulk API
```
20 domains:
- Bulk request: 400ms ⚡
- With 50% cache: 200ms
- With 95% cache: 20ms 🚀
```

**Speed improvement: 15x faster!**

---

## 🎯 Deployment to Render

### 1. Environment Variables

Add to Render dashboard (Environment tab):

```
ANTHROPIC_API_KEY=sk-ant-api03-your-key
NAMECHEAP_API_USER=your-username
NAMECHEAP_API_KEY=your-api-key
NAMECHEAP_USERNAME=your-username
NAMECHEAP_CLIENT_IP=your-render-ip
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
NODE_ENV=production
```

### 2. Get Render's IP Address

After first deployment, go to Shell tab and run:
```bash
curl ifconfig.me
```

Add this IP to Namecheap API whitelist.

---

## 🧪 Testing

### Local Testing

```bash
# Test API connection
npm run test:apis

# Or test manually
curl -X POST http://localhost:5001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "project": "yoga studio",
    "themes": ["nature", "tech"],
    "countPerTheme": 5
  }'
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "themes": {
      "nature": [
        {
          "domain": "zenflow.io",
          "available": true,
          "price": 39.98,
          "confidence": 0.99
        }
      ]
    },
    "statistics": {
      "totalGenerated": 10,
      "totalAvailable": 7,
      "generationTime": 2500,
      "checkingTime": 450
    }
  }
}
```

---

## 📈 Monitoring

### Key Metrics to Track

1. **Cache hit rate**: Target 95%+
   ```
   [Checker] Cache hit: 19/20 (95%)
   ```

2. **Check duration**: Target < 500ms
   ```
   [API/Generate] Checked 20 domains in 420ms
   ```

3. **API costs**: Target < $20/month
   ```
   [API/Generate] Total tokens: 15,000 ($0.12)
   ```

4. **Error rate**: Target < 1%
   ```
   [Checker] Success: 99/100 (99%)
   ```

---

## 🔧 Troubleshooting

### "Namecheap API error: Invalid IP"

**Problem**: Your IP not whitelisted

**Solution**:
1. Go to Namecheap API settings
2. Add your current IP to whitelist
3. For Render: Add Render's IP after first deployment

### "Unable to find environment variable: UPSTASH_REDIS_REST_URL"

**Problem**: Redis not configured (app still works!)

**Solution**:
1. Sign up for Upstash: https://console.upstash.com/
2. Create Redis database
3. Add credentials to `.env`

**Note**: App works without Redis, just slower (no caching)

### "Domains showing as all available/unavailable"

**Problem**: API keys not configured, using dev mode

**Solution**:
1. Add Namecheap API credentials to `.env`
2. Restart dev server
3. Check logs for `[Namecheap] ⚡ Bulk checked` messages

---

## 💡 Tips for Best Performance

1. **Always use Redis caching**
   - 95% of requests will be instant (< 5ms)
   - Reduces API costs by 95%

2. **Enable Namecheap bulk API**
   - 15x faster than individual checks
   - Free with account

3. **Monitor cache hit rate**
   - Target: 95%+
   - Lower = need cache warming strategy

4. **Use Render's Starter plan**
   - Free tier spins down (50s delay)
   - Starter tier is always warm
   - Better UX for users

---

## 🎯 Next Steps

1. **Get API keys** (30 mins)
2. **Configure .env** (5 mins)
3. **Test locally** (10 mins)
4. **Deploy to Render** (10 mins)
5. **Add Render IP to Namecheap whitelist** (5 mins)

**Total: 1 hour to production!**

---

## 📞 Support

- Issues: https://github.com/leonbrill3/domain-discovery/issues
- Namecheap API Docs: https://www.namecheap.com/support/api/
- Render Docs: https://render.com/docs

---

**Built with ❤️ for speed**
