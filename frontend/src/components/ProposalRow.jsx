import React from 'react'

export default function ProposalRow({ pr, isClientOwner, handleProposalAction, openChat }) {
  return (
    <div key={pr.id} className="proposal-row">
      <div>
        <strong>{pr.freelancer_name}</strong>
        <div>R$ {Number(pr.amount).toFixed(2)}</div>
        <p>{pr.cover_text}</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {isClientOwner && (
          <>
            <button className="button primary" onClick={() => handleProposalAction(pr.id, 'accepted')}>Aceitar</button>
            <button className="button ghost" onClick={() => handleProposalAction(pr.id, 'rejected')}>Rejeitar</button>
          </>
        )}
        <button className="button" onClick={() => openChat(pr.freelancer_id)}>Abrir chat</button>
      </div>
    </div>
  )
}
