import React, { useState } from 'react'

export default function ProfileView({ profileUser, editingProfile, profileForm, setProfileForm, setEditingProfile, onSave, onCancel, currentAppUserId, createExperience, updateExperience, deleteExperience }) {
  if (!profileUser) return null
  const [newExp, setNewExp] = useState({ title: '', company: '', start_date: '', end_date: '', description: '' })
  const [editingExpId, setEditingExpId] = useState(null)
  const [editingExpValues, setEditingExpValues] = useState({})
  return (
    <section className="workspace profile-panel">
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>{profileUser.name || profileUser.email}</h2>
            <p style={{margin:0}}>{profileUser.role === 'freelancer' ? 'Freelancer' : 'Cliente'}</p>
          </div>
        </div>
        <div style={{padding:16}}>
                {editingProfile ? (
                  <>
                    <form onSubmit={onSave}>
              <label>
                Nome
                <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required />
              </label>
              <label>
                Bio
                <textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} />
              </label>
              <label>
                Valor/hora
                <input type="number" step="0.01" value={profileForm.hourly_rate} onChange={(e) => setProfileForm({ ...profileForm, hourly_rate: e.target.value })} />
              </label>
              <div style={{display:'flex',gap:8}}>
                <button className="button primary" type="submit">Salvar</button>
                <button type="button" className="button ghost" onClick={onCancel}>Cancelar</button>
              </div>
            </form>
                    <div style={{marginTop:16}}>
                      <h4>Adicionar experiência</h4>
                      <form onSubmit={async (e) => {
                        e.preventDefault()
                        try {
                          await createExperience(profileUser.id, newExp)
                          setNewExp({ title: '', company: '', start_date: '', end_date: '', description: '' })
                        } catch (err) {
                          console.error(err)
                        }
                      }}>
                        <label>Função
                          <input value={newExp.title} onChange={(e) => setNewExp({ ...newExp, title: e.target.value })} required />
                        </label>
                        <label>Empresa
                          <input value={newExp.company} onChange={(e) => setNewExp({ ...newExp, company: e.target.value })} />
                        </label>
                        <label>Início
                          <input type="date" value={newExp.start_date} onChange={(e) => setNewExp({ ...newExp, start_date: e.target.value })} />
                        </label>
                        <label>Fim
                          <input type="date" value={newExp.end_date} onChange={(e) => setNewExp({ ...newExp, end_date: e.target.value })} />
                        </label>
                        <label>Descrição
                          <textarea value={newExp.description} onChange={(e) => setNewExp({ ...newExp, description: e.target.value })} />
                        </label>
                        <div style={{display:'flex',gap:8}}>
                          <button className="button" type="submit">Adicionar</button>
                        </div>
                      </form>
                    </div>
                  </>
          ) : (
            <>
              <p><strong>Bio:</strong> {profileUser.bio || '—'}</p>
              {profileUser.hourly_rate ? <p><strong>Valor/h:</strong> R$ {Number(profileUser.hourly_rate).toFixed(2)}</p> : null}
            </>
          )}

                {profileUser.role === 'freelancer' && (
            <>
              <h3>Projetos GitHub</h3>
              {profileUser.github_projects && profileUser.github_projects.length ? (
                <ul>
                  {profileUser.github_projects.map((gp) => (
                    <li key={gp.id}><a href={gp.repo_url} target="_blank" rel="noreferrer">{gp.title || gp.repo_url}</a> — {gp.description}</li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">Nenhum projeto GitHub adicionado.</div>
              )}
            </>
          )}
                <div style={{marginTop:16}}>
                  <h3>Experiências</h3>
                  {(!profileUser.experiences || profileUser.experiences.length === 0) ? (
                    <div className="empty-state">Nenhuma experiência adicionada.</div>
                  ) : (
                    <div>
                      {profileUser.experiences.map((exp) => (
                        <div key={exp.id} className="experience-row" style={{borderBottom:'1px solid #e6e6e6', padding:'8px 0'}}>
                          {editingExpId === exp.id ? (
                            <div>
                              <label>Função
                                <input value={editingExpValues.title || ''} onChange={(e) => setEditingExpValues({ ...editingExpValues, title: e.target.value })} />
                              </label>
                              <label>Empresa
                                <input value={editingExpValues.company || ''} onChange={(e) => setEditingExpValues({ ...editingExpValues, company: e.target.value })} />
                              </label>
                              <label>Descrição
                                <textarea value={editingExpValues.description || ''} onChange={(e) => setEditingExpValues({ ...editingExpValues, description: e.target.value })} />
                              </label>
                              <div style={{display:'flex',gap:8}}>
                                <button className="button" onClick={async () => {
                                  try {
                                    await updateExperience(exp.id, editingExpValues)
                                    setEditingExpId(null)
                                  } catch (err) { console.error(err) }
                                }}>Salvar</button>
                                <button className="button ghost" onClick={() => setEditingExpId(null)}>Cancelar</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                              <div>
                                <strong>{exp.title}</strong>
                                {exp.company ? <div style={{fontSize:12}}>{exp.company}</div> : null}
                                {exp.start_date || exp.end_date ? <div style={{fontSize:12}}>{exp.start_date || ''} — {exp.end_date || 'Presente'}</div> : null}
                                <div style={{marginTop:6}}>{exp.description}</div>
                              </div>
                              {editingProfile && currentAppUserId === profileUser.id && (
                                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                                  <button className="button" onClick={() => { setEditingExpId(exp.id); setEditingExpValues({ title: exp.title, company: exp.company, start_date: exp.start_date, end_date: exp.end_date, description: exp.description }) }}>Editar</button>
                                  <button className="button ghost" onClick={async () => { if (!confirm('Remover experiência?')) return; try { await deleteExperience(exp.id) } catch (err) { console.error(err) } }}>Remover</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
        </div>
      </div>
    </section>
  )
}
