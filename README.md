# Log Cache UI

A GUI for Cloud Foundry [Log Cache](https://github.com/cloudfoundry/log-cache-release/blob/develop/src/README.md).
It's easier than [Log Cache CLI](https://github.com/cloudfoundry/log-cache-cli).

> Log Cache UI supports only Metrics.

### Examples

Log Transport Throughput: [`rate(ingress{source_id="doppler"}[1m])`](http://localhost:8080/index.html#rate(ingress%7Bsource_id%3D%22doppler%22%7D%5B1m%5D))
![image](https://user-images.githubusercontent.com/106908/77849315-c395d180-7205-11ea-8d25-d7a081f60c9c.png)

Router Throughput: [`rate(total_requests{source_id="gorouter"}[1m])`](http://localhost:8080/index.html#rate(total_requests%7Bsource_id%3D%22gorouter%22%7D%5B1m%5D))
![image](https://user-images.githubusercontent.com/106908/77849338-ed4ef880-7205-11ea-9f79-36541fc8382a.png)

Diego Cell Remaining Memory: [`100 * CapacityRemainingMemory{source_id="rep"} / CapacityTotalMemory{source_id="rep"}`](http://localhost:8080/index.html#100%20*%20CapacityRemainingMemory%7Bsource_id%3D%22rep%22%7D%20%2F%20CapacityTotalMemory%7Bsource_id%3D%22rep%22%7D)
![image](https://user-images.githubusercontent.com/106908/77849357-09eb3080-7206-11ea-82a5-05b828e1a6ee.png)

You don't need to know metrics names as supported metrics are listed.

![image](https://user-images.githubusercontent.com/106908/77848705-a6f79a80-7201-11ea-8e7b-09506639368e.png)

### Create a UAA Client

```
SYSTEM_DOMAIN=sys.your-cf.example.com
ADMIN_CLIENT_SECRET=...
REDIRECT_URLS=http://localhost:8080/login/oauth2/code/uaa
# or
# REDIRECT_URLS=https://log-cache-ui.${APPS_DOMAIN}/login/oauth2/code/uaa

uaac target https://uaa.${SYSTEM_DOMAIN} --skip-ssl-validation
uaac token client get admin -s ${ADMIN_CLIENT_SECRET}

uaac client add log_cache_ui \
  --secret CHANGEME \
  --authorized_grant_types refresh_token,authorization_code \
  --scope openid,doppler.firehose,logs.admin \
  --access_token_validity 43200 \
  --refresh_token_validity 259200 \
  --redirect_uri ${REDIRECT_URLS}
```

### Run with Docker

```
docker run \
  --rm \
  -m 768m \
  -e SYSTEM_DOMAIN=${SYSTEM_DOMAIN} \
  -e UAA_CLIENT_SECRET=CHANGEME \
  -p 8080:8080 \
  making/log-cache-ui
```

Go to http://localhost:8080 and login UAA as a user with `doppler.firehose` or `logs.admin` scope like `admin`.

Docker Image is built using [Cloud Native Buildpacks](https://buildpacks.io).
You can run it with less memory using [`openjdk-cnb`](https://github.com/cloudfoundry/openjdk-cnb) options.

```
docker run \
  --rm \
  -m 256m \
  -e SYSTEM_DOMAIN=${SYSTEM_DOMAIN} \
  -e UAA_CLIENT_SECRET=CHANGEME \
  -e JAVA_OPTS="-XX:ReservedCodeCacheSize=32M -Xss512k" \
  -e BPL_THREAD_COUNT=20 \
  -p 8080:8080 \
  making/log-cache-ui
```