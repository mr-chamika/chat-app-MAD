package com.example.prChat.services;


import com.example.prChat.model.User;
import com.example.prChat.repo.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserSignup {

    @Autowired
    private UserRepo userRepo;

    public User registerNewUser(User user) {

        Optional<User> x = userRepo.findByEmail(user.getEmail());

        if (x.isPresent()) {

            return null;

        }

            return userRepo.save(user);

    }
}