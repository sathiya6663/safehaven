# SafeHaven Deployment Guide

## Prerequisites

- Node.js 18+ and npm/bun
- Supabase account (for backend)
- Domain name (optional, for custom domain)
- SSL certificate (automatic with Lovable hosting)

## Environment Setup

### Required Environment Variables

Create a `.env` file (never commit this):

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Supabase Secrets (Server-side)

Configure these in Supabase Dashboard → Edge Functions → Secrets:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
LOVABLE_API_KEY=your_lovable_ai_api_key
```

## Pre-Deployment Checklist

### Security Configuration

- [ ] Enable leaked password protection in Supabase Dashboard → Authentication → Password Settings
- [ ] Make avatar storage bucket private and add RLS policies
- [ ] Review and test all RLS policies
- [ ] Run `supabase db lint` to check for security issues
- [ ] Verify no service role keys in client code
- [ ] Enable MFA for admin accounts
- [ ] Set up audit logging alerts

### Database Setup

- [ ] Run all migrations: `supabase db push`
- [ ] Verify RLS policies are active on all tables
- [ ] Test guardian-child account linking
- [ ] Verify anonymous access is blocked on sensitive tables
- [ ] Set up database backups (daily recommended)

### Performance Optimization

- [ ] Run production build: `npm run build`
- [ ] Test bundle size: `npm run build -- --analyze`
- [ ] Verify code splitting is working
- [ ] Test lazy loading of routes
- [ ] Optimize images (WebP format, appropriate sizes)
- [ ] Enable CDN caching for static assets
- [ ] Test on slow 3G network

### Accessibility Testing

- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify keyboard navigation works throughout app
- [ ] Check color contrast ratios (WCAG AA minimum 4.5:1)
- [ ] Test with browser zoom at 200%
- [ ] Validate HTML with W3C validator
- [ ] Test focus management in modals and dialogs

### Cross-Browser Testing

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (desktop and iOS)
- [ ] Mobile browsers (Chrome Mobile, Safari Mobile)
- [ ] Test PWA installation on all browsers

### Compliance

- [ ] Review privacy policy and ensure it's accessible
- [ ] Verify COPPA compliance (age verification, parental consent)
- [ ] Test data export functionality
- [ ] Test data deletion functionality
- [ ] Verify cookie consent if applicable
- [ ] Document data retention policies

## Deployment Steps

### Option 1: Deploy with Lovable (Recommended)

1. Click "Publish" button in Lovable editor
2. Review changes and click "Update"
3. Frontend changes deploy immediately
4. Edge functions deploy automatically
5. Test production site

### Option 2: Self-Hosting

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy edge functions to Supabase**:
   ```bash
   supabase functions deploy
   ```

3. **Deploy static files to hosting provider**:
   
   **Vercel**:
   ```bash
   vercel --prod
   ```

   **Netlify**:
   ```bash
   netlify deploy --prod
   ```

   **AWS S3 + CloudFront**:
   ```bash
   aws s3 sync dist/ s3://your-bucket-name
   aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
   ```

4. **Configure hosting provider**:
   - Set environment variables
   - Configure redirects for SPA routing
   - Enable HTTPS
   - Set security headers

### Required Redirects (for SPAs)

Add this to your hosting configuration:

**Vercel** (`vercel.json`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

**Netlify** (`_redirects`):
```
/*    /index.html   200
```

## Post-Deployment

### Monitoring Setup

1. **Set up error tracking**:
   - Integrate Sentry or similar service
   - Monitor error rates
   - Set up alerts for critical errors

2. **Performance monitoring**:
   - Google Analytics or Plausible
   - Core Web Vitals tracking
   - Monitor API response times

3. **Security monitoring**:
   - Monitor Supabase audit logs
   - Set up alerts for suspicious login attempts
   - Monitor safety alert patterns

### Testing in Production

- [ ] Test complete user registration flow
- [ ] Test AI counseling session
- [ ] Test emergency SOS feature
- [ ] Test guardian-child account linking
- [ ] Test push notifications
- [ ] Test offline functionality
- [ ] Verify edge functions are working
- [ ] Test from different geographic locations

### Performance Targets

- **First Contentful Paint**: < 1.8s
- **Time to Interactive**: < 3.9s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### Database Maintenance

Set up scheduled jobs:

```sql
-- Run weekly to anonymize old counseling sessions
SELECT cron.schedule(
  'anonymize-old-sessions',
  '0 0 * * 0',
  $$ SELECT anonymize_old_counseling_sessions(); $$
);
```

## Rollback Plan

If critical issues arise:

1. **Revert deployment** (Lovable):
   - Use History feature to restore previous version
   - Click "Restore" on working version

2. **Database rollback**:
   ```bash
   supabase db reset
   ```
   (Use with caution - will delete all data)

3. **Emergency mode**:
   - Disable new signups temporarily
   - Show maintenance page
   - Keep emergency features functional

## Scaling Considerations

### Database Scaling
- Monitor Supabase instance usage
- Upgrade instance size in Settings → Cloud → Advanced
- Consider read replicas for high traffic
- Implement database connection pooling

### Edge Function Scaling
- Monitor function invocation counts
- Optimize function cold starts
- Consider function timeout limits
- Implement rate limiting for expensive operations

### CDN Configuration
- Enable caching for static assets
- Set appropriate cache headers
- Use image optimization services
- Consider regional edge caching

## Support & Maintenance

### Regular Maintenance Tasks

**Daily**:
- Monitor error logs
- Check safety alerts
- Review user reports

**Weekly**:
- Review security audit logs
- Check database backups
- Monitor performance metrics
- Update dependencies

**Monthly**:
- Security audit
- Performance optimization review
- User feedback analysis
- Dependency updates and security patches

### Emergency Contacts

- **Technical Issues**: tech@safehaven.example.com
- **Security Issues**: security@safehaven.example.com
- **User Support**: support@safehaven.example.com

## Troubleshooting

### Common Issues

**Edge functions not working**:
- Verify secrets are set in Supabase dashboard
- Check function logs in Supabase dashboard
- Ensure CORS headers are configured

**RLS policy errors**:
- Run `supabase db lint`
- Check user authentication status
- Verify user_id matches auth.uid()

**Slow performance**:
- Check bundle size
- Verify code splitting
- Review database query performance
- Enable caching

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [PWA Best Practices](https://web.dev/pwa/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
