package com.example.funbugProject.Security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtUtil {
    private static final String SECRET_KEY = "mySuperSecretKeyForVuTrungKien24102005123456789";

    private static final int EXPIRATION_TIME = 86400000;

    public String generateToken(String email){
        String result = Jwts.builder().setSubject(email).setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME)).signWith(SignatureAlgorithm.HS256, SECRET_KEY).compact();

        return result;
    }

    public boolean validateToken(String token){
        try {
            Jwts.parser().setSigningKey(SECRET_KEY).parseClaimsJws(token);

            return true;
        } catch (JwtException e){
            return false;
        }
    }
    public String decodeJWT(String token){
        String email = Jwts.parser().setSigningKey(SECRET_KEY).parseClaimsJws(token).getBody().getSubject();

        return email;

    }
}