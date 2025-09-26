package com.example.prChat.controller;

import com.example.prChat.model.User;
import com.example.prChat.model.dto.Email;
import com.example.prChat.repo.UserRepo;
import com.example.prChat.services.OTPStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;


import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@CrossOrigin
@RequestMapping("/otp")
public class OTPController {

    @Autowired
    private OTPStore otpStorage;
    private final RestTemplate restTemplate = new RestTemplate();

    public OTPController(OTPStore otpStorage) {
        this.otpStorage = otpStorage;
    }

    @Autowired
    private UserRepo userRepo;

    // 1. Send OTP
    @PostMapping("/send")
    public String sendOtp(@RequestBody Email obj) {

        // Generate 6-digit OTP

        Optional <User> newUser = userRepo.findByEmail(obj.getEmail());

        if (newUser.isPresent()) {

        String otp = String.format("%06d", new Random().nextInt(999999));

        // Save OTP in memory (valid 5 minutes)
        otpStorage.saveOtp(obj.getEmail(), otp);

        String url = "https://api.emailjs.com/api/v1.0/email/send";

        // Request payload
        Map<String, Object> payload = new HashMap<>();
        payload.put("service_id", "service_40k3ymf");
        payload.put("template_id", "template_m0e810u");
        payload.put("user_id", "ZScUXbWHpMEUHDihx"); // OR use private key if required

        // Template params (must match EmailJS template variables)
        Map<String, String> templateParams = new HashMap<>();
        templateParams.put("email", obj.getEmail());
        templateParams.put("otp_code", otp);
        templateParams.put("to_name", newUser.get().getFirstName() + " " + newUser.get().getLastName());

        payload.put("template_params", templateParams);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
        System.out.println(obj.getEmail());

        try {
            restTemplate.postForEntity(url, request, String.class);
            return "OTP sent to " + obj.getEmail();
        } catch (Exception e) {
            e.printStackTrace();
            return "Failed to send OTP: " + e.getMessage();
        }

        }else{

return "Email not found";

        }
    }

    // 2. Verify OTP
    @PostMapping("/verify")
    public String verifyOtp(@RequestBody Email obj) {
        boolean isValid = otpStorage.verifyOtp(obj.getEmail(), obj.getOtp());

        if (isValid) {
            return "OTP verified successfully!";
        } else {
            return "Invalid or expired OTP!";
        }
    }
}
