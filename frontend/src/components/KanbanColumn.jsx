import React from 'react'

export default function KanbanColumn({ status, milestones, moveMilestoneStatus }) {
  return (
    <div className="kanban-column">
      <h4>{status.replace('_',' ')}</h4>
      {milestones.map((m) => (
        <div key={m.id} className="kanban-card">
          <strong>{m.title}</strong>
          <div>{m.description}</div>
          <div>R$ {Number(m.amount).toFixed(2)}</div>
          <div style={{display:'flex',gap:8,marginTop:8}}>
            {m.status !== 'approved' && <button className="button" onClick={() => moveMilestoneStatus(m.id, 'approved')}>Aprovar</button>}
            {m.status !== 'completed' && <button className="button" onClick={() => moveMilestoneStatus(m.id, 'completed')}>Marcar como concluído</button>}
            {m.status !== 'pending' && <button className="button ghost" onClick={() => moveMilestoneStatus(m.id, 'pending')}>Voltar a pendente</button>}
          </div>
        </div>
      ))}
    </div>
  )
}
