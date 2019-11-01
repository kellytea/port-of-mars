interface ChatMessage {
  sender: string;
  content: string;
}

class ChatModel {
  private messages: ChatMessage[];

  constructor() {
    this.messages = [];
  }

  addEntry(message: ChatMessage) {
    this.messages.push(message);
  }

  get chat() {
    return this.messages;
  }
}

export { ChatModel, ChatMessage };
