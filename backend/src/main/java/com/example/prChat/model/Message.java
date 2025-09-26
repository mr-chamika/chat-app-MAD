package com.example.prChat.model;

import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document(collection = "messages")
public class Message {

    @Id
    private String _id;

    private String chatId;
    private String text;
    private String senderId;
    private String status = "sent";// sent,delivered,read
    private boolean isDeleted ;// not deleted=0 or deleted=1

    @CreatedDate
    private Instant createdAt = Instant.now();

    @LastModifiedDate
    private Instant updatedAt = Instant.now();

}
