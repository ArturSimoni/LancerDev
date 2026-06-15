const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();
// Also load .env.local if present (allows separate local DB credentials)
dotenv.config({ path: '.env.local' });
// If variables are already set in the environment (e.g. system env), override them
const fs = require('fs');
try {
  const envLocalPath = '.env.local';
  if (fs.existsSync(envLocalPath)) {
    const parsed = require('dotenv').parse(fs.readFileSync(envLocalPath));
    Object.keys(parsed).forEach((k) => {
      process.env[k] = parsed[k];
    });
  }
} catch (e) {
  console.warn('Could not load .env.local for override:', e.message || e);
}

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    };

if (!poolConfig.connectionString && (!poolConfig.user || !poolConfig.host || !poolConfig.database)) {
  throw new Error(
    'Missing database configuration. Set DATABASE_URL, or DB_USER, DB_HOST, DB_DATABASE, DB_PASSWORD, and DB_PORT in .env.'
  );
}

console.log('Postgres pool config:', poolConfig);
const pool = new Pool(poolConfig);

pool.connect()
  .then((client) => {
    client.release();
    console.log('Connected to Postgres database.');
  })
  .catch((error) => {
    console.error('Failed to connect to Postgres database:', error.message || error);
    process.exit(1);
  });

// Ensure github_projects table exists even if init script wasn't executed
pool
  .query(`CREATE TABLE IF NOT EXISTS github_projects (
    id SERIAL PRIMARY KEY,
    freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repo_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`)
  .then(() => console.log('Ensured github_projects table exists.'))
  .catch((err) => console.warn('Could not ensure github_projects table:', err.message || err));

// Ensure experiences table exists so users can add work experiences to profiles
pool
  .query(`CREATE TABLE IF NOT EXISTS experiences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT,
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`)
  .then(() => console.log('Ensured experiences table exists.'))
  .catch((err) => console.warn('Could not ensure experiences table:', err.message || err));

const app = express();

app.use(cors());
app.use(express.json());

function handleError(res, error) {
  console.error(error);
  res.status(500).json({ error: 'Erro interno do servidor' });
}

