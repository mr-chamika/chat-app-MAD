package com.example.prChat.services;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OTPStore {
    private final Map<String, OtpEntry> otpMap = new ConcurrentHashMap<>();

    public void saveOtp(String email, String otp) {
        otpMap.put(email, new OtpEntry(otp, LocalDateTime.now().plusMinutes(5)));
    }

    public boolean verifyOtp(String email, String otp) {
        OtpEntry entry = otpMap.get(email);
        if (entry == null || entry.getExpiry().isBefore(LocalDateTime.now())) {
            return false; // expired or not found
        }
        return entry.getCode().equals(otp);
    }

    private static class OtpEntry {
        private final String code;
        private final LocalDateTime expiry;

        public OtpEntry(String code, LocalDateTime expiry) {
            this.code = code;
            this.expiry = expiry;
        }

        public String getCode() { return code; }
        public LocalDateTime getExpiry() { return expiry; }
    }
}
