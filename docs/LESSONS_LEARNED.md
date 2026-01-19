# Lessons Learned

## Microsoft Entra External ID Authentication (2026-01-19)

### The Problem
After migrating from Azure AD B2C to Microsoft Entra External ID (CIAM), JWT token validation was failing with 401 errors when fetching signing keys from the JWKS endpoint.

### Root Cause
Microsoft Entra External ID uses **tenant GUID** as the subdomain in its endpoints, not the tenant name. This is different from Azure AD B2C.

### Key Insight
When using `ciamlogin.com` (Entra External ID / CIAM), all endpoints must use the **tenant GUID** as the subdomain:

| Endpoint Type | Incorrect | Correct |
|--------------|-----------|---------|
| JWKS | `https://toolshare.ciamlogin.com/...` | `https://{tenantGUID}.ciamlogin.com/...` |
| Issuer | `https://toolshare.ciamlogin.com/...` | `https://{tenantGUID}.ciamlogin.com/...` |
| Authority | `https://toolshare.ciamlogin.com/...` | `https://{tenantGUID}.ciamlogin.com/...` |

### Correct Endpoint Formats

**JWKS URI:**
```
https://{tenantGUID}.ciamlogin.com/{tenantGUID}/discovery/v2.0/keys
```

**Token Issuer:**
```
https://{tenantGUID}.ciamlogin.com/{tenantGUID}/v2.0
```

**OpenID Configuration:**
```
https://{tenantGUID}.ciamlogin.com/{tenantGUID}/v2.0/.well-known/openid-configuration
```

### What Threw Us Off

1. **Microsoft documentation** often shows `{tenantName}.ciamlogin.com` in examples, but the actual production endpoints use the GUID
2. **The tenant name works for browser redirects** but NOT for backend API calls to fetch JWKS keys
3. **Error messages were misleading** - "401 Unauthorized" from the JWKS endpoint didn't clearly indicate it was a URL format issue

### Debugging Tips

1. **Check the OpenID configuration** - Fetch `/.well-known/openid-configuration` to see the exact `jwks_uri` the identity provider expects
2. **Decode the JWT** - Check the `iss` (issuer) claim to see what format the token actually uses
3. **Test JWKS directly** - Use curl to verify the JWKS endpoint returns keys:
   ```bash
   curl https://{tenantGUID}.ciamlogin.com/{tenantGUID}/discovery/v2.0/keys
   ```

### Configuration Checklist

When setting up Entra External ID authentication:

- [ ] Get the **tenant GUID** (not just the tenant name)
- [ ] Use tenant GUID in JWKS URI
- [ ] Use tenant GUID in issuer validation
- [ ] Use tenant GUID in DAB/backend auth configuration
- [ ] Use tenant GUID in docker-compose environment variables
- [ ] Test with a real token (not just decoded - actually verify signature)

### Environment Variables Needed

```env
# The friendly tenant name (for reference)
AZURE_AD_B2C_TENANT_ID=toolshare

# The API app registration client ID
AZURE_AD_B2C_CLIENT_ID=82ea9ac5-0639-4493-a8ec-1c6a6bb7b992

# The auth domain (ciamlogin.com for Entra External ID)
AZURE_AD_AUTH_DOMAIN=toolshare.ciamlogin.com

# CRITICAL: The tenant GUID - required for JWKS and issuer URLs
AZURE_AD_TENANT_GUID=bcf802e0-bcbf-4c6b-84df-72538573a5c3
```

### Code Pattern

```typescript
// Correct JWKS client setup for Entra External ID
function getJwksClient(): jwksClient.JwksClient {
  const tenantGuid = config.AZURE_AD_TENANT_GUID;
  const authDomain = config.AZURE_AD_AUTH_DOMAIN;

  let jwksUri: string;
  if (authDomain?.includes('ciamlogin.com') && tenantGuid) {
    // Entra External ID - use tenant GUID as subdomain
    jwksUri = `https://${tenantGuid}.ciamlogin.com/${tenantGuid}/discovery/v2.0/keys`;
  } else {
    // Legacy Azure AD B2C format
    jwksUri = `https://${tenantName}.b2clogin.com/...`;
  }

  return jwksClient({ jwksUri, cache: true });
}
```

### Related Files

- `TS.API/src/middleware/auth.ts` - JWT validation middleware
- `TS.API/src/config/env.ts` - Environment configuration
- `TS.DataAPI/dab-config.json` - Data API Builder auth config
- `docker-compose.yml` - Container environment variables

### References

- [Microsoft Entra External ID Documentation](https://learn.microsoft.com/en-us/entra/external-id/)
- [MSAL.js Configuration for CIAM](https://learn.microsoft.com/en-us/entra/external-id/customers/tutorial-single-page-app-react-sign-in-configure-authentication)
