# 🚀 Deployment Guide

## Production Deployment Checklist

### Prerequisites
- ✅ Supabase project created
- ✅ Anthropic API key obtained
- ✅ GitHub repository set up
- ✅ Domain name (optional but recommended)

---

## 1. Deploy Orchestration Hub

### Option A: Railway (Recommended)

**Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
```

**Step 2: Login**
```bash
railway login
```

**Step 3: Initialize Project**
```bash
cd orchestration-hub
railway init
```

**Step 4: Set Environment Variables**
```bash
railway variables set NODE_ENV=production
railway variables set PORT=4001
railway variables set LOG_LEVEL=info
railway variables set NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
railway variables set SUPABASE_SERVICE_KEY=your_service_key
railway variables set ANTHROPIC_API_KEY=your_anthropic_key
railway variables set PROJECTS="project1:https://project1.com,project2:https://project2.com"
```

**Step 5: Deploy**
```bash
railway up
```

**Step 6: Get URL**
```bash
railway domain
```

### Option B: Render

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `orchestration-hub`
   - **Root Directory**: `orchestration-hub`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add environment variables (same as Railway)
6. Click "Create Web Service"

### Option C: Fly.io

```bash
cd orchestration-hub
fly launch
fly secrets set ANTHROPIC_API_KEY=your_key
fly secrets set SUPABASE_SERVICE_KEY=your_key
fly deploy
```

---

## 2. Deploy Dashboard

### Vercel (Recommended)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Deploy**
```bash
cd dashboard
vercel
```

**Step 3: Set Environment Variables**
In Vercel Dashboard:
- Go to Project Settings → Environment Variables
- Add:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Step 4: Redeploy**
```bash
vercel --prod
```

### Alternative: Netlify

```bash
cd dashboard
npm run build
netlify deploy --prod --dir=.next
```

---

## 3. Configure Supabase

### Enable Real-time

1. Go to Supabase Dashboard
2. Navigate to Database → Replication
3. Enable replication for:
   - `project_status_history`
   - `project_metrics`
   - `agent_events`

### Set Up Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE project_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access" ON project_status_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON project_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON agent_events
  FOR ALL USING (auth.role() = 'service_role');

-- Allow anon read access (for dashboard)
CREATE POLICY "Allow anon read access" ON project_status_history
  FOR SELECT USING (true);

CREATE POLICY "Allow anon read access" ON project_metrics
  FOR SELECT USING (true);

CREATE POLICY "Allow anon read access" ON agent_events
  FOR SELECT USING (true);
```

---

## 4. Configure Custom Domain (Optional)

### For Orchestration Hub (Railway)

```bash
railway domain add api.yourdomain.com
```

### For Dashboard (Vercel)

1. Go to Vercel Dashboard → Domains
2. Add `yourdomain.com`
3. Configure DNS:
   - Type: `CNAME`
   - Name: `@` or `www`
   - Value: `cname.vercel-dns.com`

---

## 5. Set Up Monitoring

### Health Check Endpoints

Add to your monitoring service (UptimeRobot, Pingdom, etc.):
- **Hub Health**: `https://your-hub-url.com/health`
- **Dashboard**: `https://your-dashboard-url.com`

### Recommended Checks
- Interval: 5 minutes
- Timeout: 30 seconds
- Alert on: 2 consecutive failures

---

## 6. Configure CORS

Update `orchestration-hub/src/index.ts`:

```typescript
fastify.register(fastifyCors, {
    origin: [
        'https://yourdomain.com',
        'https://www.yourdomain.com'
    ],
});
```

---

## 7. Environment Variables Reference

### Orchestration Hub

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment | Yes | `production` |
| `PORT` | Server port | Yes | `4001` |
| `LOG_LEVEL` | Logging level | No | `info` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | Yes | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes | `eyJhbGci...` |
| `SUPABASE_SERVICE_KEY` | Supabase service key | Yes | `eyJhbGci...` |
| `ANTHROPIC_API_KEY` | Claude API key | Yes | `sk-ant-api03-...` |
| `PROJECTS` | Projects to monitor | Yes | `app1:https://app1.com` |

### Dashboard

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | Yes | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes | `eyJhbGci...` |

---

## 8. Post-Deployment Verification

### 1. Check Hub Health
```bash
curl https://your-hub-url.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Check Projects Status
```bash
curl https://your-hub-url.com/api/projects/status
```

### 3. Test AI Endpoint
```bash
curl -X POST https://your-hub-url.com/api/test/anomaly \
  -H "Content-Type: application/json" \
  -d '{"projectName": "your-project", "type": "high_memory"}'
```

### 4. Verify Dashboard
- Open `https://your-dashboard-url.com`
- Check that projects are showing
- Verify real-time updates are working

---

## 9. Scaling Considerations

### Horizontal Scaling

For high-volume monitoring (50+ projects):

1. **Multiple Hub Instances**
   - Deploy multiple instances
   - Use load balancer
   - Distribute projects across instances

2. **Database Optimization**
   - Enable Supabase connection pooling
   - Add database indexes
   - Consider TimescaleDB for time-series data

3. **Caching**
   - Add Redis for caching
   - Cache project status
   - Cache AI decisions

### Vertical Scaling

Railway/Render plans:
- **Starter**: 1-10 projects
- **Pro**: 10-50 projects
- **Enterprise**: 50+ projects

---

## 10. Backup & Disaster Recovery

### Database Backups

Supabase provides automatic daily backups. For additional safety:

```bash
# Export data
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql

# Restore
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

### Configuration Backups

Store in version control:
- Environment variables (encrypted)
- Supabase schema
- Project configurations

---

## 11. Security Checklist

- ✅ Use HTTPS everywhere
- ✅ Enable Supabase RLS
- ✅ Rotate API keys regularly
- ✅ Use service key only in backend
- ✅ Enable CORS restrictions
- ✅ Set up rate limiting
- ✅ Monitor for suspicious activity
- ✅ Keep dependencies updated

---

## 12. Cost Estimation

### Monthly Costs (Approximate)

| Service | Tier | Cost |
|---------|------|------|
| Supabase | Free | $0 |
| Supabase | Pro | $25 |
| Railway | Starter | $5 |
| Railway | Pro | $20 |
| Vercel | Hobby | $0 |
| Vercel | Pro | $20 |
| Anthropic Claude | Pay-as-you-go | ~$10-50 |

**Total**: $0-115/month depending on scale

---

## 13. Troubleshooting

### Hub Not Starting

1. Check environment variables
2. Verify Supabase connection
3. Check logs: `railway logs` or Render dashboard

### Dashboard Not Loading

1. Verify Supabase URL/key
2. Check CORS settings
3. Inspect browser console

### AI Not Working

1. Verify Anthropic API key
2. Check API quota
3. Review Claude model availability

---

## 14. Support

- 📧 Email: support@ajay-automates.com
- 🐛 Issues: [GitHub Issues](https://github.com/ajay-automates/multi-orchestration-system/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/ajay-automates/multi-orchestration-system/discussions)

---

**🎉 Congratulations! Your AI-powered orchestration system is now in production!**
