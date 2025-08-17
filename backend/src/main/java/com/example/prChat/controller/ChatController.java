package com.example.prChat.controller;


import com.example.prChat.model.Chat;
import com.example.prChat.repo.ChatRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin
@RequestMapping("/chat")
public class ChatController {

    @Autowired
    private ChatRepo chatRepo;

    @GetMapping("/create")
public String create(@RequestParam String inviteTo, @RequestParam String scan) {

        Chat x = new Chat();

        x.setParticipants(new String[]{inviteTo, scan});
        x.setUserName(inviteTo+" user");

        chatRepo.save(x);

        return x.get_id();

    }

    @GetMapping("/get")
public ResponseEntity<?> get(@RequestParam String id) {

        Optional<Chat> x = chatRepo.findById(id);

        if (x.isPresent()) {

            Chat chat = x.get();

            return ResponseEntity.ok(chat);

        }

        return ResponseEntity.badRequest().body("Chat not found");

    }


@GetMapping("/list")
public ResponseEntity<?> getChatList(@RequestParam String id) {

        List<Chat> list = chatRepo.findByParticipantsContaining(id);

    if (!list.isEmpty()) {

        return ResponseEntity.ok(list);

        }

        return ResponseEntity.badRequest().body("Chat not found");

    }

}
