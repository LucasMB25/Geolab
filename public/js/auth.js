const loginForm = document.querySelector('#loginForm');

loginForm.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const usuario = document.querySelector('#usuario').value.trim();
  const senha = document.querySelector('#senha').value;
  const mensagemLogin = document.querySelector('#mensagemLogin');

  try {
    const resposta = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha })
    });

    const dados = await resposta.json();

    if (resposta.ok && dados.sucesso) {
      window.location.href = dados.redirect;
    } else {
      mensagemLogin.textContent = dados.mensagem || 'Erro ao realizar login.';
    }
  } catch (erro) {
    mensagemLogin.textContent = 'Erro de conexão com o servidor.';
  }
});