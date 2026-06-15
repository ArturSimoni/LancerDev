import React from 'react'

export default function Nav({ view, setView, isClient, isFreelancer }) {
  return (
    <nav className="app-nav">
      <button className={view === 'dashboard' ? 'nav-button active' : 'nav-button'} onClick={() => setView('dashboard')}>Dashboard</button>
      <button className={view === 'projects' ? 'nav-button active' : 'nav-button'} onClick={() => setView('projects')}>Projetos</button>
      {(isFreelancer || isClient) && (
        <button className={view === 'chat' ? 'nav-button active' : 'nav-button'} onClick={() => setView('chat')}>Chat</button>
      )}
      {isFreelancer && (
        <button className={view === 'proposals' ? 'nav-button active' : 'nav-button'} onClick={() => setView('proposals')}>Propostas</button>
      )}
      <button className={view === 'profile' ? 'nav-button active' : 'nav-button'} onClick={() => setView('profile')}>Perfil</button>
    </nav>
  )
}
