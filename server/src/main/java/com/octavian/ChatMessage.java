package com.octavian;

import lombok.Data;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sender;
    private MessageType messageType;
    private String timestamp;
    private String content;
    private String roomId;

    public enum MessageType {
        TEXT,
        LEFT,
        JOINED
    }
}

