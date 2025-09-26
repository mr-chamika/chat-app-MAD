package com.example.prChat.controller;


import com.example.prChat.model.Chat;
import com.example.prChat.model.Message;
import com.example.prChat.model.dto.Messagedto;
import com.example.prChat.repo.ChatRepo;
import com.example.prChat.repo.MessageRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin
@RequestMapping("/message")
public class MessageController {

    @Autowired
    private MessageRepo messageRepo;

    @PostMapping("/create")
    public Message create(@RequestBody Messagedto message) {

        Message x = new Message();

        x.setChatId(message.getChatId());
        x.setText(message.getText());
        x.setSenderId(message.getSenderId());

       return messageRepo.save(x);

    }

    @GetMapping("/get")
    public List<Message> get(@RequestParam String id) {

        return messageRepo.findByChatId(id);

    }

//
//
//@GetMapping("/list")
//public ResponseEntity<?> getChatList(@RequestParam String id) {
//
//        List<Chat> list = chatRepo.findByParticipantsContaining(id);
//
//    if (!list.isEmpty()) {
//
//        return ResponseEntity.ok(list);
//
//        }
//
//        return ResponseEntity.badRequest().body("Chat not found");
//
//    }

}
