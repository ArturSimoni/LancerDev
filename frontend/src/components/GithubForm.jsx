import React from 'react'

export default function GithubForm({ githubForm, setGithubForm, onSubmit }) {
  return (
    <div className="form-group">
      <h3>Adicionar repositório GitHub</h3>
      <p>Adicione projetos do GitHub ao seu perfil público.</p>
      <form onSubmit={onSubmit}>
        <label>
          URL do repositório
          <input value={githubForm.repo_url} onChange={(e) => setGithubForm({ ...githubForm, repo_url: e.target.value })} required />
        </label>
        <label>
          Título (opcional)
          <input value={githubForm.title} onChange={(e) => setGithubForm({ ...githubForm, title: e.target.value })} />
        </label>
        <label>
          Descrição (opcional)
          <input value={githubForm.description} onChange={(e) => setGithubForm({ ...githubForm, description: e.target.value })} />
        </label>
        <button className="button secondary" type="submit">Adicionar</button>
      </form>
    </div>
  )
}
