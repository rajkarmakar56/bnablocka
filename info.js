import { db } from './firebaseConfig.js';
import { ref, onValue, get, set } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

const listEl = document.getElementById('list');

// Add-modal elements
const addBtn = document.getElementById('addBtn');
const addModal = document.getElementById('addModal');
const addForm = document.getElementById('addForm');
const cancelAdd = document.getElementById('cancelAdd');
const formErr = document.getElementById('formErr');

function openModal(){
  if(addModal) addModal.classList.add('open');
}
function closeModal(){
  if(addModal) addModal.classList.remove('open');
  if(addForm) addForm.reset();
  if(formErr) formErr.textContent = '';
}

if (addBtn) addBtn.addEventListener('click', openModal);
if (cancelAdd) cancelAdd.addEventListener('click', closeModal);

// handle submit to add new flatowner
if (addForm) addForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  if (formErr) formErr.textContent = '';

  const name = document.getElementById('nameInput')?.value.trim();
  const flat = document.getElementById('flatInput')?.value.trim();
  const contact = document.getElementById('contactInput')?.value.trim();
  const maintenance = document.getElementById('maintenanceInput')?.value.trim();
  const due = document.getElementById('dueInput')?.value.trim();

  // simple validation for required fields
  if (!name || !flat || !contact || maintenance === '' || due === '') {
    if (formErr) formErr.textContent = 'Please fill all required fields.';
    return;
  }

  const payload = {
    name,
    flat,
    contact,
    maintenance: Number(maintenance) || 0,
    due: Number(due) || 0
  };

  try {
    const submitBtn = document.getElementById('submitAdd');
    if (submitBtn) submitBtn.disabled = true;

    // determine next friendly key like flatowners1, flatowners2, ...
    const listSnap = await get(ref(db, 'flatowners'));
    const nodes = listSnap.val() || {};
    let max = 0;
    for (const k in nodes) {
      const m = String(k).match(/^flatowners(\d+)$/i);
      if (m) {
        const n = Number(m[1]);
        if (!Number.isNaN(n) && n > max) max = n;
      }
    }
    const nextKey = 'flatowners' + (max + 1);

    await set(ref(db, `flatowners/${nextKey}`), payload);

    if (submitBtn) submitBtn.disabled = false;
    closeModal();
  } catch (err) {
    console.error(err);
    if (formErr) formErr.textContent = 'Failed to save. Try again.';
  }
});

function renderEmpty(text){
  listEl.innerHTML = `<div class="empty">${text}</div>`;
}

function render(items){
  if (!items || Object.keys(items).length === 0) {
    renderEmpty('No flat owners found');
    return;
  }

  const rows = Object.keys(items).map(k => {
    const it = items[k] || {};
    const name = it.name || it.username || '—';
    const flat = it.flat || '';
    const maintenance = it.maintenance ?? '';
    const due = it.due ?? '';
    const contact = it.contact || '';

    return `
      <div class="row">
        <div class="left">
          <div class="name">${escapeHtml(name)}</div>
          <div class="meta">${flat} <span class="small">· Maintenance: ${maintenance} · Due: ${due}</span></div>
        </div>
        <div class="actions">
          ${contact ? `<a class="icon" href="tel:${contact}" title="Call">📞</a>` : ''}
          <div class="pill">₹ ${maintenance}</div>
          <a class="icon" href="#" title="Details">››</a>
        </div>
      </div>`;
  });

  listEl.innerHTML = rows.join('\n');
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
}

renderEmpty('Loading...');

onValue(ref(db, 'flatowners'), snap => {
  render(snap.val());
}, err => {
  console.error(err);
  renderEmpty('Failed to load data');
});
