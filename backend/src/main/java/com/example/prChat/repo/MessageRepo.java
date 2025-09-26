package com.example.prChat.repo;

import com.example.prChat.model.Message;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MessageRepo extends MongoRepository<Message, String> {

    List<Message> findByChatId(String id);
}
