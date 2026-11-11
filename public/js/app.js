'use strict';

// Controlador: liga formulários, armazenamento e mapa.
iniciarApp();

function iniciarApp() {
  const $ = (seletor) => document.querySelector(seletor);
  let dispositivos = StorageDispositivos.listar();
  const aviso = (texto) => { $('#mensagem').textContent = texto; };
  const formatar = (numero) => Number(numero).toFixed(5);
  const gerarId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

  function atualizar() {
    StorageDispositivos.salvar(dispositivos);
    renderizarLista();
    GeoMapa.desenhar(dispositivos);
  }

  function limparFormulario() {
    $('#dispositivoForm').reset();
    $('#idEdicao').value = '';
    $('#tituloForm').textContent = 'Cadastrar dispositivo';
    $('#salvar').textContent = 'Cadastrar dispositivo';
    $('#cancelar').hidden = true;
  }

  function filtrar() {
    const termo = $('#busca').value.trim().toLowerCase();
    const status = $('#filtro').value;
    return dispositivos.filter(d =>
      (status === 'todos' || d.status === status) &&
      (`${d.tag} ${d.descricao} ${d.tipo}`).toLowerCase().includes(termo)
    );
  }

  function botao(texto, classe, aoClicar) {
    const b = document.createElement('button');
    b.type = 'button'; 
    b.className = `pequeno ${classe}`; 
    b.textContent = texto;
    b.addEventListener('click', aoClicar); 
    return b;
  }

  function editar(id) {
    const d = dispositivos.find(item => item.id === id);
    if (!d) return;
    ['tag', 'tipo', 'descricao', 'lat', 'lng', 'status'].forEach(campo => { $(`#${campo}`).value = d[campo]; });
    $('#idEdicao').value = id;
    $('#tituloForm').textContent = 'Editar dispositivo';
    $('#salvar').textContent = 'Salvar alterações';
    $('#cancelar').hidden = false;
    aviso(`Editando ${d.tag}.`);
    $('#tag').focus();
  }

  function excluir(id) {
    const d = dispositivos.find(item => item.id === id);
    if (!d || !confirm(`Excluir ${d.tag}?`)) return;
    dispositivos = dispositivos.filter(item => item.id !== id);
    if ($('#idEdicao').value === id) limparFormulario();
    atualizar(); 
    aviso(`${d.tag} excluído.`);
  }

  function alternarStatus(id) {
    const d = dispositivos.find(item => item.id === id);
    if (!d) return;
    const sequencia = ['online', 'offline', 'manutencao'];
    d.status = sequencia[(sequencia.indexOf(d.status) + 1) % sequencia.length];
    atualizar(); 
    aviso(`Novo status de ${d.tag}: ${d.status}.`);
  }

  function renderizarLista() {
    const lista = $('#lista');
    lista.replaceChildren(); // Segurança: nenhuma tag digitada vira HTML executável.
    const encontrados = filtrar();
    $('#contador').textContent = `(${encontrados.length} / ${dispositivos.length})`;
    
    if (!encontrados.length) {
      const vazio = document.createElement('li'); 
      vazio.textContent = 'Nenhum dispositivo encontrado.';
      lista.append(vazio); 
      return;
    }

    encontrados.forEach(d => {
      const li = document.createElement('li');
      const titulo = document.createElement('strong'); 
      titulo.textContent = d.tag;
      
      const detalhe = document.createElement('p');
      detalhe.textContent = `${d.tipo.toUpperCase()} | Status: ${d.status}\nCoordenadas: ${formatar(d.lat)}, ${formatar(d.lng)}${d.descricao ? '\nObs: ' + d.descricao : ''}`;
      
      const acoes = document.createElement('div'); 
      acoes.className = 'item-acoes';
      acoes.append(
        botao('Localizar', 'secondary', () => GeoMapa.localizar(d)),
        botao('Editar', 'secondary', () => editar(d.id)),
        botao('Status +', 'secondary', () => alternarStatus(d.id)),
        botao('Excluir', 'danger', () => excluir(d.id))
      );
      
      li.append(titulo, detalhe, acoes); 
      lista.append(li);
    });
  }

  $('#dispositivoForm').addEventListener('submit', (evento) => {
    evento.preventDefault();
    const tag = $('#tag').value.trim();
    const descricao = $('#descricao').value.trim();
    const latTexto = $('#lat').value.trim(), lngTexto = $('#lng').value.trim();
    const lat = Number(latTexto), lng = Number(lngTexto);
    const tipo = $('#tipo').value, status = $('#status').value;
    const id = $('#idEdicao').value;

    if (!tag || !latTexto || !lngTexto || !Number.isFinite(lat) || !Number.isFinite(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      aviso('Informe tag e coordenadas válidas: latitude -90 a 90; longitude -180 a 180.'); 
      return;
    }
    if (!['sensor','camera','gateway'].includes(tipo) || !['online','offline','manutencao'].includes(status)) {
      aviso('Tipo ou status inválido.'); 
      return;
    }
    if (dispositivos.some(d => d.tag.toLowerCase() === tag.toLowerCase() && d.id !== id)) {
      aviso('Esta tag já existe. Use uma identificação diferente.'); 
      return;
    }

    const registro = { id: id || gerarId(), tag, descricao, lat, lng, tipo, status };
    if (id) dispositivos = dispositivos.map(d => d.id === id ? registro : d);
    else dispositivos.push(registro);

    atualizar(); 
    GeoMapa.localizar(registro); 
    limparFormulario();
    aviso(`Dispositivo ${tag} ${id ? 'atualizado' : 'cadastrado'} com sucesso.`);
  });

  $('#cancelar').addEventListener('click', limparFormulario);
  $('#busca').addEventListener('input', renderizarLista);
  $('#filtro').addEventListener('change', renderizarLista);
  $('#mostrarTodos').addEventListener('click', () => GeoMapa.mostrarTodos(filtrar()));
  
  // Logout integrado ao backend Node.js
  $('#sair').addEventListener('click', async () => {
    try {
      const resposta = await fetch('/api/logout', { method: 'POST' });
      const dados = await resposta.json();
      if (dados.redirect) {
        window.location.href = dados.redirect;
      }
    } catch {
      window.location.href = '/';
    }
  });

  $('#limpar').addEventListener('click', () => {
    if (!confirm('Apagar TODOS os dispositivos salvos neste navegador?')) return;
    dispositivos = []; 
    limparFormulario(); 
    atualizar(); 
    aviso('Dados excluídos.');
  });

  $('#exemplo').addEventListener('click', () => {
    const exemplos = [
      { tag:'DEV-TEATRO', tipo:'sensor', descricao:'Teatro Amazonas', lat:-3.1303, lng:-60.0234, status:'online' },
      { tag:'DEV-ARENA', tipo:'camera', descricao:'Arena da Amazônia', lat:-3.0833, lng:-60.0280, status:'offline' },
      { tag:'DEV-PONTA', tipo:'gateway', descricao:'Ponta Negra', lat:-3.0570, lng:-60.1010, status:'manutencao' }
    ];
    let adicionados = 0;
    exemplos.forEach(ex => {
      if (!dispositivos.some(d => d.tag.toLowerCase() === ex.tag.toLowerCase())) {
        dispositivos.push({ ...ex, id: gerarId() }); 
        adicionados++;
      }
    });
    atualizar(); 
    GeoMapa.mostrarTodos(dispositivos);
    aviso(`${adicionados} exemplos adicionados (sem duplicar tags).`);
  });

  $('#exportar').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(dispositivos, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); 
    link.href = url; 
    link.download = 'dispositivos-geolab.json';
    link.click(); 
    URL.revokeObjectURL(url); 
    aviso('Arquivo JSON exportado.');
  });

  renderizarLista();
  
  GeoMapa.iniciar((lat, lng) => {
    $('#lat').value = formatar(lat); 
    $('#lng').value = formatar(lng);
    aviso('Coordenadas selecionadas no mapa. Agora preencha a tag.');
  }).then(() => { 
    GeoMapa.desenhar(dispositivos); 
  }).catch(erro => {
    $('#mapaErro').hidden = false;
    $('#mapaErro').textContent = `${erro.message} Confira faturamento, API ativada e restrições HTTP referrer.`;
    aviso('A lista e o cadastro local continuam disponíveis sem a API do mapa.');
  });
}