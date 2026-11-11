'use strict';
// Camada de armazenamento: guarda apenas dados simulados no navegador.
const StorageDispositivos = (() => {
  const CHAVE = 'geolab_dispositivos_v1';
  const STATUS = ['online', 'offline', 'manutencao'];
  const TIPOS = ['sensor', 'camera', 'gateway'];
  function valido(d) {
    return d && typeof d.id === 'string' && typeof d.tag === 'string' && d.tag.length > 0 &&
      typeof d.descricao === 'string' && TIPOS.includes(d.tipo) && STATUS.includes(d.status) &&
      Number.isFinite(d.lat) && d.lat >= -90 && d.lat <= 90 &&
      Number.isFinite(d.lng) && d.lng >= -180 && d.lng <= 180;
  }
  function listar() {
    try {
      const dados = JSON.parse(localStorage.getItem(CHAVE) || '[]');
      return Array.isArray(dados) ? dados.filter(valido) : [];
    } catch (erro) { console.warn('Armazenamento inválido:', erro); return []; }
  }
  function salvar(lista) { localStorage.setItem(CHAVE, JSON.stringify(lista)); }
  return { listar, salvar };
})();
