package com.octavian.controllers;

import com.octavian.repositories.ChatMessageRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.octavian.ChatMessage;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

@Controller
public class ChatController {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;

    public ChatController(SimpMessagingTemplate messagingTemplate, ChatMessageRepository chatMessageRepository) {
        this.messagingTemplate = messagingTemplate;
        this.chatMessageRepository = chatMessageRepository;
    }


    @MessageMapping("/chat/{roomId}")
    public void receiveMessage(@Payload ChatMessage message, @DestinationVariable String roomId) {
        message.setRoomId(roomId);
        chatMessageRepository.save(message);

        messagingTemplate.convertAndSend("/topic/chat/" + roomId, message);
    }

    @GetMapping("/chat/{roomId}")
    @ResponseBody
    public List<ChatMessage> getMessages(@PathVariable String roomId, @RequestParam(defaultValue = "0") int pageNumber, @RequestParam(defaultValue = "10") int pageSize) {
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by("timestamp").descending());
        return chatMessageRepository.findByRoomId(roomId, pageable).getContent();
    }
}
