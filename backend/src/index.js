require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects'); 

const app = express();

app.use(cors({
  origin: 'http://localhost:5173' 
}));

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});