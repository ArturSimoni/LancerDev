import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';

export default function Chat() {
  const user = localStorage.getItem('@LancerDev:user')
    ? JSON.parse(localStorage.getItem('@LancerDev:user'))
    : null;

  const [conversations, setConversations] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeRoomRef = useRef(null); // ADICIONADO: ref para acessar activeRoom dentro do socket

  useEffect(() => {
    socketRef.current = io('http://localhost:3000', {
      auth: { token: localStorage.getItem('@LancerDev:token') }
    });

    socketRef.current.on('receive_message', (message) => {
      if (!activeRoomRef.current) return;
      if (Number(message.chatId) !== Number(activeRoomRef.current.id)) return;
      setMessages((prev) => {
        if (prev.some(msg => msg.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    async function loadConversations() {
      try {
        const response = await api.get('/chats/conversations');
        setConversations(response.data);
      } catch (error) {
        console.error('Erro ao buscar conversas:', error);
      }
    }
    loadConversations();

    return () => { socketRef.current.disconnect(); };
  }, []);

  useEffect(() => {
    if (!activeRoom) return;

    activeRoomRef.current = activeRoom;

    socketRef.current.emit('join_room', { roomId: activeRoom.id });

    async function loadMessages() {
      try {
        const response = await api.get(`/chats/messages/${activeRoom.id}`);
        setMessages(response.data);
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
      }
    }
    loadMessages();
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSendMessage() {
    if (!newMessage.trim() || !activeRoom) return;
    socketRef.current.emit('send_message', {
      roomId: activeRoom.id,
      text: newMessage,
      senderId: user?.id
    });
    setNewMessage('');
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h3 style={styles.sidebarTitle}>Suas Conversas</h3>
        {conversations.length === 0 ? (
          <p style={styles.emptyText}>Nenhum chat ativo no momento.</p>
        ) : (
          conversations.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setActiveRoom(chat)}
              style={{
                ...styles.conversationItem,
                backgroundColor: activeRoom?.id === chat.id ? '#ff6b0022' : '#222',
                borderColor: activeRoom?.id === chat.id ? '#ff6b00' : '#333'
              }}
            >
              <strong>{chat.project?.title || 'Projeto Relacionado'}</strong>
              <span style={styles.chatParticipant}>Falar com: {chat.otherParticipant?.name}</span>
            </div>
          ))
        )}
      </div>

      <div style={styles.chatWindow}>
        {activeRoom ? (
          <>
            <div style={styles.chatHeader}>
              <h4 style={{ margin: 0 }}>{activeRoom.project?.title}</h4>
              <p style={{ margin: '4px 0 0 0', color: '#aaa', fontSize: '13px' }}>
                Conversando com: {activeRoom.otherParticipant?.name}
              </p>
            </div>

            <div style={styles.messageBox}>
              {messages.map((msg) => {
                const isMe = Number(msg.senderId) === Number(user?.id);
                return (
                  <div
                    key={msg.id}
                    style={{ ...styles.messageRow, justifyContent: isMe ? 'flex-end' : 'flex-start' }}
                  >
                    <div style={{
                      ...styles.messageBubble,
                      backgroundColor: isMe ? '#ff6b00' : '#2d2d2d',
                      borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0'
                    }}>
                      <p style={styles.messageText}>{msg.text}</p>
                      <span style={styles.messageTime}>
                        {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={styles.inputArea}>
              <input
                type="text"
                placeholder="Digite sua mensagem aqui..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                style={styles.input}
              />
              <button onClick={handleSendMessage} style={styles.sendBtn}>Enviar</button>
            </div>
          </>
        ) : (
          <div style={styles.noActiveChat}>
            <p>Selecione uma conversa ao lado para iniciar o bate-papo.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', maxWidth: '1200px', margin: '30px auto', height: '75vh', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden', color: '#fff' },
  sidebar: { width: '30%', borderRight: '1px solid #333', backgroundColor: '#111', padding: '20px', overflowY: 'auto' },
  sidebarTitle: { fontSize: '18px', margin: '0 0 20px 0', color: '#ff6b00' },
  emptyText: { color: '#666', fontSize: '14px', fontStyle: 'italic' },
  conversationItem: { padding: '15px', borderRadius: '6px', marginBottom: '10px', cursor: 'pointer', border: '1px solid', display: 'flex', flexDirection: 'column', gap: '5px', transition: 'all 0.2s' },
  chatParticipant: { fontSize: '12px', color: '#aaa' },
  chatWindow: { width: '70%', display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e1e' },
  chatHeader: { padding: '15px 20px', borderBottom: '1px solid #333', backgroundColor: '#151515' },
  messageBox: { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' },
  messageRow: { display: 'flex', width: '100%' },
  messageBubble: { padding: '12px 16px', maxWidth: '65%', color: '#fff' },
  messageText: { margin: '0 0 5px 0', fontSize: '14px', lineHeight: '1.4' },
  messageTime: { fontSize: '10px', color: '#ccc', display: 'block', textAlign: 'right' },
  inputArea: { padding: '15px 20px', display: 'flex', gap: '10px', borderTop: '1px solid #333', backgroundColor: '#151515' },
  input: { flex: 1, backgroundColor: '#2d2d2d', border: '1px solid #444', borderRadius: '4px', padding: '12px', color: '#fff', outline: 'none' },
  sendBtn: { backgroundColor: '#ff6b00', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  noActiveChat: { display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', color: '#666', fontSize: '16px' }
};