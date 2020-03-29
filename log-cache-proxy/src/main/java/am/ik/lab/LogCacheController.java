package am.ik.lab;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.ReactiveOAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.web.reactive.function.client.ServerOAuth2AuthorizedClientExchangeFilterFunction;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

@RestController
public class LogCacheController {
    private final WebClient webClient;

    public LogCacheController(WebClient.Builder builder,
                              ReactiveOAuth2AuthorizedClientManager authorizedClientManager,
                              @Value("${spring.security.oauth2.client.provider.uaa.issuer-uri}") String issuerUri) {
        final String logCacheUri = issuerUri.replace("/oauth/token", "").replace("uaa", "log-cache");
        final ServerOAuth2AuthorizedClientExchangeFilterFunction oauth = new ServerOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager);
        oauth.setDefaultOAuth2AuthorizedClient(true);
        this.webClient = builder
                .baseUrl(logCacheUri)
                .filter(oauth)
                .build();
    }

    @GetMapping(path = "/")
    public ResponseEntity<?> index() {
        return ResponseEntity.status(HttpStatus.SEE_OTHER).header(HttpHeaders.LOCATION, "/index.html").build();
    }

    @GetMapping(path = "/query_range")
    public Mono<JsonNode> queryRange(@RequestParam(name = "promql") String promql,
                                     @RequestParam(name = "duration", defaultValue = "PT30M") Duration duration,
                                     @RequestParam(name = "step", defaultValue = "10") int step) {
        final Instant end = Instant.now();
        final Instant begin = end.minus(duration);
        return this.webClient.get()
                .uri("/api/v1/query_range?query={promql}&start={start}&end={end}&step={step}",
                        promql,
                        begin.toEpochMilli() / 1000,
                        end.toEpochMilli() / 1000,
                        step)
                .exchange()
                .flatMap(res -> res.bodyToMono(JsonNode.class));
    }

    @GetMapping(path = "/meta")
    public Mono<String> meta() {
        return this.webClient.get()
                .uri("/api/v1/meta")
                .exchange()
                .flatMap(res -> res.bodyToMono(String.class));
    }

    @GetMapping(path = "/read/{sourceId}")
    public Mono<String> read(@PathVariable("sourceId") String sourceId) {
        return this.webClient.get()
                .uri("/api/v1/read/{sourceId}", sourceId)
                .exchange()
                .flatMap(res -> res.bodyToMono(String.class));
    }
}
