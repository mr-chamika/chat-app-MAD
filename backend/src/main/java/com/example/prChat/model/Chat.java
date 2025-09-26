package com.example.prChat.model;

import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document(collection = "chats")
public class Chat {

    @Id
    private String _id;

    private String[] participants;//[inviteTo,me]
    private String lastMessageId = null;// to get last message sender,time
    private boolean status = true;// deleted=0 or not=1
private boolean isOnline = false;
private String userName;
    private boolean consent1;
    private boolean consent2;
    private  int unreadCount;

    @CreatedDate
    private Instant createdAt = Instant.now();

    @LastModifiedDate
    private Instant updatedAt = Instant.now();

}
