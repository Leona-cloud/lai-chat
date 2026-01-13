import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import logger from 'moment-logger';
import { Server, Socket } from 'socket.io';

interface RoomInfo {
  roomId: string;
  clients: Set<string>;
  createdAt: Date;
  lastActivity: Date;
}

@WebSocketGateway(3005, {
  cors: {
    origin: '*',
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private rooms: Map<string, RoomInfo> = new Map();

  afterInit(server: Server) {
    logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    logger.log('New user connected!', client.id);

    client.broadcast.emit('user-joined', {
      message: `New user joined the chat: ${client.id}`,
    });
  }

  handleDisconnect(client: Socket) {
    logger.log('User disconnected.', client.id);
    this.server.emit('user-left', {
      message: `User left the chat: ${client.id}`,
    });
    client.removeAllListeners();
    client.disconnect(true);
  }

  @SubscribeMessage('broadcast')
  handleBroadcast(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): void {
    this.server.emit('broadcast', {
      message: `Broadcast to all: ${data?.message || ''}`,
      timestamp: new Date().toISOString(),
      fromClient: client.id,
    });
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): string {
    logger.log(`Recieved message from ${client.id}: ${JSON.stringify(data)}`);

    let originalMessage;
    if (data && typeof data === 'string') {
      originalMessage = JSON.parse(data)?.message;
    }
    if (data && typeof data === 'object') {
      originalMessage = data?.message;
    }

    this.server.to(client.id).emit('message', {
      originalMessage,
      timestamp: new Date().toISOString(),
    });

    return 'Message recieved!';
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody()
    data: { roomId: string; username?: string } = { roomId: 'room1' },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, username } = data;

    client.join(roomId);

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        roomId,
        clients: new Set(),
        createdAt: new Date(),
        lastActivity: new Date(),
      });
    }

    const room = this.rooms.get(roomId);
    if (room) {
      room.clients.add(client.id);
      room.lastActivity = new Date();
    }

    client.emit('joinRoom', {
      roomId,
      clientId: client.id,
      clientInRooms: room?.clients?.size,
    });

    logger.log(`Client ${client.id} joined room ${roomId}`);
    return {
      roomId,
      clientId: client.id,
      username: username || `User-${client.id.slice(0, 6)}`,
      clientsInRoom: room?.clients?.size,
    };
  }

  @SubscribeMessage('roomMessage')
  handleRoomMessage(
    @MessageBody() data: { roomId: string; message: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId, message } = data;

    const room = this.rooms.get(roomId);
    if (!room?.clients.has(client.id) || !client.rooms.has(roomId)) {
      this.server
        .to(client.id)
        .emit('roomMessage', { error: 'You are not a member of this room!' });
      return;
    }

    if (room) {
      room.lastActivity = new Date();
    }

    this.server.to(roomId).emit('roomMessage', {
      roomId,
      message,
      from: client.id,
      timestamp: new Date().toISOString(),
    });

    logger.log(`Room message in ${roomId} from ${client.id}: ${message}`);
  }

  @SubscribeMessage('listRooms')
  handleListRooms(@ConnectedSocket() client: Socket) {
    const roomList = Array.from(this.rooms.entries()).map(([roomId, room]) => ({
      roomId,
      clientCount: this.rooms.size,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity,
    }));

    return roomList;
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, roomId: string): void {
    if (client.rooms.has(roomId)) {
      client.leave(roomId);
    }

    const room = this.rooms.get(roomId);

    if (room) {
      room.clients.delete(client.id);

      if (room.clients.size === 0) {
        this.rooms.delete(roomId);
      } else {
        room.lastActivity = new Date();
      }
    }

    client.emit('leaveRoom', { roomId });
    logger.log(`Client ${client.id} left room ${roomId}`);
  }
}
