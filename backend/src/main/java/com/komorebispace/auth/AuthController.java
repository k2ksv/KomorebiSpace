package com.komorebispace.auth;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final boolean secureCookies;
    private final boolean crossSiteCookies;

    // Manual constructor for dependency injection
    public AuthController(
            AuthService authService,
            @Value("${app.cookie.secure:false}") boolean secureCookies,
            @Value("${app.cookie.cross-site:false}") boolean crossSiteCookies
    ) {
        this.authService = authService;
        this.secureCookies = secureCookies;
        this.crossSiteCookies = crossSiteCookies;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, createAuthCookie(response.token()).toString()).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, createAuthCookie(response.token()).toString()).body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        ResponseCookie cookie = ResponseCookie.from("komorebi_token", "")
                .httpOnly(true)
                .secure(secureCookies)
                .sameSite(crossSiteCookies ? "None" : "Lax")
                .path("/")
                .maxAge(0)
                .build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMe(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(new UserDto(user.getId(), user.getActualUsername(), user.getEmail()));
    }

    public record UserDto(Long id, String username, String email) {}

    private ResponseCookie createAuthCookie(String token) {
        return ResponseCookie.from("komorebi_token", token)
                .httpOnly(true)
                .secure(secureCookies)
                .sameSite(crossSiteCookies ? "None" : "Lax")
                .path("/")
                .maxAge(86400)
                .build();
    }
}
