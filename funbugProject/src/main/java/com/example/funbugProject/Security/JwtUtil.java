package com.example.funbugProject.Security;

import com.example.funbugProject.dto.UserPayload;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
    @Value("${jwt.secret.secretKey}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private Long expiration;

    public Key getSigninKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    public String generateToken(UserPayload payload){
        String result = Jwts.builder()
                .setSubject(payload.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigninKey(),SignatureAlgorithm.HS256)
                .compact();

        return result;
    }

    public boolean validateToken(String token){
        try {
            Jwts.parser().setSigningKey(secretKey).parseClaimsJws(token);

            return true;
        } catch (JwtException e){
            return false;
        }
    }
    public String decodeJWT(String token){
        String email = Jwts.parser().setSigningKey(secretKey).parseClaimsJws(token).getBody().getSubject();

        return email;

    }
}