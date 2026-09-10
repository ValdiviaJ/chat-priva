export interface Room {
  id: string;
  code: string;
  created_at: string;
  last_activity?: string;
}

export interface Participant {
  id: string;
  room_id: string;
  client_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: Room;
        Insert: {
          id?: string;
          code: string;
          created_at?: string;
          last_activity?: string;
        };
        Update: Partial<Room>;
      };
      participants: {
        Row: Participant;
        Insert: {
          id?: string;
          room_id: string;
          client_id: string;
          joined_at?: string;
        };
        Update: Partial<Participant>;
      };
      messages: {
        Row: Message;
        Insert: {
          id?: string;
          room_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: Partial<Message>;
      };
    };
  };
}
