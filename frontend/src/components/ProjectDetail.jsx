import React from 'react'
import ProposalRow from './ProposalRow'
import KanbanColumn from './KanbanColumn'

export default function ProjectDetail({ project, proposals, milestones, onClose, refresh, handleProposalAction, moveMilestoneStatus, openChat, currentAppUserId }) {
  return (
    <section className="workspace project-detail">
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>{project.title}</h2>
            <p>{project.description}</p>
          </div>
          <div>
            <button className="button ghost" onClick={onClose}>Fechar</button>
            <button className="button" onClick={refresh}>Atualizar</button>
          </div>
        </div>

        <div style={{display:'flex',gap:16}}>
          <div style={{flex:1}}>
            <h3>Propostas</h3>
            {proposals.length === 0 ? (
              <div className="empty-state">Nenhuma proposta enviada ainda.</div>
            ) : (
              <div>
                {proposals.map((pr) => (
                  <ProposalRow key={pr.id} pr={pr} isClientOwner={project.client_id === currentAppUserId} handleProposalAction={handleProposalAction} openChat={openChat} />
                ))}
              </div>
            )}
          </div>

          <div style={{width:420}}>
            <h3>Quadro Kanban (Marcos)</h3>
            <div className="kanban">
              {['pending','approved','completed'].map((status) => (
                <KanbanColumn key={status} status={status} milestones={milestones.filter((m) => m.status === status)} moveMilestoneStatus={moveMilestoneStatus} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
