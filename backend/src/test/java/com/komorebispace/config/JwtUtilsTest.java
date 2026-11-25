package com.komorebispace.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilsTest {

    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "0123456789012345678901234567890123456789012345678901234567890123");
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 3600000L); // 1 hour
    }

    @Test
    void generatesAndValidatesToken() {
        UserDetails userDetails = new User("test@example.com", "password", Collections.emptyList());

        String token = jwtUtils.generateToken(userDetails);
        assertNotNull(token);
        assertFalse(token.isBlank());

        String username = jwtUtils.extractUsername(token);
        assertEquals("test@example.com", username);

        assertTrue(jwtUtils.isTokenValid(token, userDetails));
    }

    @Test
    void invalidatesTokenForDifferentUser() {
        UserDetails userDetails = new User("user1@example.com", "password", Collections.emptyList());
        UserDetails otherUser = new User("user2@example.com", "password", Collections.emptyList());

        String token = jwtUtils.generateToken(userDetails);

        assertFalse(jwtUtils.isTokenValid(token, otherUser));
    }
}