app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, bio, hourly_rate, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/clients', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, bio, created_at FROM users WHERE role = $1 ORDER BY created_at DESC', ['client']);
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/freelancers', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, bio, hourly_rate, created_at FROM users WHERE role = $1 ORDER BY created_at DESC', ['freelancer']);
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/users', async (req, res) => {
  try {
    const { name, email, role, bio, hourly_rate } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Nome, e-mail e função são obrigatórios' });
    }
    const result = await pool.query(
      'INSERT INTO users (name, email, role, bio, hourly_rate) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, bio, hourly_rate, created_at',
      [name, email, role, bio || null, hourly_rate || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/projects', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.client_id, p.title, p.description, p.budget, p.status, p.created_at, u.name AS client_name, u.email AS client_email
       FROM projects p
       JOIN users u ON p.client_id = u.id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.id, p.client_id, p.title, p.description, p.budget, p.status, p.created_at, u.name AS client_name, u.email AS client_email
       FROM projects p
       JOIN users u ON p.client_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Projeto não encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/projects', async (req, res) => {
  try {
    const { client_id, title, description, budget } = req.body;
    if (!client_id || !title || !description || !budget) {
      return res.status(400).json({ error: 'Cliente, título, descrição e orçamento são obrigatórios' });
    }
    const result = await pool.query(
      'INSERT INTO projects (client_id, title, description, budget) VALUES ($1, $2, $3, $4) RETURNING id, client_id, title, description, budget, status, created_at',
      [client_id, title, description, budget]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

app.patch('/projects/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status é obrigatório' });
    const result = await pool.query(
      'UPDATE projects SET status = $1 WHERE id = $2 RETURNING id, title, status',
      [status, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Projeto não encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

// Return a single user profile (with github projects for freelancers)
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT id, name, email, role, bio, hourly_rate, created_at FROM users WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
    const user = result.rows[0];
    if (user.role === 'freelancer') {
      const github = await pool.query('SELECT id, repo_url, title, description, created_at FROM github_projects WHERE freelancer_id = $1 ORDER BY created_at DESC', [id]);
      user.github_projects = github.rows;
    }
    // attach experiences for any user
    const experiences = await pool.query('SELECT id, title, company, start_date, end_date, description, created_at FROM experiences WHERE user_id = $1 ORDER BY created_at DESC', [id]);
    user.experiences = experiences.rows;
    res.json(user);
  } catch (error) {
    handleError(res, error);
  }
});

// Update user profile (client or freelancer)
app.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, hourly_rate, role } = req.body;

    // Validate minimal fields
    if (!name && !bio && typeof hourly_rate === 'undefined' && !role) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar foi fornecido' });
    }

    const fields = [];
    const values = [];
    let idx = 1;
    if (typeof name !== 'undefined') {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (typeof bio !== 'undefined') {
      fields.push(`bio = $${idx++}`);
      values.push(bio);
    }
    if (typeof hourly_rate !== 'undefined') {
      fields.push(`hourly_rate = $${idx++}`);
      values.push(hourly_rate);
    }
    if (typeof role !== 'undefined') {
      fields.push(`role = $${idx++}`);
      values.push(role);
    }

    values.push(id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, email, role, bio, hourly_rate, created_at`;
    const result = await pool.query(query, values);
    if (!result.rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

// Freelancer: list github projects
app.get('/freelancers/:id/github-projects', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT id, repo_url, title, description, created_at FROM github_projects WHERE freelancer_id = $1 ORDER BY created_at DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

// Freelancer: add github project to profile
app.post('/freelancers/:id/github-projects', async (req, res) => {
  try {
    const { id } = req.params;
    const { repo_url, title, description } = req.body;
    if (!repo_url) return res.status(400).json({ error: 'URL do repositório é obrigatória' });
    const result = await pool.query(
      'INSERT INTO github_projects (freelancer_id, repo_url, title, description) VALUES ($1, $2, $3, $4) RETURNING id, repo_url, title, description, created_at',
      [id, repo_url, title || null, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

// Experiences endpoints for user profiles
app.get('/users/:id/experiences', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT id, title, company, start_date, end_date, description, created_at FROM experiences WHERE user_id = $1 ORDER BY created_at DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/users/:id/experiences', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, company, start_date, end_date, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Título da experiência é obrigatório' });
    const result = await pool.query(
      'INSERT INTO experiences (user_id, title, company, start_date, end_date, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, company, start_date, end_date, description, created_at',
      [id, title, company || null, start_date || null, end_date || null, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

app.patch('/experiences/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, company, start_date, end_date, description } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;
    if (typeof title !== 'undefined') { fields.push(`title = $${idx++}`); values.push(title); }
    if (typeof company !== 'undefined') { fields.push(`company = $${idx++}`); values.push(company); }
    if (typeof start_date !== 'undefined') { fields.push(`start_date = $${idx++}`); values.push(start_date); }
    if (typeof end_date !== 'undefined') { fields.push(`end_date = $${idx++}`); values.push(end_date); }
    if (typeof description !== 'undefined') { fields.push(`description = $${idx++}`); values.push(description); }
    if (!fields.length) return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    values.push(id);
    const query = `UPDATE experiences SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, title, company, start_date, end_date, description, created_at`;
    const result = await pool.query(query, values);
    if (!result.rows.length) return res.status(404).json({ error: 'Experiência não encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

app.delete('/experiences/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM experiences WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Experiência não encontrada' });
    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/projects/:id/proposals', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT pr.id, pr.project_id, pr.freelancer_id, pr.amount, pr.cover_text, pr.status, pr.created_at,
              u.name AS freelancer_name, u.email AS freelancer_email
       FROM proposals pr
       JOIN users u ON pr.freelancer_id = u.id
       WHERE pr.project_id = $1
       ORDER BY pr.created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/projects/:id/proposals', async (req, res) => {
  try {
    const { id } = req.params;
    const { freelancer_id, amount, cover_text } = req.body;
    if (!freelancer_id || !amount) {
      return res.status(400).json({ error: 'Freelancer e valor da proposta são obrigatórios' });
    }
    const result = await pool.query(
      'INSERT INTO proposals (project_id, freelancer_id, amount, cover_text) VALUES ($1, $2, $3, $4) RETURNING id, project_id, freelancer_id, amount, cover_text, status, created_at',
      [id, freelancer_id, amount, cover_text || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

app.patch('/proposals/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status é obrigatório' });
    const result = await pool.query(
      'UPDATE proposals SET status = $1 WHERE id = $2 RETURNING id, project_id, freelancer_id, status',
      [status, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Proposta não encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/projects/:id/milestones', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, title, description, amount, due_date, status, created_at FROM milestones WHERE project_id = $1 ORDER BY created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/projects/:id/milestones', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, amount, due_date } = req.body;
    if (!title || !description || !amount) {
      return res.status(400).json({ error: 'Título, descrição e valor do marco são obrigatórios' });
    }
    const result = await pool.query(
      'INSERT INTO milestones (project_id, title, description, amount, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, description, amount, due_date, status, created_at',
      [id, title, description, amount, due_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

app.patch('/milestones/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status é obrigatório' });
    const result = await pool.query(
      'UPDATE milestones SET status = $1 WHERE id = $2 RETURNING id, project_id, title, status',
      [status, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Marco não encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/projects/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT pay.id, pay.amount, pay.status, pay.paid_at, pay.created_at,
              u.name AS payer_name,
              v.name AS receiver_name,
              m.title AS milestone_title
       FROM payments pay
       JOIN users u ON pay.payer_id = u.id
       JOIN users v ON pay.receiver_id = v.id
       LEFT JOIN milestones m ON pay.milestone_id = m.id
       WHERE pay.project_id = $1
       ORDER BY pay.created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/projects/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    const { milestone_id, payer_id, receiver_id, amount, status } = req.body;
    if (!payer_id || !receiver_id || !amount || !status) {
      return res.status(400).json({ error: 'Pagador, recebedor, valor e status são obrigatórios' });
    }
    const paidAt = status === 'paid' ? new Date() : null;
    const result = await pool.query(
      'INSERT INTO payments (project_id, milestone_id, payer_id, receiver_id, amount, status, paid_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, project_id, milestone_id, payer_id, receiver_id, amount, status, paid_at, created_at',
      [id, milestone_id || null, payer_id, receiver_id, amount, status, paidAt]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/projects/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.id, r.rating, r.message, r.created_at,
              reviewer.name AS reviewer_name,
              reviewee.name AS reviewee_name
       FROM reviews r
       JOIN users reviewer ON r.reviewer_id = reviewer.id
       JOIN users reviewee ON r.reviewee_id = reviewee.id
       WHERE r.project_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/projects/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewer_id, reviewee_id, rating, message } = req.body;
    if (!reviewer_id || !reviewee_id || !rating) {
      return res.status(400).json({ error: 'Avaliador, avaliado e nota são obrigatórios' });
    }
    const result = await pool.query(
      'INSERT INTO reviews (project_id, reviewer_id, reviewee_id, rating, message) VALUES ($1, $2, $3, $4, $5) RETURNING id, project_id, reviewer_id, reviewee_id, rating, message, created_at',
      [id, reviewer_id, reviewee_id, rating, message || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/chat/messages/:myId/:partnerId', async (req, res) => {
  try {
    const { myId, partnerId } = req.params;
    const result = await pool.query(
      `SELECT id, from_user_id, to_user_id, sender_name, text, created_at
       FROM chat_messages
       WHERE (from_user_id = $1 AND to_user_id = $2)
          OR (from_user_id = $2 AND to_user_id = $1)
       ORDER BY created_at ASC`,
      [myId, partnerId]
    );
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

const connectedUsers = new Map();
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws, request) => {
  const params = new URLSearchParams(request.url.split('?')[1] || '')
  const userId = Number(params.get('userId'))
  if (!userId) {
    ws.close();
    return;
  }

  connectedUsers.set(userId, ws);

  ws.on('message', async (message) => {
    try {
      const payload = JSON.parse(message.toString());
      if (payload.type !== 'message') return;

      const { fromId, toId, senderName, text } = payload;
      if (!fromId || !toId || !text) return;

      const chatResult = await pool.query(
        'INSERT INTO chat_messages (from_user_id, to_user_id, sender_name, text) VALUES ($1, $2, $3, $4) RETURNING id, from_user_id, to_user_id, sender_name, text, created_at',
        [fromId, toId, senderName || 'Usuário', text]
      );
      const savedMessage = chatResult.rows[0];

      const partnerSocket = connectedUsers.get(toId);
      if (partnerSocket && partnerSocket.readyState === partnerSocket.OPEN) {
        partnerSocket.send(JSON.stringify({ type: 'message', message: savedMessage }));
      }

      ws.send(JSON.stringify({ type: 'message', message: savedMessage }));
    } catch (error) {
      console.error('Chat websocket error:', error);
    }
  });

  ws.on('close', () => {
    connectedUsers.delete(userId);
  });
});

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname === '/chat') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});
