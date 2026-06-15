import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { api } from './services/api.js'
import { supabase } from './utils/supabase/client.js'
import { getSession, signIn, signOut, signUp } from './utils/supabase/auth.js'

const emptyAuth = { name: '', email: '', password: '', role: 'client' }
const emptyProject = { title: '', description: '', budget: '' }
const emptyProposal = { project_id: '', amount: '', cover_text: '' }
const emptyMilestone = { project_id: '', title: '', description: '', amount: '', due_date: '' }
const emptyPayment = { project_id: '', milestone_id: '', payer_id: '', receiver_id: '', amount: '', status: 'pending' }
const emptyReview = { project_id: '', reviewer_id: '', reviewee_id: '', rating: 5, message: '' }
const emptyProposalMilestone = { title: '', amount: '', due_date: '' }

function App() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(emptyAuth)
  const [users, setUsers] = useState([])
  const usersRef = useRef(users)
  const [projects, setProjects] = useState([])
  const [projectForm, setProjectForm] = useState(emptyProject)
  const [proposalForm, setProposalForm] = useState(emptyProposal)
  const [proposalMilestones, setProposalMilestones] = useState([emptyProposalMilestone])
  const [milestoneForm, setMilestoneForm] = useState(emptyMilestone)
  const [paymentForm, setPaymentForm] = useState(emptyPayment)
  const [reviewForm, setReviewForm] = useState(emptyReview)
  const [statusMessage, setStatusMessage] = useState('')
  const [chatPartnerId, setChatPartnerId] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [chatText, setChatText] = useState('')
  const [chatConnected, setChatConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    usersRef.current = users
  }, [users])

  const currentAppUser = useMemo(
    () => users.find((appUser) => appUser.email === user?.email),
    [users, user]
  )

  const resolvedRole = currentAppUser?.role || user?.user_metadata?.role || null
  const isClient = resolvedRole === 'client'
  const isFreelancer = resolvedRole === 'freelancer'
  const userName = currentAppUser?.name || user?.user_metadata?.name || user?.email || 'Usuário'
  const userRole = resolvedRole ? (resolvedRole === 'client' ? 'Cliente' : resolvedRole === 'freelancer' ? 'Freelancer' : resolvedRole) : 'Visitante'


  const currentAppUserId = currentAppUser?.id

  const loadData = useCallback(async () => {
    try {
      const [usersData, projectsData] = await Promise.all([api.getUsers(), api.getProjects()])
      setUsers(usersData)
      setProjects(projectsData)
      return { usersData, projectsData }
    } catch (error) {
      console.error(error)
      setStatusMessage('Falha ao carregar dados. Verifique o backend.')
      return { usersData: [], projectsData: [] }
    }
  }, [])

  const createBackendProfile = useCallback(async (sessionUser, loadedUsers = []) => {
    if (!sessionUser?.email) return null
    const existingUser = loadedUsers.find((appUser) => appUser.email === sessionUser.email) || usersRef.current.find((appUser) => appUser.email === sessionUser.email)
    if (existingUser) return existingUser

    try {
      const created = await api.createUser({
        name: sessionUser.user_metadata?.name || sessionUser.email,
        email: sessionUser.email,
        role: sessionUser.user_metadata?.role || 'client',
        bio: '',
        hourly_rate: null,
      })
      setUsers((prevUsers) => [created, ...prevUsers])
      return created
    } catch (error) {
      console.warn('Falha ao criar perfil backend:', error.message)
      return null
    }
  }, [])

  const sanitizeChatText = (text) => {
    return text
      .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '[contato oculto]')
      .replace(/(\+?\d[\d\s().-]{7,}\d)/g, '[contato oculto]')
  }

  const connectWebSocket = useCallback(() => {
    if (!currentAppUserId) return
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const socket = new WebSocket(`${protocol}://${window.location.hostname}:3000/chat?userId=${currentAppUserId}`)

    socket.addEventListener('open', () => {
      setChatConnected(true)
      setStatusMessage('Conexão de chat estabelecida.')
    })

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'message') {
          setChatMessages((prev) => [...prev, payload.message])
        }
      } catch (error) {
        console.error('Erro ao processar mensagem de chat', error)
      }
    })

    socket.addEventListener('close', () => {
      setChatConnected(false)
      socketRef.current = null
    })

    socket.addEventListener('error', () => {
      setChatConnected(false)
      socketRef.current = null
      setStatusMessage('Falha na conexão do chat.')
    })

    socketRef.current = socket
  }, [currentAppUserId])

  const disconnectWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
      setChatConnected(false)
    }
  }, [])

  const fetchChatHistory = useCallback(async (partnerId) => {
    if (!currentAppUserId) return
    try {
      const history = await api.getChatMessages(currentAppUserId, partnerId)
      setChatMessages(history)
    } catch (error) {
      console.error(error)
      setStatusMessage('Erro ao carregar histórico de chat.')
    }
  }, [currentAppUserId])

  useEffect(() => {
    let authListener

    const initAuth = async () => {
      const { data } = await getSession()
      const sessionData = data?.session
      setSession(sessionData)
      setUser(sessionData?.user ?? null)
      if (sessionData?.access_token) {
        localStorage.setItem('token', sessionData.access_token)
      }
      if (sessionData) {
        const { usersData } = await loadData()
        await createBackendProfile(sessionData.user, usersData)
      }
    }

    initAuth()

    authListener = supabase.auth.onAuthStateChange(async (_event, sessionState) => {
      setSession(sessionState)
      setUser(sessionState?.user ?? null)
      if (sessionState?.access_token) {
        localStorage.setItem('token', sessionState.access_token)
      } else {
        localStorage.removeItem('token')
      }
      if (sessionState) {
        const { usersData } = await loadData()
        await createBackendProfile(sessionState.user, usersData)
      }
    })

    return () => {
      authListener?.data?.subscription?.unsubscribe?.()
      disconnectWebSocket()
    }
  }, [connectWebSocket, createBackendProfile, disconnectWebSocket, loadData])

  useEffect(() => {
    if (session && currentAppUserId && !socketRef.current) {
      connectWebSocket()
    }
  }, [session, currentAppUserId, connectWebSocket])

  useEffect(() => {
    if (session && chatPartnerId) {
      fetchChatHistory(chatPartnerId)
    }
  }, [chatPartnerId, session, fetchChatHistory])

  const sendChatMessage = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setStatusMessage('O chat não está conectado. Aguarde a conexão.')
      return
    }

    const messageText = chatText.trim()
    if (!messageText) return

    const payload = {
      type: 'message',
      fromId: currentAppUserId,
      senderName: userName,
      toId: Number(chatPartnerId),
      text: sanitizeChatText(messageText),
    }

    socketRef.current.send(JSON.stringify(payload))
    setChatMessages((prev) => [
      ...prev,
      {
        senderId: currentAppUserId,
        senderName: userName,
        receiverId: Number(chatPartnerId),
        text: payload.text,
        createdAt: new Date().toISOString(),
      },
    ])
    setChatText('')
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setStatusMessage('')

    if (authMode === 'login') {
      const { data, error } = await signIn({ email: authForm.email, password: authForm.password })
      if (error) {
        setStatusMessage(error.message)
        return
      }
      setSession(data.session)
      setUser(data.user)
      if (data.session?.access_token) {
        localStorage.setItem('token', data.session.access_token)
      }
      const { usersData } = await loadData()
      await createBackendProfile(data.user, usersData)
      setStatusMessage('Login realizado com sucesso.')
      setAuthForm(emptyAuth)
      return
    }

    const { data, error } = await signUp({
      email: authForm.email,
      password: authForm.password,
      name: authForm.name,
      role: authForm.role,
    })

    if (error) {
      setStatusMessage(error.message)
      return
    }

    if (data.session?.access_token) {
      localStorage.setItem('token', data.session.access_token)
    }
    setSession(data.session)
    setUser(data.user)
    const { usersData } = await loadData()
    await createBackendProfile(data.user, usersData)
    setStatusMessage('Conta criada. Verifique seu email se necessário.')
    setAuthForm(emptyAuth)
  }

  const handleLogout = async () => {
    await signOut()
    disconnectWebSocket()
    setSession(null)
    setUser(null)
    setStatusMessage('Sessão encerrada.')
  }

  const handleSubmit = async (event, action) => {
    event.preventDefault()
    try {
      switch (action) {
        case 'project': {
          if (!currentAppUserId) {
            setStatusMessage('Você precisa de um perfil válido antes de criar um projeto.')
            return
          }
          const createdProject = await api.createProject({
            client_id: currentAppUserId,
            title: projectForm.title,
            description: projectForm.description,
            budget: Number(projectForm.budget),
          })
          setProjects([createdProject, ...projects])
          setProjectForm(emptyProject)
          setStatusMessage('Projeto cadastrado com sucesso!')
          break
        }
        case 'proposal': {
          if (!currentAppUserId) {
            setStatusMessage('Você precisa de um perfil válido antes de enviar proposta.')
            return
          }
          const milestoneSum = proposalMilestones.reduce((sum, item) => sum + Number(item.amount || 0), 0)
          const proposalAmount = Number(proposalForm.amount)
          if (!proposalMilestones.length) {
            setStatusMessage('Adicione ao menos um marco à proposta.')
            return
          }
          if (milestoneSum !== proposalAmount) {
            setStatusMessage('A soma dos marcos deve ser exatamente igual ao valor total da proposta.')
            return
          }
          await api.createProposal(proposalForm.project_id, {
            freelancer_id: currentAppUserId,
            amount: proposalAmount,
            cover_text: proposalForm.cover_text,
          })
          setProposalForm(emptyProposal)
          setProposalMilestones([emptyProposalMilestone])
          setStatusMessage('Proposta enviada!')
          break
        }
        case 'milestone': {
          await api.createMilestone(milestoneForm.project_id, {
            title: milestoneForm.title,
            description: milestoneForm.description,
            amount: Number(milestoneForm.amount),
            due_date: milestoneForm.due_date || null,
          })
          setMilestoneForm(emptyMilestone)
          setStatusMessage('Marco criado!')
          break
        }
        case 'payment': {
          await api.createPayment(paymentForm.project_id, {
            milestone_id: paymentForm.milestone_id || null,
            payer_id: Number(paymentForm.payer_id),
            receiver_id: Number(paymentForm.receiver_id),
            amount: Number(paymentForm.amount),
            status: paymentForm.status,
          })
          setPaymentForm(emptyPayment)
          setStatusMessage('Pagamento registrado!')
          break
        }
        case 'review': {
          await api.createReview(reviewForm.project_id, {
            reviewer_id: Number(reviewForm.reviewer_id),
            reviewee_id: Number(reviewForm.reviewee_id),
            rating: Number(reviewForm.rating),
            message: reviewForm.message,
          })
          setReviewForm(emptyReview)
          setStatusMessage('Avaliação adicionada!')
          break
        }
        default:
          break
      }
    } catch (error) {
      console.error(error)
      setStatusMessage(error.message || 'Erro ao enviar formulário')
    }
  }

  const addProposalMilestone = () => {
    setProposalMilestones((prev) => [...prev, emptyProposalMilestone])
  }

  const updateProposalMilestone = (index, field, value) => {
    setProposalMilestones((prev) => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)))
  }

  const removeProposalMilestone = (index) => {
    setProposalMilestones((prev) => prev.filter((_, idx) => idx !== index))
  }

  const totalFreelancers = useMemo(() => users.filter((userItem) => userItem.role === 'freelancer').length, [users])
  const totalClients = useMemo(() => users.filter((userItem) => userItem.role === 'client').length, [users])
  const openProjects = useMemo(() => projects.filter((project) => project.status === 'open').length, [projects])
  const clientMap = useMemo(
    () => new Map(users.filter((u) => u.role === 'client').map((u) => [u.id, u.name || u.email])),
    [users]
  )

  if (!session) {
    return (
      <div className="app-shell">
        <main className="auth-shell">
          <section className="auth-card">
            <div className="auth-header">
              <h1>{authMode === 'login' ? 'Entrar' : 'Criar conta'}</h1>
              <p>Use o Supabase para autenticação segura e tokens JWT.</p>
            </div>
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <label>
                  Nome completo
                  <input type="text" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} required />
                </label>
              )}
              <label>
                Email
                <input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required />
              </label>
              <label>
                Senha
                <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required />
              </label>
              {authMode === 'register' && (
                <label>
                  Registro como
                  <select value={authForm.role} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}>
                    <option value="client">Cliente</option>
                    <option value="freelancer">Freelancer</option>
                  </select>
                </label>
              )}
              <button className="button primary" type="submit">
                {authMode === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            </form>
            <button className="button ghost" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
              {authMode === 'login' ? 'Criar uma conta' : 'Já tenho conta'}
            </button>
            <div className="toast">{statusMessage}</div>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className={`app-shell ${isClient ? 'role-client' : isFreelancer ? 'role-freelancer' : ''}`}>
      <header className="topbar">
        <div>
          <div className="brand">LancerDev</div>
          <div className="subtitle">
            {userName} <span className="role-badge">{userRole}</span>
          </div>
        </div>
        <button className="button ghost" onClick={handleLogout}>Logout</button>
      </header>

      <main>
        <section className="hero-panel">
          <div>
            <span className="eyebrow">Painel {userRole === 'client' ? 'Cliente' : 'Freelancer'}</span>
            <h1>Bem-vindo ao LancerDev</h1>
            <p>Autenticação com Supabase e tokens JWT para separar os acessos de cliente e freelancer.</p>
          </div>
          <div className="hero-actions">
            <div className="hero-card">
              <span>Clientes</span>
              <strong>{totalClients}</strong>
            </div>
            <div className="hero-card">
              <span>Freelancers</span>
              <strong>{totalFreelancers}</strong>
            </div>
            <div className="hero-card">
              <span>Projetos em aberto</span>
              <strong>{openProjects}</strong>
            </div>
          </div>
        </section>

        <section className="workspace">
          <div className="panel project-summary">
            <div className="panel-header">
              <div>
                <h2>Projetos</h2>
                <p>Visualize projetos e gerencie marcos conforme seu papel.</p>
              </div>
              <button className="button ghost" onClick={loadData}>Atualizar</button>
            </div>

            {projects.length === 0 ? (
              <div className="empty-state">Não há projetos cadastrados ainda.</div>
            ) : (
              <div className="project-list">
                {projects.map((project) => (
                  <article className="project-card" key={project.id}>
                    <div className="project-row">
                      <div>
                        <h3>{project.title}</h3>
                        <p>{project.description}</p>
                      </div>
                      <span className={`status-pill status-${project.status}`}>{project.status.replace('_', ' ')}</span>
                    </div>
                    <div className="project-meta">
                      <span>{clientMap.get(project.client_id) || `Cliente #${project.client_id}`}</span>
                      <strong>R$ {Number(project.budget).toFixed(2)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="panel forms-panel">
            <div className="panel-header"><h2>Ações disponíveis</h2></div>
            {isClient ? (
              <div className="form-group">
                <h3>Cliente</h3>
                <p>Crie projetos e marcos, registre pagamentos e avalie freelancers.</p>
              </div>
            ) : null}
            {isFreelancer ? (
              <div className="form-group">
                <h3>Freelancer</h3>
                <p>Envie propostas para projetos e acompanhe entregas por marcos.</p>
              </div>
            ) : null}
          </aside>
        </section>

        {isFreelancer && (
          <section className="workspace secondary-panel">
            <div className="panel proposal-panel">
              <h3>Enviar proposta</h3>
              <form onSubmit={(event) => handleSubmit(event, 'proposal')}>
                <label>
                  Projeto
                  <select value={proposalForm.project_id} onChange={(e) => setProposalForm({ ...proposalForm, project_id: e.target.value })} required>
                    <option value="">Selecione</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Valor da proposta
                  <input type="number" value={proposalForm.amount} onChange={(e) => setProposalForm({ ...proposalForm, amount: e.target.value })} required />
                </label>
                <label>
                  Mensagem
                  <textarea value={proposalForm.cover_text} onChange={(e) => setProposalForm({ ...proposalForm, cover_text: e.target.value })} placeholder="Descreva o escopo do trabalho" />
                </label>
                <div className="proposal-milestones">
                  <div className="proposal-milestones-header">
                    <span>Marcos</span>
                    <button type="button" className="button secondary" onClick={addProposalMilestone}>Adicionar marco</button>
                  </div>
                  {proposalMilestones.map((milestone, index) => (
                    <div key={index} className="milestone-row">
                      <label>
                        Título do marco
                        <input type="text" value={milestone.title} onChange={(e) => updateProposalMilestone(index, 'title', e.target.value)} required />
                      </label>
                      <label>
                        Valor
                        <input type="number" value={milestone.amount} onChange={(e) => updateProposalMilestone(index, 'amount', e.target.value)} required />
                      </label>
                      <label>
                        Prazo
                        <input type="date" value={milestone.due_date} onChange={(e) => updateProposalMilestone(index, 'due_date', e.target.value)} />
                      </label>
                      {proposalMilestones.length > 1 && (
                        <button type="button" className="button ghost" onClick={() => removeProposalMilestone(index)}>Remover</button>
                      )}
                    </div>
                  ))}
                </div>
                <button className="button secondary" type="submit">Enviar proposta</button>
              </form>
            </div>
          </section>
        )}

        {isClient && (
          <section className="workspace secondary-panel">
            <div className="form-grid">
              <div className="panel">
                <h3>Criar projeto</h3>
                <form onSubmit={(event) => handleSubmit(event, 'project')}>
                  <label>
                    Título
                    <input value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} required />
                  </label>
                  <label>
                    Descrição
                    <textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} required />
                  </label>
                  <label>
                    Orçamento
                    <input type="number" value={projectForm.budget} onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })} required />
                  </label>
                  <button className="button primary" type="submit">Criar projeto</button>
                </form>
              </div>

              <div className="panel">
                <h3>Criar marco</h3>
                <form onSubmit={(event) => handleSubmit(event, 'milestone')}>
                  <label>
                    Projeto
                    <select value={milestoneForm.project_id} onChange={(e) => setMilestoneForm({ ...milestoneForm, project_id: e.target.value })} required>
                      <option value="">Selecione</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>{project.title}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Título do marco
                    <input value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} required />
                  </label>
                  <label>
                    Descrição
                    <textarea value={milestoneForm.description} onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })} required />
                  </label>
                  <label>
                    Valor do marco
                    <input type="number" value={milestoneForm.amount} onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })} required />
                  </label>
                  <label>
                    Data de entrega
                    <input type="date" value={milestoneForm.due_date} onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })} />
                  </label>
                  <button className="button secondary" type="submit">Criar marco</button>
                </form>
              </div>
            </div>
          </section>
        )}

        {(isClient || isFreelancer) && (
          <section className="workspace chat-panel">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2>Chat interno</h2>
                  <p>Converse com seu cliente ou freelancer sem expor contatos externos.</p>
                </div>
              </div>
              <div className="chat-connector">
                <label>
                  Selecione parceiro
                  <select value={chatPartnerId} onChange={(e) => setChatPartnerId(e.target.value)}>
                    <option value="">Selecione um usuário</option>
                    {users
                      .filter((u) => u.role !== userRole)
                      .map((partner) => (
                        <option key={partner.id} value={partner.id}>{partner.name || partner.email}</option>
                      ))}
                  </select>
                </label>
                <span className={`chat-status ${chatConnected ? 'online' : 'offline'}`}>
                  {chatConnected ? 'Conectado' : 'Offline'}
                </span>
              </div>
              <div className="chat-feed">
                {chatMessages.length === 0 ? (
                  <div className="empty-state">Nenhuma mensagem ainda. Selecione um parceiro e envie a primeira mensagem.</div>
                ) : (
                  chatMessages.map((message, index) => (
                    <div key={index} className={`chat-bubble ${message.senderId === currentAppUserId ? 'sent' : 'received'}`}>
                      <div className="chat-meta">{message.senderName} • {new Date(message.createdAt).toLocaleString()}</div>
                      <p>{message.text}</p>
                    </div>
                  ))
                )}
              </div>
              <form className="chat-form" onSubmit={(event) => {
                event.preventDefault()
                if (!chatPartnerId) {
                  setStatusMessage('Escolha um parceiro para iniciar a conversa.')
                  return
                }
                if (!chatText.trim()) {
                  setStatusMessage('Digite uma mensagem para enviar.')
                  return
                }
                sendChatMessage()
              }}>
                <textarea value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Escreva sua mensagem..." />
                <button className="button primary" type="submit">Enviar mensagem</button>
              </form>
            </div>
          </section>
        )}

        <div className="toast">{statusMessage}</div>
      </main>
    </div>
  )
}

export default App
