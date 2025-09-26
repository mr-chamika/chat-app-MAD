package com.example.prChat.controller;

import com.example.prChat.model.User;
import com.example.prChat.repo.UserRepo;
import com.example.prChat.services.JwtUtil;
import com.example.prChat.services.UserSignup;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserRepo repo;

    @Autowired
    private UserSignup userSignup;
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/signup")
    public String signup(@RequestBody User user) {

        Optional<User> exists = repo.findByEmail(user.getEmail());

        if (!exists.isPresent()) {

            User x = userSignup.registerNewUser(user);

            if (x.getEmail().equals(user.getEmail())) {

                return x.get_id();

            }

        }

        return "Signup failed";

    }

    @PostMapping("/login")
    public ResponseEntity<?> loginInsecure(@RequestBody Map<String, String> payload) {

        String email = payload.get("email");

        Optional<User> exists = repo.findByEmail(email);

        if (exists.isPresent()) {
            User t = exists.get();

            // In a secure system, you would verify a password or code here.
            // This implementation skips verification entirely.

            // Build a UserDetails object for token generation
            UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                    t.get_id(), // Using _id as the username for this example
                    "", // No password
                    Collections.singletonList(new SimpleGrantedAuthority("USER")) // Or get role from user object
            );

            // Generate the token
            String token = jwtUtil.generateToken(userDetails, t);

            Map<String, String> responseBody = new HashMap<>();
            responseBody.put("token", token);
            return ResponseEntity.ok(responseBody);
        } else {
            Map<String, String> errorBody = new HashMap<>();
            errorBody.put("error", "invalid email");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorBody);
        }


    }

    @GetMapping("/get")
public ResponseEntity<?> getUserById(@RequestParam String id) {
    Optional<User> userOpt = repo.findById(id);
    if (userOpt.isPresent()) {
        User user = userOpt.get();
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("_id", user.get_id());
        responseBody.put("name", user.getFirstName() + " " + user.getLastName());
        responseBody.put("email", user.getEmail());
        responseBody.put("profilePic", user.getProfilePic());
        return ResponseEntity.ok(responseBody);
    } else {
        Map<String, String> errorBody = new HashMap<>();
        errorBody.put("error", "User not found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorBody);
    }
}

    @PutMapping("/update")
public ResponseEntity<?> updateUser(@RequestBody Map<String, Object> payload) {
    String id = (String) payload.get("id");
    String firstName = (String) payload.get("firstName");
    String lastName = (String) payload.get("lastName");
    String profilePic = (String) payload.get("avatarUri");

    Optional<User> userOpt = repo.findById(id);
    if (userOpt.isPresent()) {
        User user = userOpt.get();
        boolean changed = false;

        if (firstName != null && !firstName.equals(user.getFirstName())) {
            user.setFirstName(firstName);
            changed = true;
        }
        if (lastName != null && !lastName.equals(user.getLastName())) {
            user.setLastName(lastName);
            changed = true;
        }
        if (profilePic != null && !profilePic.equals(user.getProfilePic())) {
            user.setProfilePic(profilePic);
            changed = true;
        }

        if (changed) {
            repo.save(user);
            return ResponseEntity.ok("Profile updated successfully");
        } else {
            return ResponseEntity.ok("No changes detected");
        }
    } else {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
    }
}

   @PutMapping("/email")
public ResponseEntity<?> updateUserEmail(@RequestBody Map<String, Object> payload) {
    String id = (String) payload.get("id");
    String oldEmail = (String) payload.get("x");
    String newEmail = (String) payload.get("email");

    Optional<User> userOpt = repo.findById(id);
    if (userOpt.isPresent()) {
        User user = userOpt.get();

        // Check if new email is same as old
        if (newEmail == null || newEmail.equals(oldEmail)) {
            return ResponseEntity.ok("No changes detected");
        }

        // Check if new email already exists for another user
        Optional<User> emailUser = repo.findByEmail(newEmail);
        if (emailUser.isPresent() && !emailUser.get().get_id().equals(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
        }

        // Update email
        user.setEmail(newEmail);
        repo.save(user);
        return ResponseEntity.ok("Email updated successfully");
    } else {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
    }
}
    
}
