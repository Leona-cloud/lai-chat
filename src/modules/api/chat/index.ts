import { Module } from "@nestjs/common";
import { ChatGateway } from "./chat-gateway";
import { ChatController } from "./controllers";
import { ChatService } from "./services";


@Module({
    providers: [ChatGateway, ChatService],
    controllers: [ChatController]
})

export class ChatModule{}