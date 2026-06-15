BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('client', 'freelancer')),
  bio TEXT,
  hourly_rate NUMERIC(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'awarded', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  cover_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS milestones (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id INTEGER REFERENCES milestones(id) ON DELETE SET NULL,
  payer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO users (name, email, role, bio, hourly_rate)
VALUES
  ('Ana Cliente', 'ana@cliente.com', 'client', 'Cliente buscando devs para projetos web.', NULL),
  ('Pedro Dev', 'pedro@dev.com', 'freelancer', 'Desenvolvedor frontend com foco em experiências clean.', 80.00)
ON CONFLICT (email) DO NOTHING;

INSERT INTO projects (client_id, title, description, budget)
SELECT u.id, 'Portal de portfólio profissional', 'Desenvolver plataforma de apresentação pessoal e agenda de projetos com integração de marcos.', 5200.00
FROM users u
WHERE u.email = 'ana@cliente.com'
  AND NOT EXISTS (
    SELECT 1 FROM projects WHERE title = 'Portal de portfólio profissional'
  );

INSERT INTO proposals (project_id, freelancer_id, amount, cover_text)
SELECT p.id, u.id, 5200.00, 'Proposta completa com milestones claros e entrega em 6 semanas.'
FROM projects p
JOIN users u ON u.email = 'pedro@dev.com'
WHERE p.title = 'Portal de portfólio profissional'
  AND NOT EXISTS (
    SELECT 1 FROM proposals WHERE project_id = p.id AND freelancer_id = u.id
  );

COMMIT;

-- Table to store GitHub projects added by freelancers to their profile
BEGIN;
CREATE TABLE IF NOT EXISTS github_projects (
  id SERIAL PRIMARY KEY,
  freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repo_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example entry for seeded freelancer (pedro@dev.com)
INSERT INTO github_projects (freelancer_id, repo_url, title, description)
SELECT u.id, 'https://github.com/pedro-dev/portfolio', 'Portfolio Example', 'Repositório de exemplo do Pedro Dev'
FROM users u
WHERE u.email = 'pedro@dev.com'
  AND NOT EXISTS (
    SELECT 1 FROM github_projects gp JOIN users uu ON gp.freelancer_id = uu.id WHERE uu.email = 'pedro@dev.com' AND gp.repo_url = 'https://github.com/pedro-dev/portfolio'
  );

COMMIT;
