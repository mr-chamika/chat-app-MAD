package com.example.prChat.repo;

import com.example.prChat.model.Chat;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ChatRepo extends MongoRepository<Chat, String> {
    List<Chat> findByParticipantsContaining(String id);
}
