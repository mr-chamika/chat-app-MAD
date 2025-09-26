package com.example.prChat.services;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class Hashingpw {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(
                                "/otp/**",
                                "/user/**",
                                "/message/**",
                                "/chat/**"

                        ).permitAll() // <-- THIS LINE MAKES REGISTRATION PUBLIC
                        .anyRequest().authenticated() // Secure all other endpoints

                )

                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .csrf(csrf -> csrf.disable()) // Disable CSRF, common for stateless APIs
                .formLogin(form -> form.disable())
                .httpBasic(basic->basic.disable()) ;// Use Basic Auth for the secured endpoints
        //.formLogin(form -> form.disable());


        return http.build();
    }

}
