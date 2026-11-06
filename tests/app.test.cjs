const test = require('node:test');
const assert = require('node:assert/strict');

function makeApp(storageValue = null) {
  const elements = new Map();
  const localStorage = {
    value: storageValue,
    getItem() { return this.value; },
    setItem(_key, value) { this.value = value; }
  };
  function element(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id, value: '', textContent: '', innerHTML: '', dataset: {}, handlers: {},
        classList: { toggle() {} },
        addEventListener(type, handler) { this.handlers[type] = handler; },
        showModal() {}, close() {}, focus() {}, reset() {}
      });
    }
    return elements.get(id);
  }
  global.document = {
    getElementById: element,
    querySelectorAll() { return []; },
    addEventListener() {}
  };
  global.localStorage = localStorage;
  global.confirm = () => true;
  const appPath = require.resolve('../app.js');
  delete require.cache[appPath];
  const app = require(appPath);
  return { app, elements, localStorage };
}

test('formata valores em reais', () => {
  const { app } = makeApp();
  assert.equal(app.money(12.5), 'R$ 12,50');
});

test('escapa caracteres especiais antes de exibir texto', () => {
  const { app } = makeApp();
  assert.equal(app.esc('<b" &>'), '&lt;b&quot; &amp;&gt;');
});

test('usa estado vazio quando os dados armazenados estão inválidos', () => {
  const { app } = makeApp('{dados inválidos');
  assert.deepEqual(app.loadState(), { products: [], transactions: [] });
});

test('carrega dados válidos do armazenamento local', () => {
  const saved = { products: [{ id: 'p1', name: 'Feijão' }], transactions: [] };
  const { app } = makeApp(JSON.stringify(saved));
  assert.deepEqual(app.loadState(), saved);
});

test('integra produtos e movimentações no resumo, nas tabelas e no armazenamento', () => {
  const { app, elements, localStorage } = makeApp();
  const state = {
    products: [{ id: 'p1', code: '123', name: 'Arroz', category: 'Mercearia', quantity: 3, price: 7.5 }],
    transactions: [
      { id: 't1', description: 'Venda', type: 'entrada', amount: 20, date: '2026-11-05' },
      { id: 't2', description: 'Compra', type: 'saida', amount: 8, date: '2026-11-05' }
    ]
  };
  app.setState(state);
  app.save();
  assert.equal(elements.get('product-total').textContent, 1);
  assert.equal(elements.get('low-total').textContent, 1);
  assert.equal(elements.get('products-body').innerHTML.includes('Arroz'), true);
  assert.equal(elements.get('income-total').textContent, 'R$ 20,00');
  assert.equal(elements.get('expense-total').textContent, 'R$ 8,00');
  assert.equal(elements.get('balance').textContent, 'R$ 12,00');
  assert.equal(elements.get('transactions-body').innerHTML.includes('Compra'), true);
  assert.deepEqual(JSON.parse(localStorage.value), state);
});
