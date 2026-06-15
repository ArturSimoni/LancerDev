import React from 'react'

export default function ProjectCard({ project, clientName, onClientClick, onOpenDetail, isClient, isFreelancer, currentAppUserId }) {
  return (
    <article className="project-card" key={project.id}>
      <div className="project-row">
        <div>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
        </div>
        <span className={`status-pill status-${project.status}`}>{project.status.replace('_', ' ')}</span>
      </div>
      <div className="project-meta">
        <span className="client-link" style={{cursor:'pointer',color:'#0ea5e9'}} onClick={() => onClientClick(project.client_id)}>{clientName || `Cliente #${project.client_id}`}</span>
        <strong>R$ {Number(project.budget).toFixed(2)}</strong>
      </div>
      <div style={{display:'flex',gap:8,marginTop:12}}>
        <button className="button" onClick={() => onOpenDetail(project)}>Acompanhar / Kanban</button>
        {isClient && project.client_id === currentAppUserId && (
          <button className="button secondary" onClick={() => onOpenDetail(project)}>Ver propostas</button>
        )}
        {isFreelancer && (
          <button className="button ghost" onClick={() => onOpenDetail(project)}>Enviar proposta</button>
        )}
      </div>
    </article>
  )
}
