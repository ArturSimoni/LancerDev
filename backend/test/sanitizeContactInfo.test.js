const test = require('node:test');
const assert = require('node:assert/strict');
const sanitizeContactInfo = require('../src/utils/sanitizeContactInfo');

test('oculta e-mail, telefone e links mantendo o restante da mensagem', () => {
  const message =
    'Fale comigo em pessoa@example.com ou +55 (11) 99999-1234. Site: https://example.com/perfil';

  assert.equal(
    sanitizeContactInfo(message),
    'Fale comigo em [contato ocultado] ou [contato ocultado]. Site: [contato ocultado]'
  );
});

test('oculta e-mails escritos com separadores para evitar detecção direta', () => {
  assert.equal(
    sanitizeContactInfo('Meu e-mail é pessoa [at] example [dot] com'),
    'Meu e-mail é [contato ocultado]'
  );
});

test('oculta perfis sociais e nomes de usuário', () => {
  assert.equal(
    sanitizeContactInfo('Instagram: @dev_lancer e também @lancer.dev'),
    '[contato ocultado] e também [contato ocultado]'
  );
});

test('preserva mensagens comuns e números curtos', () => {
  const message = 'A reunião será às 14:30. O marco 2 ficou pronto.';

  assert.equal(sanitizeContactInfo(message), message);
});

test('rejeita entrada que não seja texto', () => {
  assert.throws(
    () => sanitizeContactInfo(null),
    {
      name: 'TypeError',
      message: 'A mensagem deve ser um texto.'
    }
  );
});
