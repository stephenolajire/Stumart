import React, { useState } from 'react';
import styles from './css/Chat.module.css';

const Chat = ({ vendor }) => {
  const [messages] = useState([
    {
      id: 1,
      sender: 'customer',
      name: 'John Doe',
      message: 'Hello, I need information about your services',
      timestamp: '2025-04-22T10:30:00Z'
    },
    {
      id: 2,
      sender: 'vendor',
      name: vendor?.business_name,
      message: 'Hi! How can I help you today?',
      timestamp: '2025-04-22T10:31:00Z'
    }
  ]);

  const [newMessage, setNewMessage] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    // Handle sending message
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h2>Messages</h2>
      </div>

      <div className={styles.chatContent}>
        <div className={styles.messagesList}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.messageItem} ${
                msg.sender === 'vendor' ? styles.sent : styles.received
              }`}
            >
              <span className={styles.sender}>{msg.name}</span>
              <p className={styles.messageText}>{msg.message}</p>
              <span className={styles.timestamp}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className={styles.messageForm}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className={styles.messageInput}
          />
          <button type="submit" className={styles.sendButton}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;