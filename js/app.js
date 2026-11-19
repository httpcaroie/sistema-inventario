'use strict';

const currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' });
const titles = { dashboard: 'Resumen general', products: 'Productos', stock: 'Inventario', sales: 'Ventas', reports: 'Reportes' };
const emptyState = (message, detail = '') => `<tr><td colspan="8" class="table-empty">${message}${detail ? `<small>${detail}</small>` : ''}</td></tr>`;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

const config = window.APP_CONFIG || {};
let supabaseClient = null;
let state = { products: [], sales: [], movements: [] };
let toastTimer;

function showToast(message, type = 'success') {
  const toast = $('#toast');
  toast.textContent = message;
  toast.className = `toast visible ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 4200);
}

function setCloudStatus(message, isError = false) {
  const node = $('#cloud-status');
  if (!node) return;
  node.textContent = message;
  node.classList.toggle('cloud-error', isError);
}

function readLocalBackup() {
  try {
    const saved = JSON.parse(localStorage.getItem('inventario-academico-v1'));
    if (saved && Array.isArray(saved.products)) return saved;
  } catch (error) {
    console.warn('No fue posible leer la copia local:', error);
  }
  return { products: [], sales: [], movements: [] };
}

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category || '',
    price: Number(row.unit_price || 0),
    purchasePrice: Number(row.purchase_price || 0),
    stock: Number(row.stock || 0),
    minStock: Number(row.min_stock || 0),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
  };
}

async function importLocalProductsIfCloudIsEmpty(remoteProducts) {
  const backup = readLocalBackup();
  if (remoteProducts.length || !backup.products.length) return false;

  const rows = backup.products.map((item) => ({
    name: item.name,
    code: item.code,
    category: item.category || '',
    unit_price: Number(item.price || 0),
    purchase_price: Number(item.purchasePrice || 0),
    stock: Number(item.stock || 0),
    min_stock: Number(item.minStock || 0),
    ...(item.createdAt ? { created_at: new Date(item.createdAt).toISOString() } : {})
  }));

  const { error } = await supabaseClient.from('products').insert(rows);
  if (error) {
    console.error('Error al importar productos locales:', error);
    showToast('No se pudo importar la copia local: ' + error.message, 'error');
    return false;
  }
  showToast('Se importaron a la nube los productos que tenias guardados en este navegador.');
  return true;
}

async function loadRemoteState() {
  setCloudStatus('Conectando con la nube...');
  const [productsResult, movementsResult, salesResult, itemsResult] = await Promise.all([
    supabaseClient.from('products').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('inventory_movements').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('sales').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('sale_items').select('*')
  ]);

  const firstError = productsResult.error || movementsResult.error || salesResult.error || itemsResult.error;
  if (firstError) throw firstError;

  if (await importLocalProductsIfCloudIsEmpty(productsResult.data || [])) {
    return loadRemoteState();
  }

  const products = (productsResult.data || []).map(mapProduct);
  const productById = new Map(products.map((item) => [item.id, item]));
  const saleById = new Map((salesResult.data || []).map((item) => [item.id, item]));

  state.products = products;
  state.movements = (movementsResult.data || []).map((item) => ({
    id: item.id,
    productId: item.product_id,
    productName: productById.get(item.product_id)?.name || 'Producto eliminado',
    type: item.movement_type,
    quantity: Number(item.quantity),
    note: item.notes || '',
    createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now()
  }));
  state.sales = (itemsResult.data || []).map((item) => {
    const sale = saleById.get(item.sale_id);
    return {
      id: item.sale_id,
      productId: item.product_id,
      productName: productById.get(item.product_id)?.name || 'Producto eliminado',
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      total: Number(item.subtotal),
      createdAt: sale?.created_at ? new Date(sale.created_at).getTime() : Date.now()
    };
  }).sort((a, b) => b.createdAt - a.createdAt);

  renderAll();
  setCloudStatus('Conectado: datos sincronizados en la nube');
}

async function refreshAfterChange(successMessage) {
  try {
    await loadRemoteState();
    if (successMessage) showToast(successMessage);
  } catch (error) {
    console.error(error);
    setCloudStatus('Error de sincronizacion', true);
    showToast('El cambio se guardo, pero no se pudo actualizar la pantalla: ' + error.message, 'error');
  }
}

function showView(name) {
  if (!titles[name]) return;
  $$('.view').forEach((view) => view.classList.toggle('active', view.id === `view-${name}`));
  $$('.nav-link').forEach((button) => button.classList.toggle('active', button.dataset.view === name));
  $('#page-title').textContent = titles[name];
  if (name === 'stock' || name === 'sales') renderProductOptions();
  if (name === 'reports') renderReports();
}

function statusFor(product) {
  if (product.stock <= 0) return '<span class="pill danger">Agotado</span>';
  if (product.stock <= product.minStock) return '<span class="pill warning">Stock bajo</span>';
  return '<span class="pill success">Disponible</span>';
}

function renderDashboard() {
  const units = state.products.reduce((sum, item) => sum + item.stock, 0);
  const low = state.products.filter((item) => item.stock <= item.minStock).length;
  $('#stat-products').textContent = state.products.length;
  $('#stat-units').textContent = units;
  $('#stat-sales').textContent = new Set(state.sales.map((item) => item.id)).size;
  $('#stat-low').textContent = low;
  const activity = [
    ...state.movements.map((item) => ({ ...item, kind: item.type === 'in' ? 'Entrada de inventario' : 'Salida de inventario', amount: `${item.type === 'in' ? '+' : '-'}${item.quantity}` })),
    ...state.sales.map((item) => ({ ...item, kind: 'Venta registrada', amount: `-${item.quantity}` }))
  ].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
  $('#recent-activity').innerHTML = activity.length ? activity.map((item) => `<div class="activity-row"><span class="activity-bullet ${item.type === 'in' ? 'in' : item.type === 'out' ? 'out' : 'sale'}"></span><div class="activity-copy"><strong>${escapeHTML(item.kind)}</strong><small>${escapeHTML(item.productName)} · ${dateTime.format(new Date(item.createdAt))}</small></div><b>${escapeHTML(item.amount)}</b></div>`).join('') : '<div class="empty-state"><div class="empty-icon">&#9776;</div><strong>Aun no hay movimientos</strong><p>Registra productos, movimientos o ventas para ver la actividad.</p></div>';
}

function renderProducts() {
 const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
const query = normalize($('#product-search').value);
 const products = state.products.filter((item) =>
  normalize(`${item.name} ${item.code} ${item.category}`).includes(query)
);
  $('#product-count').textContent = `${products.length} ${products.length === 1 ? 'producto' : 'productos'}`;
  $('#products-table').innerHTML = products.length ? products.map((item) => `<tr><td><strong>${escapeHTML(item.name)}</strong></td><td>${escapeHTML(item.code)}</td><td>${escapeHTML(item.category)}</td><td>${currency.format(item.price)}</td><td>${item.stock}</td><td>${statusFor(item)}</td><td class="actions-cell"><button class="text-button" type="button" data-action="edit-product" data-id="${item.id}">Editar</button><button class="text-button danger-text" type="button" data-action="delete-product" data-id="${item.id}">Eliminar</button></td></tr>`).join('') : emptyState(query ? 'No se encontraron productos.' : 'Todavia no hay productos registrados.', 'Usa el boton Nuevo producto para comenzar.');
}

function renderProductOptions() {
  const options = state.products.map((item) => `<option value="${item.id}">${escapeHTML(item.name)} (${item.stock} disponibles)</option>`).join('');
  $('#stock-product').innerHTML = `<option value="">Selecciona un producto</option>${options}`;
  $('#sale-product').innerHTML = `<option value="">Selecciona un producto</option>${options}`;
}

function renderStock() {
  const rows = [...state.movements].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
  $('#stock-table').innerHTML = rows.length ? rows.map((item) => `<tr><td>${dateTime.format(new Date(item.createdAt))}</td><td>${escapeHTML(item.productName)}</td><td><span class="pill ${item.type === 'in' ? 'success' : 'warning'}">${item.type === 'in' ? 'Entrada' : 'Salida'}</span></td><td>${item.quantity}</td><td>${escapeHTML(item.note || '—')}</td></tr>`).join('') : emptyState('No hay movimientos registrados.');
}

function renderSales() {
  const rows = [...state.sales].slice(0, 20);
  $('#sales-table').innerHTML = rows.length ? rows.map((item) => `<tr><td>${dateTime.format(new Date(item.createdAt))}</td><td>${escapeHTML(item.productName)}</td><td>${item.quantity}</td><td>${currency.format(item.total)}</td></tr>`).join('') : emptyState('Todavia no hay ventas registradas.');
}

function renderReports() {
  const inventoryValue = state.products.reduce((sum, item) => sum + item.price * item.stock, 0);
  const revenue = state.sales.reduce((sum, item) => sum + item.total, 0);
  const sold = state.sales.reduce((sum, item) => sum + item.quantity, 0);
  const empty = state.products.filter((item) => item.stock === 0).length;
  $('#report-value').textContent = currency.format(inventoryValue);
  $('#report-revenue').textContent = currency.format(revenue);
  $('#report-units-sold').textContent = sold;
  $('#report-empty').textContent = empty;
  $('#report-table').innerHTML = state.products.length ? state.products.map((item) => `<tr><td>${escapeHTML(item.name)}</td><td>${escapeHTML(item.code)}</td><td>${item.stock}</td><td>${currency.format(item.price)}</td><td>${currency.format(item.price * item.stock)}</td><td>${statusFor(item)}</td></tr>`).join('') : emptyState('No hay datos para generar el reporte.');
}

function renderAll() {
  renderDashboard();
  renderProducts();
  renderProductOptions();
  renderStock();
  renderSales();
  renderReports();
}

function openProductDialog(product = null) {
  const form = $('#product-form');
  form.reset();
  $('#product-id').value = product?.id || '';
  $('#product-dialog-title').textContent = product ? 'Editar producto' : 'Nuevo producto';
  $('#product-name').value = product?.name || '';
  $('#product-code').value = product?.code || '';
  $('#product-category').value = product?.category || '';
  $('#product-price').value = product?.price ?? '';
  $('#product-stock').value = product?.stock ?? 0;
  $('#product-min-stock').value = product?.minStock ?? 5;
  $('#product-stock').disabled = Boolean(product);
  $('#product-dialog').showModal();
}

function closeProductDialog() {
  $('#product-dialog').close();
  $('#product-stock').disabled = false;
}

$$('.nav-link').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
$$('[data-go]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.go)));
$('#today-label').textContent = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
$('#add-product-button').addEventListener('click', () => openProductDialog());
$('#close-product-dialog').addEventListener('click', closeProductDialog);
$('#cancel-product').addEventListener('click', closeProductDialog);
$('#product-search').addEventListener('input', renderProducts);

$('#product-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabaseClient) return showToast('No hay conexion con la base de datos.', 'error');
  const id = $('#product-id').value;
  const name = $('#product-name').value.trim();
  const code = $('#product-code').value.trim().toUpperCase();
  const category = $('#product-category').value.trim();
  const price = Number($('#product-price').value);
  const stock = Number($('#product-stock').value);
  const minStock = Number($('#product-min-stock').value);
  if (!name || !code || !category || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 || !Number.isInteger(minStock) || minStock < 0) return showToast('Revisa los datos del producto.', 'error');

  const codigoRepetido = state.products.some(
  (producto) =>
    String(producto.code || '').trim().toUpperCase() === code &&
    producto.id !== id
);

if (codigoRepetido) {
  return showToast(
    'Ya existe un producto con ese codigo. Ingresa uno diferente.',
    'error'
  );
}
  const values = { name, code, category, unit_price: price, min_stock: minStock };
  let result;
  if (id) {
    result = await supabaseClient.from('products').update(values).eq('id', id);
  } else {
    result = await supabaseClient.from('products').insert({ ...values, stock });
  }
  if (result.error) {
    const message = result.error.code === '23505' ? 'Ya existe un producto con ese codigo.' : result.error.message;
    return showToast('No se pudo guardar el producto: ' + message, 'error');
  }
  closeProductDialog();
  await refreshAfterChange(id ? 'Producto actualizado en la nube.' : 'Producto registrado en la nube.');
});

$('#products-table').addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const product = state.products.find((item) => item.id === button.dataset.id);
  if (!product) return;
  if (button.dataset.action === 'edit-product') return openProductDialog(product);
  if (button.dataset.action === 'delete-product') {
    if (!window.confirm(`Deseas eliminar el producto "${product.name}"? Esta accion no se puede deshacer.`)) return;
    const { error } = await supabaseClient.from('products').delete().eq('id', product.id);
    if (error) return showToast('No se puede eliminar: el producto puede tener movimientos o ventas asociados. ' + error.message, 'error');
    await refreshAfterChange('Producto eliminado de la nube.');
  }
});

$('#stock-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const product = state.products.find((item) => item.id === $('#stock-product').value);
  const type = $('#stock-type').value;
  const quantity = Number($('#stock-quantity').value);
  const note = $('#stock-note').value.trim();
  if (!product) return showToast('Selecciona un producto.', 'error');
  if (!Number.isInteger(quantity) || quantity <= 0) return showToast('La cantidad debe ser un numero entero mayor que cero.', 'error');
  if (type === 'out' && quantity > product.stock) return showToast(`Stock insuficiente. Disponibles: ${product.stock}.`, 'error');
  const newStock = product.stock + (type === 'in' ? quantity : -quantity);
  const { error: updateError } = await supabaseClient.from('products').update({ stock: newStock }).eq('id', product.id);
  if (updateError) return showToast('No se pudo actualizar el stock: ' + updateError.message, 'error');
  const { error: movementError } = await supabaseClient.from('inventory_movements').insert({ product_id: product.id, movement_type: type, quantity, notes: note });
  if (movementError) {
    await supabaseClient.from('products').update({ stock: product.stock }).eq('id', product.id);
    return showToast('No se registro el movimiento. Se restauro el stock anterior: ' + movementError.message, 'error');
  }
  $('#stock-form').reset();
  await refreshAfterChange('Movimiento guardado en la nube.');
});

function updateSalePreview() {
  const product = state.products.find((item) => item.id === $('#sale-product').value);
  const quantity = Math.max(0, Number($('#sale-quantity').value) || 0);
  $('#sale-price').value = product ? currency.format(product.price) : '';
  $('#sale-total').textContent = product ? currency.format(product.price * quantity) : currency.format(0);
}

$('#sale-product').addEventListener('change', updateSalePreview);
$('#sale-quantity').addEventListener('input', updateSalePreview);
$('#sale-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const product = state.products.find((item) => item.id === $('#sale-product').value);
  const quantity = Number($('#sale-quantity').value);
  if (!product) return showToast('Selecciona un producto.', 'error');
  if (!Number.isInteger(quantity) || quantity <= 0) return showToast('La cantidad debe ser un numero entero mayor que cero.', 'error');
  if (quantity > product.stock) return showToast(`No hay unidades suficientes. Disponibles: ${product.stock}.`, 'error');
  const total = product.price * quantity;
  const { data: sale, error: saleError } = await supabaseClient.from('sales').insert({ total }).select('id').single();
  if (saleError) return showToast('No se pudo crear la venta: ' + saleError.message, 'error');
  const { error: itemError } = await supabaseClient.from('sale_items').insert({ sale_id: sale.id, product_id: product.id, quantity, unit_price: product.price, subtotal: total });
  if (itemError) {
    await supabaseClient.from('sales').delete().eq('id', sale.id);
    return showToast('No se pudo guardar el detalle de la venta: ' + itemError.message, 'error');
  }
  const { error: stockError } = await supabaseClient.from('products').update({ stock: product.stock - quantity }).eq('id', product.id);
  if (stockError) {
    await supabaseClient.from('sales').delete().eq('id', sale.id);
    return showToast('No se pudo descontar el inventario; la venta fue cancelada: ' + stockError.message, 'error');
  }
  $('#sale-form').reset();
  updateSalePreview();
  await refreshAfterChange(`Venta registrada por ${currency.format(total)} en la nube.`);
});

$('#export-report').addEventListener('click', () => {
  if (!state.products.length) return showToast('No hay productos para exportar.', 'error');
  const rows = [['Producto', 'Codigo', 'Categoria', 'Stock', 'Precio unitario COP', 'Valor inventario COP', 'Estado']];
  state.products.forEach((item) => rows.push([item.name, item.code, item.category, item.stock, item.price, item.stock * item.price, item.stock === 0 ? 'Agotado' : item.stock <= item.minStock ? 'Stock bajo' : 'Disponible']));
  const csv = '\uFEFF' + rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = 'reporte-inventario.csv'; link.click(); URL.revokeObjectURL(url);
  showToast('Reporte CSV descargado.');
});

$('#product-dialog').addEventListener('click', (event) => {
  if (event.target === $('#product-dialog')) closeProductDialog();
});

async function initialize() {
  $('#today-label').textContent = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  renderAll();
  if (!window.supabase || !window.supabase.createClient) {
    setCloudStatus('No se pudo cargar la libreria de Supabase', true);
    showToast('Revisa tu conexion a internet para cargar Supabase.', 'error');
    return;
  }
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    setCloudStatus('Falta configurar Supabase', true);
    showToast('Falta la URL o la clave publica de Supabase.', 'error');
    return;
  }
  supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey);
  try {
    await loadRemoteState();
    showToast('Sistema conectado a Supabase. Los datos se comparten entre computadores.');
  } catch (error) {
    console.error('Error de conexion con Supabase:', error);
    setCloudStatus('Error de conexion con Supabase', true);
    showToast('No fue posible conectar con la nube: ' + error.message, 'error');
  }
}

initialize();
