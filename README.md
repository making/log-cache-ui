# Log Cache UI

![image](https://user-images.githubusercontent.com/106908/77830679-79f9a800-716d-11ea-8a51-24821671479b.png)

### Create UAA Client

```
SYSTEM_DOMAN=sys.your-cf.example.com
ADMIN_CLIENT_SECRET=...

uaac target https://uaa.${SYSTEM_DOMAIN} --skip-ssl-validation
uaac token client get admin -s ${ADMIN_CLIENT_SECRET}

uaac client add log_cache_ui \
  --secret CHANGEME \
  --authorized_grant_types refresh_token,authorization_code \
  --scope openid,doppler.firehose,logs.admin \
  --access_token_validity 43200 \
  --refresh_token_validity 259200 \
  --redirect_uri http://localhost:8080/login/oauth2/code/uaa
```

### Run with Docker

```
docker run \
  --rm \
  -e SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_UAA_ISSUER_URI=https://uaa.${SYSTEM_DOMAIN}/oauth/token \
  -e SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_UAA_CLIENT_SECRET=CHANGEME \
  -p 8080:8080 \
  making/log-cache-ui
```

Go to http://localhost:8080/index.html