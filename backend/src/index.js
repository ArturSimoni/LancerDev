const express = require('express');
const cors = require('cors');
const prisma = require('./config/database');
const { initWebSocket } = require('./services/websocket');
const userRoutes = require('./routes/user.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/users', userRoutes);

app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Backend do LancerDev rodando profissionalmente!' 
  });
});

app.use(errorHandler);

// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 ===================================================`);
  console.log(`   Servidor HTTP rodando na porta ${PORT}`);
  console.log(`   Ambiente atual: ${process.env.NODE_ENV || 'development'}`);
  
  // Inicializa a engine de WebSockets acoplada ao mesmo servidor HTTP
  initWebSocket(server, prisma);
  console.log(`💬  Gateway de WebSockets ativado na rota [/chat]`);
  console.log(`=======================================================\n`);
});

process.on('SIGTERM', async () => {
  console.log('Fechando o servidor de forma graciosa...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Servidor encerrado.');
    process.exit(0);
  });
});