import React from 'react'
import ProjectCard from './ProjectCard'

export default function ProjectList({ projects, clientMap, onClientClick, onOpenDetail, isClient, isFreelancer, currentAppUserId }) {
  if (!projects || projects.length === 0) return <div className="empty-state">Não há projetos cadastrados ainda.</div>
  return (
    <div className="project-list">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          clientName={clientMap.get(project.client_id)}
          onClientClick={onClientClick}
          onOpenDetail={onOpenDetail}
          isClient={isClient}
          isFreelancer={isFreelancer}
          currentAppUserId={currentAppUserId}
        />
      ))}
    </div>
  )
}
