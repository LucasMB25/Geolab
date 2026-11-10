require('dotenv').config(); // Carrega as variáveis do arquivo .env
const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para processar JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota dinâmica para fornecer a chave da API do Google Maps contida no .env
app.get('/js/config.js', (req, res) => {
  res.type('application/javascript');
  res.send(`window.GOOGLE_MAPS_API_KEY = "${process.env.GOOGLE_MAPS_API_KEY || ''}";`);
});

// Servir arquivos estáticos (CSS e JS front-end a partir de /public)
app.use(express.static(path.join(__dirname, 'public')));

// Configuração da Sessão
app.use(session({
  secret: 'chave-secreta-laboratorio-manaus',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // 1 hora
}));

// Middleware de autenticação de rotas
function verificarAutenticacao(req, res, next) {
  if (req.session && req.session.logado) {
    return next();
  }
  return res.redirect('/');
}

// ROTA 1: Página de Login (Pública)
app.get('/', (req, res) => {
  if (req.session && req.session.logado) {
    return res.redirect('/mapa');
  }
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// ROTA 2: Painel do Mapa (Protegida)
app.get('/mapa', verificarAutenticacao, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'mapa.html'));
});

// API: Processar Login
app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === 'aluno' && senha === '123456') {
    req.session.logado = true;
    return res.json({ sucesso: true, redirect: '/mapa' });
  }

  return res.status(401).json({ sucesso: false, mensagem: 'Usuário ou senha inválidos.' });
});

// API: Processar Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ sucesso: false });
    }
    res.clearCookie('connect.sid');
    return res.json({ sucesso: true, redirect: '/' });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});