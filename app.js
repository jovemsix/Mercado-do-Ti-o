const STORAGE_KEY = 'mercado-do-tiao-v1';
const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
const dateBR = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : '—';
let state = loadState();
function loadState() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { products: [], transactions: [] }; } catch { return { products: [], transactions: [] }; } }
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); render(); }
function esc(value='') { return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
const $ = id => document.getElementById(id);
const today = new Date(); $('today').textContent = today.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
function totals() { const income=state.transactions.filter(t=>t.type==='entrada').reduce((s,t)=>s+Number(t.amount),0); const expense=state.transactions.filter(t=>t.type==='saida').reduce((s,t)=>s+Number(t.amount),0); return {income,expense,balance:income-expense}; }
function render() {
  const q=$('product-search').value.trim().toLocaleLowerCase('pt-BR');
  const products=state.products.filter(p=>`${p.name} ${p.category}`.toLocaleLowerCase('pt-BR').includes(q));
  $('product-total').textContent=state.products.length; $('low-total').textContent=state.products.filter(p=>Number(p.quantity)<=3).length;
  $('product-count').textContent=`${products.length} ${products.length===1?'produto':'produtos'}`;
  $('products-empty').classList.toggle('hidden', products.length>0 || Boolean(q));
  $('products-body').innerHTML=products.map(p=>`<tr><td><span class="product-name">${esc(p.name)}</span><span class="subtext">Código ${esc(p.code)}</span></td><td><span class="category-pill">${esc(p.category||'Sem categoria')}</span></td><td><span class="quantity ${Number(p.quantity)<=3?'low-stock':''}">${Number(p.quantity)} un.</span></td><td class="money">${money(p.price)}</td><td class="actions"><button class="icon-button" data-edit="${p.id}" aria-label="Editar ${esc(p.name)}" title="Editar">✎</button><button class="icon-button" data-delete-product="${p.id}" aria-label="Excluir ${esc(p.name)}" title="Excluir">⌫</button></td></tr>`).join('');
  const t=totals(); $('balance').textContent=money(t.balance); $('finance-balance').textContent=money(t.balance); $('income-total').textContent=money(t.income); $('expense-total').textContent=money(t.expense);
  $('finance-empty').classList.toggle('hidden',state.transactions.length>0);
  $('transactions-body').innerHTML=[...state.transactions].sort((a,b)=>b.date.localeCompare(a.date)).map(x=>`<tr><td class="product-name">${esc(x.description)}</td><td><span class="type-pill ${x.type}">${x.type==='entrada'?'Entrada':'Saída'}</span></td><td>${dateBR(x.date)}</td><td class="money ${x.type==='entrada'?'positive':'negative'}">${x.type==='saida'?'- ':''}${money(x.amount)}</td><td class="actions"><button class="icon-button" data-delete-transaction="${x.id}" aria-label="Excluir movimentação">⌫</button></td></tr>`).join('');
}
let toastTimer; function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200);}
function openProduct(product){$('product-form').reset();$('product-id').value=product?.id||'';$('product-name').value=product?.name||'';$('product-category').value=product?.category||'';$('product-quantity').value=product?.quantity??0;$('product-price').value=product?.price??'';$('product-dialog-title').textContent=product?'Editar produto':'Novo produto';$('product-dialog').showModal();$('product-name').focus();}
function openTransaction(){$('transaction-form').reset();$('transaction-date').value=new Date().toISOString().slice(0,10);$('transaction-dialog').showModal();$('transaction-description').focus();}
document.querySelectorAll('.tab').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(tab=>tab.classList.toggle('active',tab===button));$('products-panel').classList.toggle('hidden',button.dataset.tab!=='products');$('finance-panel').classList.toggle('hidden',button.dataset.tab!=='finance');}));
$('add-product').onclick=$('empty-add-product').onclick=()=>openProduct(); $('add-transaction').onclick=$('empty-add-transaction').onclick=openTransaction; $('product-search').addEventListener('input',render);
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
$('product-form').addEventListener('submit',event=>{event.preventDefault();const id=$('product-id').value;const existing=state.products.find(p=>p.id===id);const product={id:id||crypto.randomUUID(),code:existing?.code||String(Date.now()).slice(-6),name:$('product-name').value.trim(),category:$('product-category').value.trim(),quantity:Number($('product-quantity').value),price:Number($('product-price').value)};if(id)state.products=state.products.map(p=>p.id===id?product:p);else state.products.push(product);save();$('product-dialog').close();toast(id?'Produto atualizado':'Produto cadastrado');});
$('transaction-form').addEventListener('submit',event=>{event.preventDefault();state.transactions.push({id:crypto.randomUUID(),description:$('transaction-description').value.trim(),type:$('transaction-type').value,amount:Number($('transaction-amount').value),date:$('transaction-date').value});save();$('transaction-dialog').close();toast('Movimentação registrada');});
document.addEventListener('click',event=>{const edit=event.target.closest('[data-edit]');if(edit){openProduct(state.products.find(p=>p.id===edit.dataset.edit));return;}const del=event.target.closest('[data-delete-product]');if(del){const p=state.products.find(x=>x.id===del.dataset.deleteProduct);if(p&&confirm(`Excluir o produto "${p.name}"?`)){state.products=state.products.filter(x=>x.id!==p.id);save();toast('Produto excluído');}return;}const tx=event.target.closest('[data-delete-transaction]');if(tx&&confirm('Excluir esta movimentação?')){state.transactions=state.transactions.filter(x=>x.id!==tx.dataset.deleteTransaction);save();toast('Movimentação excluída');}});
render();

// Exporta a lógica para testes com Node.js; no navegador, a aplicação continua normal.
if (typeof module !== 'undefined') {
  module.exports = {
    money,
    dateBR,
    esc,
    loadState,
    totals,
    render,
    getState: () => state,
    setState: value => { state = value; },
    save
  };
}
