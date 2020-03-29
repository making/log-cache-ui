# Log Cache UI

A GUI for Cloud Foundry [Log Cache](https://github.com/cloudfoundry/log-cache-release/blob/develop/src/README.md).
It's easier than [Log Cache CLI](https://github.com/cloudfoundry/log-cache-cli).

For example

Log Transport Throughput: [`rate(ingress{source_id="doppler"}[1m])`](http://localhost:8080/index.html#rate(ingress%7Bsource_id%3D%22doppler%22%7D%5B1m%5D))
![image](https://user-images.githubusercontent.com/106908/77842862-3be29f80-71d2-11ea-9616-ed0232a256cb.png)

Router Throughput: [`rate(total_requests{source_id="gorouter"}[1m])`](http://localhost:8080/index.html#rate(total_requests%7Bsource_id%3D%22gorouter%22%7D%5B1m%5D))
![image](https://user-images.githubusercontent.com/106908/77842871-53218d00-71d2-11ea-963a-aa4a61f76256.png)

Diego Cell Remaining Memory: [`100 * CapacityRemainingMemory{source_id="rep"} / CapacityTotalMemory{source_id="rep"}`](http://localhost:8080/index.html#100%20*%20CapacityRemainingMemory%7Bsource_id%3D%22rep%22%7D%20%2F%20CapacityTotalMemory%7Bsource_id%3D%22rep%22%7D)
![image](https://user-images.githubusercontent.com/106908/77843545-29b82f80-71d9-11ea-88ef-491457cd4b4b.png)

### Create a UAA Client

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