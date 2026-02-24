package com.octavian.controllers;

import com.octavian.ChatMessage;
import com.octavian.exception.InvalidRequestException;
import com.octavian.repositories.ChatMessageRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.time.Instant;
import java.util.List;

@Controller
@CrossOrigin(origins = "${cors.allowed-origins:*}")
public class ChatController {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;

    public ChatController(SimpMessagingTemplate messagingTemplate, ChatMessageRepository chatMessageRepository) {
        this.messagingTemplate = messagingTemplate;
        this.chatMessageRepository = chatMessageRepository;
    }


    @MessageMapping("/chat/{roomId}")
    public void receiveMessage(@Payload ChatMessage message, @DestinationVariable String roomId) {
        if (message == null) {
            throw new InvalidRequestException("Message cannot be null");
        }
        if (roomId == null || roomId.isBlank()) {
            throw new InvalidRequestException("Room ID is required");
        }
        String sender = message.getSender();
        if (sender == null || sender.isBlank()) {
            throw new InvalidRequestException("Sender name is required");
        }
        if (sender.length() > 100) {
            throw new InvalidRequestException("Sender name must not exceed 100 characters");
        }
        if (message.getMessageType() == null) {
            throw new InvalidRequestException("Message type is required");
        }
        if (message.getMessageType() == ChatMessage.MessageType.TEXT) {
            String content = message.getContent();
            if (content == null || content.isBlank()) {
                throw new InvalidRequestException("Message content is required for text messages");
            }
            if (content.length() > 4096) {
                throw new InvalidRequestException("Message content must not exceed 4096 characters");
            }
        }
        message.setRoomId(roomId);
        if (message.getTimestamp() == null || message.getTimestamp().isBlank()) {
            message.setTimestamp(Instant.now().toString());
        }
        chatMessageRepository.save(message);
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, message);
    }

    @GetMapping("/chat/{roomId}")
    @ResponseBody
    public List<ChatMessage> getMessages(
            @PathVariable String roomId,
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "10") int pageSize) {
        if (roomId == null || roomId.isBlank()) {
            throw new InvalidRequestException("Room ID is required");
        }
        if (roomId.length() > 100) {
            throw new InvalidRequestException("Room ID must not exceed 100 characters");
        }
        if (pageNumber < 0) {
            throw new InvalidRequestException("Page number must be non-negative");
        }
        if (pageSize < 1 || pageSize > 100) {
            throw new InvalidRequestException("Page size must be between 1 and 100");
        }
        Pageable pageable = PageRequest.of(pageNumber, pageSize,
                Sort.by("timestamp").descending().and(Sort.by("id").descending()));
        return chatMessageRepository.findByRoomId(roomId, pageable).getContent();
    }
}
