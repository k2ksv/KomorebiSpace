package com.komorebispace.auth;

public record AuthResponse(
        String token,
        Long id,
        String username,
        String email
) {}
