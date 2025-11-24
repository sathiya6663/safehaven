# Security Policy

## Overview

SafeHaven is committed to protecting the safety and privacy of women and children. This document outlines our security measures and practices.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Features

### Authentication & Authorization
- **Strong Password Requirements**: 8+ characters with uppercase, lowercase, numbers, and special characters
- **Row-Level Security (RLS)**: All database tables protected with comprehensive RLS policies
- **Role-Based Access Control**: Separate roles for users, guardians, and system administrators
- **Session Management**: Automatic session refresh and secure token storage

### Data Protection
- **End-to-End Encryption**: Sensitive evidence vault files encrypted at rest
- **Field-Level Encryption**: Personal information encrypted in database
- **Anonymous Access Blocked**: All sensitive tables deny anonymous access
- **Audit Logging**: Comprehensive audit trail for sensitive data access

### Input Validation
- **Schema Validation**: All user inputs validated using Zod schemas
- **SQL Injection Protection**: Parameterized queries through Supabase client
- **XSS Prevention**: Input sanitization and Content Security Policy headers
- **CSRF Protection**: Built-in protection through Supabase authentication

### AI Safety
- **Content Moderation**: Real-time AI-powered content analysis
- **Crisis Detection**: Automatic detection of self-harm or dangerous situations
- **Grooming Detection**: Pattern recognition for predatory behavior
- **Guardian Alerts**: Automatic notifications for high-severity safety alerts

### Privacy Compliance
- **COPPA Compliance**: Age verification and parental consent for users under 13
- **GDPR Compliance**: Data retention policies and user data export/deletion
- **Data Minimization**: Only collect necessary information
- **Anonymization**: Old counseling sessions automatically anonymized after 2 years

## Reporting a Vulnerability

**DO NOT** report security vulnerabilities through public GitHub issues.

Instead, please report them via email to: security@safehaven.example.com

Please include:
- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue

### Response Timeline
- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Critical issues within 30 days, others within 90 days

## Security Best Practices for Deployment

### Environment Variables
- Never commit `.env` files
- Use Supabase Secrets for sensitive API keys
- Rotate API keys regularly
- Use separate keys for development and production

### Database Security
- Enable RLS on all tables
- Audit RLS policies regularly using `supabase db lint`
- Never expose service role keys in client code
- Use database functions with SECURITY DEFINER carefully

### Network Security
- Enable HTTPS only (no HTTP)
- Set security headers (CSP, HSTS, X-Frame-Options)
- Use Content Security Policy to prevent XSS
- Enable CORS only for trusted domains

### Monitoring & Incident Response
- Monitor Supabase audit logs regularly
- Set up alerts for suspicious activity
- Have incident response plan ready
- Regular security audits and penetration testing

## Known Limitations

1. **Manual Configuration Required**: Leaked password protection must be enabled manually in Supabase dashboard
2. **Storage Bucket Access**: Avatar bucket is currently public - should be made private with RLS policies
3. **Guardian Data Access**: Guardians can see linked children's email/phone - review if this is acceptable for your use case

## Security Updates

Security updates will be announced through:
- GitHub Security Advisories
- Release notes
- Email notifications to administrators

## Third-Party Dependencies

We regularly audit our dependencies for known vulnerabilities using:
- npm audit
- Dependabot alerts
- Manual security reviews

## Contact

For security questions or concerns: security@safehaven.example.com
