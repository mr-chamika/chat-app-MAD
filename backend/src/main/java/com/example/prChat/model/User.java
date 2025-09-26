package com.example.prChat.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "users")
public class User {

    @Id
    private String _id;
    private String firstName;
    private String lastName;
    private String email;
    private String profilePic;

}
