import React from 'react'

export default function ChatPanel({ chatContacts, chatPartnerId, setChatPartnerId, chatMessages, chatText, setChatText, sendChatMessage, fetchChatHistory, chatConnected, currentAppUserId }) {
  return (
    <section className="workspace chat-container">
      <aside className="chat-sidebar">
        <h3>Contatos</h3>
        {chatContacts.length === 0 ? (
          <div className="empty-state">Nenhum contato de propostas encontrado.</div>
        ) : (
          chatContacts.map((c) => (
            <div key={c.id} className="chat-contact" onClick={async () => { setChatPartnerId(c.id); await fetchChatHistory(c.id); }}>
              <div style={{flex:1}}>
                <strong>{c.name || c.email}</strong>
                <div style={{fontSize:12, color:'#64748b'}}>{c.role}</div>
              </div>
              <div style={{fontSize:12, color:'#94a3b8'}}>{/* placeholder for last message time */}</div>
            </div>
          ))
        )}
      </aside>

      <div className="chat-main">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h3>Chat interno</h3>
            <p style={{margin:0}}>Converse com seu cliente ou freelancer sem expor contatos externos.</p>
          </div>
          <div style={{fontSize:14,color:'#64748b'}}>{chatConnected ? 'Conectado' : 'Offline'}</div>
        </div>

        <div className="chat-feed">
          {chatPartnerId === '' ? (
            <div className="empty-state">Selecione um contato à esquerda para iniciar.</div>
          ) : chatMessages.length === 0 ? (
            <div className="empty-state">Nenhuma mensagem ainda. Envie a primeira mensagem.</div>
          ) : (
            chatMessages.map((message, index) => (
              <div key={index} className={`chat-bubble ${message.senderId === currentAppUserId ? 'sent' : 'received'}`}>
                <div className="chat-meta">{message.senderName} • {new Date(message.createdAt).toLocaleString()}</div>
                <p>{message.text}</p>
              </div>
            ))
          )}
        </div>

        <form className="chat-form" onSubmit={(event) => { event.preventDefault(); if (!chatPartnerId) return; if (!chatText.trim()) return; sendChatMessage() }}>
          <textarea value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Escreva sua mensagem..." />
          <button className="button primary" type="submit">Enviar</button>
        </form>
      </div>
    </section>
  )
}
