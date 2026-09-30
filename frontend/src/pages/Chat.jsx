import { useEffect, useState, useRef } from 'react';

import { io } from 'socket.io-client';

import api from '../services/api';



export default function Chat() {

  const storedUser = localStorage.getItem('@LancerDev:user');

  const user = storedUser ? JSON.parse(storedUser) : null;



  const [conversations, setConversations] = useState([]);

  const [activeRoom, setActiveRoom] = useState(null);

  const [messages, setMessages] = useState([]);

  const [newMessage, setNewMessage] = useState('');

  const [loadingConversations, setLoadingConversations] = useState(true);

  const [loadingMessages, setLoadingMessages] = useState(false);



  const socketRef = useRef(null);

  const messagesEndRef = useRef(null);

  const activeRoomRef = useRef(null);



  useEffect(() => {

    socketRef.current = io('http\://localhost:3000', {

      auth: { token: localStorage.getItem('@LancerDev:token') }

    });



    socketRef.current.on('receive_message', (message) => {

      if (!activeRoomRef.current) return;

      if (Number(message.chatId) !== Number(activeRoomRef.current.id)) return;



      setMessages((prev) => {

        if (prev.some((msg) => msg.id === message.id)) return prev;

        return [...prev, message];

      });

    });



    async function loadConversations() {

      try {

        const response = await api.get('/chats/conversations');

        setConversations(response.data);

      } catch (error) {

        console.error('Erro ao buscar conversas:', error);

      } finally {

        setLoadingConversations(false);

      }

    }



    loadConversations();



    return () => {

      socketRef.current?.disconnect();

    };

  }, []);



  useEffect(() => {

    if (!activeRoom) {

      activeRoomRef.current = null;

      setMessages([]);

      return;

    }



    activeRoomRef.current = activeRoom;

    setMessages([]);



    socketRef.current?.emit('join_room', {
      roomId: activeRoom.id,
      userId: user?.id
    });



    async function loadMessages() {

      setLoadingMessages(true);



      try {

        const response = await api.get(`/chats/messages/${activeRoom.id}`);



        if (Number(activeRoomRef.current?.id) === Number(activeRoom.id)) {

          setMessages(response.data);

        }

      } catch (error) {

        console.error('Erro ao carregar mensagens:', error);

      } finally {

        setLoadingMessages(false);

      }

    }



    loadMessages();

  }, [activeRoom]);



  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  }, [messages]);



  function handleSendMessage() {

    const text = newMessage.trim();



    if (!text || !activeRoom || !socketRef.current) return;



    socketRef.current.emit('send_message', {

      roomId: activeRoom.id,

      text,

      senderId: user?.id

    });



    setNewMessage('');

  }



  function getInitials(name) {

    if (!name) return '?';



    return name

      .split(' ')

      .filter(Boolean)

      .slice(0, 2)

      .map((part) => part[0].toUpperCase())

      .join('');

  }



  function formatTime(date) {

    if (!date) return '';



    return new Date(date).toLocaleTimeString('pt-BR', {

      hour: '2-digit',

      minute: '2-digit'

    });

  }



  return (

    <div className="chat-page">

      <div className="chat-container">

        <aside className="chat-sidebar">

          <div className="sidebar-header">

            <div>

              <span className="section-label">COMUNICAÇÃO</span>

              <h2>Mensagens</h2>

            </div>



            <div className="conversation-count">

              {conversations.length}

            </div>

          </div>



          <div className="conversation-search">

            <span className="search-icon">⌕</span>

            <span>Suas conversas</span>

          </div>



          <div className="conversation-list">

            {loadingConversations ? (

              <div className="sidebar-feedback">

                <div className="loading-spinner" />

                <span>Carregando conversas...</span>

              </div>

            ) : conversations.length === 0 ? (

              <div className="sidebar-empty">

                <div className="empty-icon">✉</div>

                <strong>Nenhuma conversa</strong>

                <p>Quando você iniciar uma negociação, suas conversas aparecerão aqui.</p>

              </div>

            ) : (

              conversations.map((chat) => {

                const isActive = Number(activeRoom?.id) === Number(chat.id);



                return (

                  <button

                    key={chat.id}

                    type="button"

                    className={`conversation-item ${isActive ? 'active' : ''}`}

                    onClick={() => setActiveRoom(chat)}

                  >

                    <div className="avatar">

                      {getInitials(chat.otherParticipant?.name)}

                    </div>



                    <div className="conversation-info">

                      <div className="conversation-top">

                        <strong>

                          {chat.otherParticipant?.name || 'Participante'}

                        </strong>

                      </div>



                      <span className="conversation-project">

                        {chat.project?.title || 'Projeto relacionado'}

                      </span>



                      <span className="conversation-subtitle">

                        Clique para abrir a conversa

                      </span>

                    </div>



                    <span className="conversation-arrow">›</span>

                  </button>

                );

              })

            )}

          </div>



          <div className="sidebar-footer">

            <span className="status-dot" />

            <span>Comunicação do LancerDev</span>

          </div>

        </aside>



        <main className="chat-main">

          {activeRoom ? (

            <>

              <header className="chat-header">

                <div className="chat-contact">

                  <div className="avatar header-avatar">

                    {getInitials(activeRoom.otherParticipant?.name)}

                  </div>



                  <div>

                    <h3>

                      {activeRoom.otherParticipant?.name || 'Participante'}

                    </h3>

                    <span className="contact-status">

                      <span className="status-dot" />

                      Conversa sobre um projeto

                    </span>

                  </div>

                </div>



                <div className="project-label">

                  <span className="project-label-icon">⌘</span>

                  <div>

                    <span>PROJETO</span>

                    <strong>{activeRoom.project?.title || 'Projeto relacionado'}</strong>

                  </div>

                </div>

              </header>



              <div className="message-area">

                <div className="message-intro">

                  <span className="intro-line" />

                  <span>Início da conversa</span>

                  <span className="intro-line" />

                </div>



                {loadingMessages ? (

                  <div className="messages-loading">

                    <div className="loading-spinner" />

                    <span>Carregando mensagens...</span>

                  </div>

                ) : messages.length === 0 ? (

                  <div className="messages-empty">

                    <div className="empty-chat-icon">☰</div>

                    <h3>Comece uma conversa</h3>

                    <p>

                      Envie uma mensagem para alinhar os detalhes do projeto,

                      esclarecer dúvidas ou combinar os próximos passos.

                    </p>

                  </div>

                ) : (

                  <div className="messages-list">

                    {messages.map((msg) => {

                      const isMe = Number(msg.senderId) === Number(user?.id);



                      return (

                        <div

                          key={msg.id}

                          className={`message-row ${isMe ? 'mine' : 'theirs'}`}

                        >

                          {!isMe && (

                            <div className="message-avatar">

                              {getInitials(activeRoom.otherParticipant?.name)}

                            </div>

                          )}



                          <div className="message-content">

                            <div className="message-bubble">

                              <p>{msg.text}</p>

                            </div>

                            <span className="message-time">

                              {formatTime(msg.createdAt)}

                              {isMe && <span className="message-check">✓</span>}

                            </span>

                          </div>

                        </div>

                      );

                    })}

                    <div ref={messagesEndRef} />

                  </div>

                )}

              </div>



              <form

                className="message-form"

                onSubmit={(event) => {

                  event.preventDefault();

                  handleSendMessage();

                }}

              >

                <div className="message-input-wrapper">

                  <input

                    type="text"

                    placeholder="Escreva sua mensagem..."

                    value={newMessage}

                    onChange={(event) => setNewMessage(event.target.value)}

                    aria-label="Mensagem"

                  />



                  <button

                    type="submit"

                    className="send-button"

                    disabled={!newMessage.trim()}

                    aria-label="Enviar mensagem"

                  >

                    <span>Enviar</span>

                    <span className="send-icon">➤</span>

                  </button>

                </div>



                <div className="input-hint">

                  <span>↵</span>

                  Pressione Enter para enviar

                </div>

              </form>

            </>

          ) : (

            <div className="no-chat-selected">

              <div className="welcome-illustration">

                <div className="illustration-back" />

                <div className="illustration-card">

                  <span className="illustration-bubble bubble-one">•••</span>

                  <span className="illustration-bubble bubble-two">↗</span>

                  <span className="illustration-line line-one" />

                  <span className="illustration-line line-two" />

                </div>

              </div>



              <span className="section-label">LANCERDEV MENSAGENS</span>

              <h2>Seu espaço de colaboração</h2>

              <p>

                Selecione uma conversa para trocar mensagens e acompanhar

                os alinhamentos dos seus projetos.

              </p>



              <div className="welcome-tip">

                <span>✦</span>

                Mantenha a comunicação clara e organizada.

              </div>

            </div>

          )}

        </main>

      </div>



      <style>{`

        .chat-page {

          min-height: calc(100vh - 75px);

          padding: 32px 24px;

          background: #0c0d0f;

          color: #f5f5f5;

          box-sizing: border-box;

        }



        .chat-container {

          display: flex;

          width: 100%;

          max-width: 1320px;

          height: min(780px, calc(100vh - 140px));

          min-height: 560px;

          margin: 0 auto;

          overflow: hidden;

          background: #141619;

          border: 1px solid #292d32;

          border-radius: 18px;

          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.25);

        }



        .chat-sidebar {

          display: flex;

          flex-direction: column;

          width: 340px;

          min-width: 300px;

          background: #111315;

          border-right: 1px solid #292d32;

        }



        .sidebar-header {

          display: flex;

          align-items: center;

          justify-content: space-between;

          padding: 26px 24px 22px;

        }



        .section-label {

          color: #ff8a3d;

          font-size: 10px;

          font-weight: 800;

          letter-spacing: 1.8px;

        }



        .sidebar-header h2 {

          margin: 7px 0 0;

          color: #f5f5f5;

          font-size: 23px;

          font-weight: 750;

          letter-spacing: -0.7px;

        }



        .conversation-count {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 30px;

          height: 30px;

          border: 1px solid #45301f;

          border-radius: 9px;

          background: #281b12;

          color: #ff914d;

          font-size: 12px;

          font-weight: 700;

        }



        .conversation-search {

          display: flex;

          align-items: center;

          gap: 10px;

          margin: 0 18px 14px;

          padding: 12px 14px;

          border: 1px solid #292d32;

          border-radius: 9px;

          color: #777e87;

          background: #181b1f;

          font-size: 12px;

        }



        .search-icon {

          color: #ff914d;

          font-size: 20px;

          line-height: 12px;

        }



        .conversation-list {

          flex: 1;

          overflow-y: auto;

          padding: 0 12px 12px;

        }



        .conversation-item {

          display: flex;

          align-items: center;

          width: 100%;

          gap: 12px;

          margin-bottom: 7px;

          padding: 14px 12px;

          border: 1px solid transparent;

          border-radius: 11px;

          background: transparent;

          color: inherit;

          text-align: left;

          cursor: pointer;

          transition: background 0.2s, border-color 0.2s;

        }



        .conversation-item:hover {

          background: #1a1d20;

          border-color: #30343a;

        }



        .conversation-item.active {

          background: linear-gradient(110deg, rgba(255, 107, 0, 0.13), rgba(255, 107, 0, 0.04));

          border-color: rgba(255, 125, 43, 0.38);

        }



        .avatar {

          display: flex;

          flex-shrink: 0;

          align-items: center;

          justify-content: center;

          width: 43px;

          height: 43px;

          border: 1px solid #59402d;

          border-radius: 13px;

          background: linear-gradient(135deg, #382315, #201912);

          color: #ff9b5b;

          font-size: 13px;

          font-weight: 800;

        }



        .conversation-info {

          display: flex;

          flex: 1;

          flex-direction: column;

          min-width: 0;

          gap: 4px;

        }



        .conversation-top {

          display: flex;

          align-items: center;

          justify-content: space-between;

        }



        .conversation-top strong {

          overflow: hidden;

          color: #e9e9e9;

          font-size: 13px;

          font-weight: 700;

          text-overflow: ellipsis;

          white-space: nowrap;

        }



        .conversation-project {

          overflow: hidden;

          color: #ff9a59;

          font-size: 11px;

          text-overflow: ellipsis;

          white-space: nowrap;

        }



        .conversation-subtitle {

          overflow: hidden;

          color: #747b84;

          font-size: 10px;

          text-overflow: ellipsis;

          white-space: nowrap;

        }



        .conversation-arrow {

          color: #777e87;

          font-size: 23px;

        }



        .sidebar-feedback,

        .sidebar-empty {

          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content: center;

          padding: 45px 20px;

          color: #818891;

          text-align: center;

        }



        .sidebar-feedback {

          gap: 12px;

          font-size: 12px;

        }



        .sidebar-empty {

          gap: 9px;

        }



        .empty-icon {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 48px;

          height: 48px;

          margin-bottom: 5px;

          border: 1px solid #30343a;

          border-radius: 15px;

          background: #191c20;

          color: #ff914d;

          font-size: 22px;

        }



        .sidebar-empty strong {

          color: #d7d9dc;

          font-size: 13px;

        }



        .sidebar-empty p {

          max-width: 220px;

          margin: 0;

          color: #777e87;

          font-size: 11px;

          line-height: 1.6;

        }



        .sidebar-footer {

          display: flex;

          align-items: center;

          gap: 8px;

          padding: 17px 22px;

          border-top: 1px solid #292d32;

          color: #747b84;

          font-size: 10px;

        }



        .status-dot {

          width: 7px;

          height: 7px;

          border-radius: 50%;

          background: #43bd83;

          box-shadow: 0 0 8px rgba(67, 189, 131, 0.35);

        }



        .chat-main {

          display: flex;

          flex: 1;

          flex-direction: column;

          min-width: 0;

          background: #151719;

        }



        .chat-header {

          display: flex;

          align-items: center;

          justify-content: space-between;

          min-height: 88px;

          padding: 16px 28px;

          border-bottom: 1px solid #292d32;

          background: #141619;

        }



        .chat-contact {

          display: flex;

          align-items: center;

          gap: 13px;

        }



        .header-avatar {

          width: 45px;

          height: 45px;

        }



        .chat-contact h3 {

          margin: 0 0 6px;

          color: #f2f2f2;

          font-size: 14px;

          font-weight: 750;

        }



        .contact-status {

          display: flex;

          align-items: center;

          gap: 7px;

          color: #858c94;

          font-size: 11px;

        }



        .contact-status .status-dot {

          width: 6px;

          height: 6px;

        }



        .project-label {

          display: flex;

          align-items: center;

          gap: 10px;

          max-width: 260px;

          padding: 9px 13px;

          border: 1px solid #30343a;

          border-radius: 10px;

          background: #1a1d20;

        }



        .project-label-icon {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 31px;

          height: 31px;

          border-radius: 8px;

          background: #302015;

          color: #ff9b5b;

          font-size: 17px;

        }



        .project-label div {

          display: flex;

          flex-direction: column;

          min-width: 0;

          gap: 3px;

        }



        .project-label span:not(.project-label-icon) {

          color: #858c94;

          font-size: 9px;

          font-weight: 700;

          letter-spacing: 1px;

        }



        .project-label strong {

          overflow: hidden;

          color: #e4e5e6;

          font-size: 11px;

          text-overflow: ellipsis;

          white-space: nowrap;

        }



        .message-area {

          display: flex;

          flex: 1;

          flex-direction: column;

          min-height: 0;

          overflow: hidden;

          background-image: radial-gradient(rgba(255, 255, 255, 0.025) 0.7px, transparent 0.7px);

          background-size: 20px 20px;

        }



        .message-intro {

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 13px;

          padding: 22px 20px 12px;

          color: #686f77;

          font-size: 10px;

          letter-spacing: 0.4px;

        }



        .intro-line {

          width: 45px;

          height: 1px;

          background: #30343a;

        }



        .messages-list {

          display: flex;

          flex: 1;

          flex-direction: column;

          gap: 18px;

          overflow-y: auto;

          padding: 20px 28px 24px;

        }



        .message-row {

          display: flex;

          align-items: flex-end;

          gap: 9px;

          width: 100%;

        }



        .message-row.mine {

          justify-content: flex-end;

        }



        .message-row.theirs {

          justify-content: flex-start;

        }



        .message-avatar {

          display: flex;

          flex-shrink: 0;

          align-items: center;

          justify-content: center;

          width: 28px;

          height: 28px;

          border: 1px solid #59402d;

          border-radius: 9px;

          background: #302015;

          color: #ff9b5b;

          font-size: 9px;

          font-weight: 800;

        }



        .message-content {

          display: flex;

          flex-direction: column;

          max-width: min(68%, 560px);

          gap: 6px;

        }



        .message-row.mine .message-content {

          align-items: flex-end;

        }



        .message-row.theirs .message-content {

          align-items: flex-start;

        }



        .message-bubble {

          padding: 12px 15px;

          border: 1px solid #34383e;

          border-radius: 13px 13px 13px 3px;

          background: #22262a;

          color: #e8e9ea;

          overflow-wrap: anywhere;

        }



        .message-row.mine .message-bubble {

          border-color: #d95c0a;

          border-radius: 13px 13px 3px 13px;

          background: linear-gradient(135deg, #ff812d, #e9650b);

          color: #fff;

        }



        .message-bubble p {

          margin: 0;

          font-size: 13px;

          line-height: 1.55;

          white-space: pre-wrap;

        }



        .message-time {

          display: flex;

          align-items: center;

          gap: 5px;

          color: #777e87;

          font-size: 9px;

        }



        .message-row.mine .message-time {

          color: #92979d;

        }



        .message-check {

          color: #ff9b5b;

          font-size: 11px;

          font-weight: 800;

        }



        .messages-loading,

        .messages-empty {

          display: flex;

          flex: 1;

          flex-direction: column;

          align-items: center;

          justify-content: center;

          color: #818891;

          text-align: center;

        }



        .messages-loading {

          gap: 12px;

          font-size: 12px;

        }



        .messages-empty {

          padding: 25px;

        }



        .empty-chat-icon {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 58px;

          height: 58px;

          margin-bottom: 17px;

          border: 1px solid #3a3028;

          border-radius: 18px;

          background: #241a13;

          color: #ff914d;

          font-size: 25px;

        }



        .messages-empty h3 {

          margin: 0 0 8px;

          color: #e5e6e7;

          font-size: 16px;

        }



        .messages-empty p {

          max-width: 390px;

          margin: 0;

          color: #858c94;

          font-size: 12px;

          line-height: 1.7;

        }



        .message-form {

          padding: 17px 25px 13px;

          border-top: 1px solid #292d32;

          background: #141619;

        }



        .message-input-wrapper {

          display: flex;

          align-items: center;

          gap: 10px;

          padding: 6px;

          border: 1px solid #363b41;

          border-radius: 12px;

          background: #1c1f23;

          transition: border-color 0.2s, box-shadow 0.2s;

        }



        .message-input-wrapper:focus-within {

          border-color: #b9571d;

          box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.08);

        }



        .message-input-wrapper input {

          flex: 1;

          min-width: 0;

          padding: 10px 12px;

          border: 0;

          outline: 0;

          background: transparent;

          color: #f3f3f3;

          font-family: inherit;

          font-size: 13px;

        }



        .message-input-wrapper input::placeholder {

          color: #747b84;

        }



        .send-button {

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 9px;

          min-height: 40px;

          padding: 0 17px;

          border: 0;

          border-radius: 8px;

          background: linear-gradient(135deg, #ff812d, #e9650b);

          color: #fff;

          font-family: inherit;

          font-size: 12px;

          font-weight: 750;

          cursor: pointer;

          transition: opacity 0.2s, transform 0.2s;

        }



        .send-button:hover:not(:disabled) {

          transform: translateY(-1px);

        }



        .send-button:disabled {

          opacity: 0.45;

          cursor: not-allowed;

        }



        .send-icon {

          font-size: 15px;

        }



        .input-hint {

          display: flex;

          align-items: center;

          gap: 6px;

          padding: 9px 4px 0;

          color: #69717a;

          font-size: 10px;

        }



        .input-hint span {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 17px;

          height: 17px;

          border: 1px solid #41464d;

          border-radius: 4px;

          color: #a1a6ac;

          font-size: 11px;

        }



        .no-chat-selected {

          display: flex;

          flex: 1;

          flex-direction: column;

          align-items: center;

          justify-content: center;

          padding: 35px;

          text-align: center;

        }



        .welcome-illustration {

          position: relative;

          display: flex;

          align-items: center;

          justify-content: center;

          width: 180px;

          height: 150px;

          margin-bottom: 28px;

        }



        .illustration-back {

          position: absolute;

          width: 125px;

          height: 105px;

          transform: rotate(-9deg);

          border: 1px solid #5b3823;

          border-radius: 22px;

          background: #211811;

        }



        .illustration-card {

          position: relative;

          width: 125px;

          height: 105px;

          transform: rotate(5deg);

          border: 1px solid #70401f;

          border-radius: 22px;

          background: linear-gradient(145deg, #302015, #1c1916);

          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.25);

        }



        .illustration-bubble {

          position: absolute;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 10px;

          font-weight: 800;

        }



        .bubble-one {

          top: 20px;

          left: 19px;

          width: 52px;

          height: 30px;

          background: #ff812d;

          color: white;

          letter-spacing: 2px;

        }



        .bubble-two {

          right: 15px;

          bottom: 18px;

          width: 35px;

          height: 31px;

          border: 1px solid #70401f;

          background: #211811;

          color: #ff9b5b;

          font-size: 18px;

        }



        .illustration-line {

          position: absolute;

          left: 20px;

          height: 4px;

          border-radius: 5px;

          background: #59402d;

        }



        .line-one {

          bottom: 29px;

          width: 43px;

        }



        .line-two {

          bottom: 18px;

          width: 28px;

        }



        .no-chat-selected h2 {

          margin: 10px 0;

          color: #f1f1f1;

          font-size: 25px;

          font-weight: 750;

          letter-spacing: -0.8px;

        }



        .no-chat-selected > p {

          max-width: 430px;

          margin: 0;

          color: #858c94;

          font-size: 13px;

          line-height: 1.8;

        }



        .welcome-tip {

          display: flex;

          align-items: center;

          gap: 8px;

          margin-top: 25px;

          padding: 11px 15px;

          border: 1px solid #3d3025;

          border-radius: 9px;

          background: #201912;

          color: #c2a58e;

          font-size: 11px;

        }



        .welcome-tip span {

          color: #ff914d;

        }



        .loading-spinner {

          width: 19px;

          height: 19px;

          border: 2px solid #393d42;

          border-top-color: #ff812d;

          border-radius: 50%;

          animation: chat-spin 0.7s linear infinite;

        }



        @keyframes chat-spin {

          to {

            transform: rotate(360deg);

          }

        }



        @media (max-width: 850px) {

          .chat-page {

            padding: 18px 12px;

          }



          .chat-container {

            height: calc(100vh - 110px);

            min-height: 500px;

          }



          .chat-sidebar {

            width: 290px;

            min-width: 250px;

          }



          .chat-header {

            padding: 14px 18px;

          }



          .project-label {

            max-width: 180px;

          }



          .messages-list {

            padding-right: 18px;

            padding-left: 18px;

          }

        }



        @media (max-width: 620px) {

          .chat-page {

            padding: 10px 8px;

            min-height: calc(100vh - 60px);

          }



          .chat-container {

            position: relative;

            height: calc(100vh - 80px);

            min-height: 480px;

            border-radius: 13px;

          }



          .chat-sidebar {

            width: 100%;

            min-width: 0;

            border-right: 0;

          }



          .chat-container:has(.chat-main .chat-header) .chat-sidebar {

            display: none;

          }



          .chat-main {

            width: 100%;

          }



          .chat-header {

            min-height: 75px;

            padding: 12px;

          }



          .header-avatar {

            width: 39px;

            height: 39px;

          }



          .chat-contact {

            gap: 9px;

          }



          .chat-contact h3 {

            max-width: 145px;

            overflow: hidden;

            font-size: 12px;

            text-overflow: ellipsis;

            white-space: nowrap;

          }



          .contact-status {

            font-size: 9px;

          }



          .project-label {

            max-width: 135px;

            gap: 7px;

            padding: 7px;

          }



          .project-label-icon {

            width: 26px;

            height: 26px;

          }



          .project-label strong {

            max-width: 85px;

            font-size: 9px;

          }



          .message-form {

            padding: 12px 10px 9px;

          }



          .send-button {

            min-height: 38px;

            padding: 0 12px;

          }



          .send-button span:first-child {

            display: none;

          }



          .message-content {

            max-width: 82%;

          }



          .messages-list {

            gap: 14px;

            padding: 15px 11px;

          }



          .no-chat-selected {

            padding: 20px;

          }



          .no-chat-selected h2 {

            font-size: 21px;

          }

        }

      `}</style>

    </div>

  );

}