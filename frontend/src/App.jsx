import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { api } from './services/api.js'
import { supabase } from './utils/supabase/client.js'
import { getSession, signIn, signOut, signUp } from './utils/supabase/auth.js'

import Nav from './components/Nav'
import ProjectList from './components/ProjectList'
import ProjectDetail from './components/ProjectDetail'
import GithubForm from './components/GithubForm'
import ChatPanel from './components/ChatPanel'
import ProfileView from './components/ProfileView'

export default function App() {
  const socketRef = useRef(null)

  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [profileUser, setProfileUser] = useState(null)
  const [view, setView] = useState('dashboard')
  const [statusMessage, setStatusMessage] = useState('')

  // profile editing
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', bio: '', hourly_rate: '' })

  // github form
  const [githubForm, setGithubForm] = useState({ repo_url: '', title: '', description: '' })
  const [githubProjects, setGithubProjects] = useState([])

  // project detail
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectProposals, setProjectProposals] = useState([])
  const [projectMilestones, setProjectMilestones] = useState([])

  // chat
  const [chatContacts, setChatContacts] = useState([])
  const [chatPartnerId, setChatPartnerId] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [chatText, setChatText] = useState('')
  const [chatConnected, setChatConnected] = useState(false)

  const currentAppUserId = user?.id
  const isClient = user?.role === 'client'
  const isFreelancer = user?.role === 'freelancer'
  const userName = user?.name || user?.email || 'Visitante'
  const userRole = user?.role || 'visitor'

  // load minimal data
  const loadData = useCallback(async () => {
    try {
      const [usersData, projectsData] = await Promise.all([api.getUsers(), api.getProjects()])
      setUsers(usersData)
      setProjects(projectsData)
      // derive chat contacts from proposals (best-effort)
      const contacts = new Map()
      for (const p of projectsData) {
        const client = usersData.find((u) => u.id === p.client_id)
        if (client) contacts.set(client.id, client)
      }
      setChatContacts(Array.from(contacts.values()))
      return { usersData, projectsData }
    } catch (err) {
      console.error('loadData error', err)
      setStatusMessage('Erro ao carregar dados do backend')
      return { usersData: [], projectsData: [] }
    }
  }, [])

  // create backend profile if missing
  const createBackendProfile = useCallback(async (sessionUser, loadedUsers = []) => {
    if (!sessionUser?.email) return null
    const exists = loadedUsers.find((u) => u.email === sessionUser.email) || users.find((u) => u.email === sessionUser.email)
    if (exists) return exists
    try {
      const created = await api.createUser({ name: sessionUser.user_metadata?.name || sessionUser.email, email: sessionUser.email, role: sessionUser.user_metadata?.role || 'client' })
      setUsers((prev) => [created, ...prev])
      return created
    } catch (err) {
      console.warn('createBackendProfile failed', err)
      return null
    }
  }, [users])

  // websocket connect
  const connectWebSocket = useCallback(() => {
    if (!currentAppUserId) return
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const socket = new WebSocket(`${protocol}://${window.location.hostname}:3000/chat?userId=${currentAppUserId}`)

    socket.addEventListener('open', () => {
      setChatConnected(true)
      setStatusMessage('Conectado ao chat')
    })

    socket.addEventListener('message', (e) => {
      try {
        const payload = JSON.parse(e.data)
        if (payload.type === 'message') {
          const m = payload.message
          setChatMessages((prev) => [...prev, { id: m.id, senderId: m.from_user_id, receiverId: m.to_user_id, senderName: m.sender_name, text: m.text, createdAt: m.created_at }])
        }
      } catch (err) {
        console.error('ws msg error', err)
      }
    })

    socket.addEventListener('close', () => { setChatConnected(false); socketRef.current = null })
    socket.addEventListener('error', () => { setChatConnected(false); socketRef.current = null })
    socketRef.current = socket
  }, [currentAppUserId])

  const disconnectWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
      setChatConnected(false)
    }
  }, [])

  useEffect(() => {
    let authListener
    const init = async () => {
      const { data } = await getSession()
      const sessionData = data?.session
      setSession(sessionData)
      setUser(sessionData?.user ?? null)
      if (sessionData?.access_token) localStorage.setItem('token', sessionData.access_token)
      const loaded = await loadData()
      await createBackendProfile(sessionData?.user, loaded.usersData)
    }
    init()

    authListener = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.access_token) localStorage.setItem('token', s.access_token)
      else localStorage.removeItem('token')
      const loaded = await loadData()
      await createBackendProfile(s?.user, loaded.usersData)
    })

    return () => { authListener?.data?.subscription?.unsubscribe?.(); disconnectWebSocket() }
  }, [createBackendProfile, disconnectWebSocket, loadData])

  useEffect(() => { if (session && currentAppUserId && !socketRef.current) connectWebSocket() }, [session, currentAppUserId, connectWebSocket])

  // basic handlers
  const openProjectDetail = async (project) => {
    setSelectedProject(project)
    setView('project_detail')
    try {
      const proposals = await api.getProposals(project.id)
      setProjectProposals(proposals)
    } catch (e) { setProjectProposals([]) }
    try {
      const milestones = await api.getMilestones(project.id)
      setProjectMilestones(milestones)
    } catch (e) { setProjectMilestones([]) }
  }

  const fetchChatHistory = useCallback(async (partnerId) => {
    if (!currentAppUserId) return
    try {
      const history = await api.getChatMessages(currentAppUserId, partnerId)
      const mapped = history.map((m) => ({ id: m.id, senderId: m.from_user_id, receiverId: m.to_user_id, senderName: m.sender_name, text: m.text, createdAt: m.created_at }))
      setChatMessages(mapped)
    } catch (err) {
      console.error(err)
    }
  }, [currentAppUserId])

  const sendChatMessage = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) { setStatusMessage('Chat offline'); return }
    if (!chatPartnerId) return
    const text = chatText.trim()
    if (!text) return
    const payload = { type: 'message', fromId: currentAppUserId, toId: Number(chatPartnerId), senderName: userName, text }
    socketRef.current.send(JSON.stringify(payload))
    setChatMessages((prev) => [...prev, { senderId: currentAppUserId, senderName: userName, receiverId: Number(chatPartnerId), text, createdAt: new Date().toISOString() }])
    setChatText('')
  }

  // profile and experiences
  const saveProfile = async (e) => {
    e.preventDefault()
    if (!profileUser) return
    try {
      const updated = await api.updateUser(profileUser.id, { name: profileForm.name, bio: profileForm.bio, hourly_rate: profileForm.hourly_rate })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setProfileUser(updated)
      setEditingProfile(false)
      setStatusMessage('Perfil atualizado')
    } catch (err) {
      console.error(err)
      setStatusMessage('Erro ao salvar perfil')
    }
  }

  const createExperience = async (userId, data) => { const created = await api.createExperience(userId, data); const refreshed = await api.getUser(userId); setProfileUser(refreshed); return created }
  const updateExperience = async (id, data) => { const updated = await api.updateExperience(id, data); if (profileUser) setProfileUser(await api.getUser(profileUser.id)); return updated }
  const deleteExperience = async (id) => { await api.deleteExperience(id); if (profileUser) setProfileUser(await api.getUser(profileUser.id)); return true }

  // open profile
  const openProfile = async (userId) => {
    try {
      const p = await api.getUser(userId)
      setProfileUser(p)
      setProfileForm({ name: p.name || '', bio: p.bio || '', hourly_rate: p.hourly_rate || '' })
      setView('profile')
    } catch (err) {
      setStatusMessage('Erro ao carregar perfil')
    }
  }

  // UI helpers
  const totalFreelancers = useMemo(() => users.filter((u) => u.role === 'freelancer').length, [users])
  const totalClients = useMemo(() => users.filter((u) => u.role === 'client').length, [users])
  const openProjects = useMemo(() => projects.filter((p) => p.status === 'open').length, [projects])

  return (
    <div className={`app-shell ${isClient ? 'role-client' : isFreelancer ? 'role-freelancer' : ''}`}>
      <header className="topbar">
        <div>
          <div className="brand">LancerDev</div>
          <div className="subtitle">{userName} <span className="role-badge">{userRole}</span></div>
        </div>
        <button className="button ghost" onClick={async () => { await signOut(); setSession(null); setUser(null); disconnectWebSocket() }}>Logout</button>
      </header>

      <div className="topbar-sub"><Nav view={view} setView={setView} isClient={isClient} isFreelancer={isFreelancer} /></div>

      <main className="main-grid">
        {view === 'dashboard' && (
          <section className="hero-panel">
            <div><span className="eyebrow">Painel</span><h1>Bem-vindo</h1></div>
            <div className="hero-actions">
              <div className="hero-card"><span>Clientes</span><strong>{totalClients}</strong></div>
              <div className="hero-card"><span>Freelancers</span><strong>{totalFreelancers}</strong></div>
              <div className="hero-card"><span>Projetos abertos</span><strong>{openProjects}</strong></div>
            </div>
          </section>
        )}

        {view === 'projects' && (
          <section className="workspace">
            <div className="panel project-summary">
              <div className="panel-header"><div><h2>Projetos</h2><p>Visualize projetos</p></div><button className="button ghost" onClick={loadData}>Atualizar</button></div>
              <ProjectList projects={projects} clientMap={new Map(users.filter(u=>u.role==='client').map(u=>[u.id,u.name||u.email]))} onClientClick={openProfile} onOpenDetail={openProjectDetail} isClient={isClient} isFreelancer={isFreelancer} currentAppUserId={currentAppUserId} />
            </div>
            <aside className="panel forms-panel">
              {isFreelancer && <GithubForm githubForm={githubForm} setGithubForm={setGithubForm} onSubmit={async (e)=>{e.preventDefault(); if(!currentAppUserId) return setStatusMessage('Perfil inválido'); try{const created=await api.createFreelancerGithubProject(currentAppUserId, githubForm); setGithubProjects(prev=>[created,...prev]); setGithubForm({repo_url:'',title:'',description:''}); setStatusMessage('Adicionado') }catch(err){setStatusMessage('Erro')}}} />}
            </aside>
          </section>
        )}

        {view === 'project_detail' && selectedProject && (
          <ProjectDetail project={selectedProject} proposals={projectProposals} milestones={projectMilestones} onClose={()=>{setView('projects'); setSelectedProject(null)}} refresh={async ()=>openProjectDetail(selectedProject)} handleProposalAction={async (id,status)=>{await api.updateProposal(id,status); await openProjectDetail(selectedProject)}} moveMilestoneStatus={async (id,status)=>{await api.updateMilestone(id,status); await openProjectDetail(selectedProject)}} openChat={async (id)=>{ setChatPartnerId(id); setView('chat'); await fetchChatHistory(id) }} currentAppUserId={currentAppUserId} />
        )}

        {view === 'chat' && (isClient||isFreelancer) && (
          <ChatPanel chatContacts={chatContacts} chatPartnerId={chatPartnerId} setChatPartnerId={(id)=>{setChatPartnerId(id); fetchChatHistory(id)}} chatMessages={chatMessages} chatText={chatText} setChatText={setChatText} sendChatMessage={sendChatMessage} fetchChatHistory={fetchChatHistory} chatConnected={chatConnected} currentAppUserId={currentAppUserId} />
        )}

        {view === 'profile' && profileUser && (
          <ProfileView profileUser={profileUser} editingProfile={editingProfile} profileForm={profileForm} setProfileForm={setProfileForm} setEditingProfile={setEditingProfile} onSave={saveProfile} onCancel={()=>setEditingProfile(false)} currentAppUserId={currentAppUserId} createExperience={createExperience} updateExperience={updateExperience} deleteExperience={deleteExperience} />
        )}

        <div className="toast">{statusMessage}</div>
      </main>

      <footer className="site-footer">© {new Date().getFullYear()} LancerDev — Conectando clientes e freelancers</footer>
    </div>
  )
}
