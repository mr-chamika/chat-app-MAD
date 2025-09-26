package com.example.prChat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class PrChatApplication {

	public static void main(String[] args) {
		SpringApplication.run(PrChatApplication.class, args);
		System.out.println("PR Chat backend is online ...");
	}

}
