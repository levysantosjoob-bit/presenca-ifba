/* Presença IFBA — integração Supabase v2 */
const SUPABASE_URL = 'https://kvcqgceqgmagqlcazrxa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pQ65ZzJSgmqHElLumvPFTQ_BblhviDt';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const app = document.getElementById('app');
const toastEl = document.getElementById('toast');
let currentEvent = null;
let currentRows = [];
let toastTimer;

const CATALOG = {
  'Técnico Integrado': ['Eletromecânica', 'Eletrônica', 'Informática', 'Meio Ambiente'],
  'Técnico Subsequente': ['Eletromecânica', 'Eletrônica', 'Informática', 'Segurança do Trabalho'],
  'Graduação': ['Engenharia Ambiental', 'Engenharia Civil', 'Engenharia Elétrica', 'Engenharia Mecânica', 'Licenciatura em Química', 'Sistemas de Informação'],
  'Pós-Graduação': ['Especialização Lato Sensu em Desenvolvimento Web']
};

function esc(value='') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function notify(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 4200);
}
function setLoading(message='Carregando…') {
  app.innerHTML = `<section class="panel loading"><span class="spinner"></span><p>${esc(message)}</p></section>`;
}
function formatDate(value) {
  if (!value) return 'Não definido';
  return new Date(value).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'});
}
function eventState(event) {
  const now = Date.now();
  if (!event.is_active) return {label:'Desativado', cls:'closed', open:false};
  if (event.start_at && new Date(event.start_at).getTime() > now) return {label:'Agendado', cls:'scheduled', open:false};
  if (event.end_at && new Date(event.end_at).getTime() < now) return {label:'Encerrado', cls:'closed', open:false};
  return {label:'Aberto', cls:'', open:true};
}
function toLocalInput(value) {
  if (!value) return '';
  const d = new Date(value);
  const local = new Date(d.getTime() - d.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,16);
}
function localToIso(value) { return value ? new Date(value).toISOString() : null; }
function eventUrl(id) { return `${location.href.split('#')[0]}#evento=${encodeURIComponent(id)}`; }
function readRoute() {
  const hash = location.hash || '';
  const match = hash.match(/^#evento=([0-9a-f-]{36})$/i);
  return match ? {type:'event', id:match[1]} : {type:'admin'};
}
async function route() {
  const r = readRoute();
  if (r.type === 'event') return renderPublicEvent(r.id);
  const {data:{session}} = await db.auth.getSession();
  if (session) return renderDashboard();
  return renderLogin();
}
window.addEventListener('hashchange', route);
db.auth.onAuthStateChange((_event, session) => {
  if (readRoute().type === 'admin') session ? renderDashboard() : renderLogin();
});

function renderLogin(message='') {
  app.innerHTML = `
    <section class="panel narrow">
      <p class="eyebrow">Acesso restrito</p>
      <h1>Área administrativa</h1>
      <p class="muted">Entre com seu e-mail e senha cadastrados no Supabase Auth.</p>
      ${message ? `<div class="alert error">${esc(message)}</div>` : ''}
      <form id="login-form">
        <label for="email">E-mail institucional ou cadastrado <span class="required">*</span></label>
        <input id="email" type="email" autocomplete="username" required placeholder="seuemail@exemplo.com">
        <label for="password">Senha <span class="required">*</span></label>
        <input id="password" type="password" autocomplete="current-password" required placeholder="Sua senha">
        <div class="actions" style="margin-top:18px"><button class="btn block" type="submit">Entrar no painel</button></div>
      </form>
      <div class="divider"></div>
      <p class="hint">Estudantes: acessem o formulário pelo link ou QR Code disponibilizado pela organização do evento.</p>
    </section>`;
  document.getElementById('login-form').addEventListener('submit', login);
}
async function login(e) {
  e.preventDefault();
  const button = e.currentTarget.querySelector('button');
  button.disabled = true; button.textContent = 'Entrando…';
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const {error} = await db.auth.signInWithPassword({email, password});
  if (error) renderLogin('Não foi possível entrar. Confira o e-mail e a senha.');
  else renderDashboard();
}
async function logout() {
  const {error} = await db.auth.signOut();
  if (error) notify('Não foi possível encerrar a sessão.');
  location.hash = 'inicio';
  renderLogin();
}

async function renderDashboard() {
  setLoading('Carregando seus eventos…');
  const {data:{session}} = await db.auth.getSession();
  if (!session) return renderLogin();
  const {data:events, error} = await db.from('events').select('*').order('created_at', {ascending:false});
  if (error) {
    app.innerHTML = `<section class="panel"><div class="alert error">Erro ao carregar eventos: ${esc(error.message)}</div><button class="btn secondary" onclick="logout()">Sair</button></section>`;
    return;
  }
  const list = (events || []).map(event => {
    const st = eventState(event);
    return `<article class="event-item">
      <div><span class="status ${st.cls}">${st.label}</span><h3>${esc(event.title)}</h3>
      <div class="event-meta">Criado em ${formatDate(event.created_at)} · Início: ${formatDate(event.start_at)} · Fim: ${formatDate(event.end_at)}</div>
      ${event.description ? `<p class="muted">${esc(event.description)}</p>` : ''}</div>
      <div class="actions">
        <button class="btn small" onclick="showEvent('${event.id}')">Gerenciar</button>
        <button class="btn secondary small" onclick="toggleEvent('${event.id}', ${!event.is_active})">${event.is_active ? 'Desativar' : 'Ativar'}</button>
      </div>
    </article>`;
  }).join('');
  app.innerHTML = `
    <section class="panel">
      <div class="actions" style="justify-content:space-between"><div><p class="eyebrow">Administração</p><h1>Painel de eventos</h1><p class="muted">Gerencie os eventos e acompanhe os registros de presença.</p></div><button class="btn secondary" onclick="logout()">Sair</button></div>
      <div class="actions" style="margin:18px 0 8px"><button class="btn" onclick="eventEditor()">＋ Criar evento</button></div>
      <div class="divider"></div>
      <h2>Eventos cadastrados</h2>
      <div class="event-list">${list || '<div class="empty">Nenhum evento cadastrado. Clique em “Criar evento” para começar.</div>'}</div>
    </section>`;
}

function eventEditor(event=null) {
  currentEvent = event;
  app.innerHTML = `
    <section class="panel">
      <p class="eyebrow">${event ? 'Editar evento' : 'Novo evento'}</p>
      <h1>${event ? 'Atualizar informações' : 'Criar evento'}</h1>
      <form id="event-form">
        <label for="event-title">Nome do evento <span class="required">*</span></label>
        <input id="event-title" required maxlength="180" value="${esc(event?.title || '')}" placeholder="Ex.: Semana de Ciência e Tecnologia">
        <label for="event-description">Descrição</label>
        <textarea id="event-description" maxlength="2000" placeholder="Informações para os participantes">${esc(event?.description || '')}</textarea>
        <div class="field-grid">
          <div><label for="event-start">Abertura das presenças</label><input id="event-start" type="datetime-local" value="${toLocalInput(event?.start_at)}"><p class="hint">Deixe vazio para não definir horário inicial.</p></div>
          <div><label for="event-end">Encerramento das presenças</label><input id="event-end" type="datetime-local" value="${toLocalInput(event?.end_at)}"><p class="hint">Deixe vazio para não definir horário final.</p></div>
        </div>
        <label class="inline-check" style="margin-top:18px"><input id="event-active" type="checkbox" ${event?.is_active !== false ? 'checked' : ''}> Evento ativo</label>
        <div class="actions" style="margin-top:22px"><button class="btn" type="submit">${event ? 'Salvar alterações' : 'Criar evento'}</button><button class="btn secondary" type="button" onclick="renderDashboard()">Cancelar</button></div>
      </form>
    </section>`;
  document.getElementById('event-form').addEventListener('submit', saveEvent);
}
async function saveEvent(e) {
  e.preventDefault();
  const start = document.getElementById('event-start').value;
  const end = document.getElementById('event-end').value;
  if (start && end && new Date(start) >= new Date(end)) return notify('O encerramento deve ser posterior à abertura.');
  const payload = {
    title: document.getElementById('event-title').value.trim(),
    description: document.getElementById('event-description').value.trim() || null,
    start_at: localToIso(start), end_at: localToIso(end),
    is_active: document.getElementById('event-active').checked
  };
  const button = e.currentTarget.querySelector('button[type="submit"]'); button.disabled = true; button.textContent = 'Salvando…';
  let result;
  if (currentEvent?.id) result = await db.from('events').update(payload).eq('id', currentEvent.id).select().single();
  else result = await db.from('events').insert(payload).select().single();
  if (result.error) { notify(`Erro ao salvar: ${result.error.message}`); button.disabled=false; button.textContent='Tentar novamente'; return; }
  notify('Evento salvo com sucesso.');
  showEvent(result.data.id);
}
async function toggleEvent(id, active) {
  const {error} = await db.from('events').update({is_active:active}).eq('id',id);
  if (error) notify(`Não foi possível alterar: ${error.message}`); else {notify(active?'Evento ativado.':'Evento desativado.');renderDashboard();}
}
async function showEvent(id) {
  setLoading('Carregando informações do evento…');
  const [{data:event,error:eventError},{count,error:countError}] = await Promise.all([
    db.from('events').select('*').eq('id',id).single(),
    db.from('attendances').select('*',{count:'exact',head:true}).eq('event_id',id)
  ]);
  if (eventError) {app.innerHTML=`<section class="panel"><div class="alert error">${esc(eventError.message)}</div><button class="btn secondary" onclick="renderDashboard()">Voltar</button></section>`;return;}
  const st=eventState(event), url=eventUrl(id);
  app.innerHTML=`
    <section class="panel">
      <div class="actions" style="justify-content:space-between"><div><p class="eyebrow">Gerenciamento do evento</p><h1>${esc(event.title)}</h1><span class="status ${st.cls}">${st.label}</span></div><button class="btn secondary" onclick="renderDashboard()">← Painel</button></div>
      <p class="muted">${esc(event.description || 'Sem descrição.')}</p>
      <div class="stats"><div class="stat"><strong>${countError?'—':(count||0)}</strong><span>Presenças registradas</span></div><div class="stat"><strong>${event.is_active?'Sim':'Não'}</strong><span>Evento ativo</span></div><div class="stat"><strong>${st.open?'Aberto':st.label}</strong><span>Situação das inscrições</span></div></div>
      <div class="qr-layout"><div id="event-qr" class="qr-box"></div><div style="flex:1;min-width:220px"><h3>Link e QR Code do evento</h3><p class="hint">Compartilhe este endereço com os estudantes. O QR Code abre diretamente o formulário deste evento.</p><div class="link-copy"><input id="event-link" readonly value="${esc(url)}"><button class="btn secondary" onclick="copyEventLink()">Copiar</button></div><button class="btn secondary small" style="margin-top:10px" onclick="downloadQr()">Baixar QR Code</button></div></div>
      <div class="divider"></div>
      <div class="actions"><button class="btn" onclick="loadResults('${id}')">Consultar presenças</button><button class="btn secondary" onclick="eventEditor(${JSON.stringify(event).replace(/"/g,'&quot;')})">Editar evento</button><button class="btn danger" onclick="confirmDeleteEvent('${id}')">Excluir evento</button></div>
    </section>`;
  const qrTarget=document.getElementById('event-qr');
  if (window.QRCode) new QRCode(qrTarget,{text:url,width:190,height:190,colorDark:'#173b25',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
  else qrTarget.textContent='Biblioteca de QR Code indisponível.';
}
function copyEventLink() {
  const input=document.getElementById('event-link');
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(input.value).then(()=>notify('Link copiado!')).catch(()=>{input.select();document.execCommand('copy');notify('Link copiado!');});
  else {input.select();document.execCommand('copy');notify('Link copiado!');}
}
function downloadQr() {
  const canvas=document.querySelector('#event-qr canvas');
  const img=document.querySelector('#event-qr img');
  const data=canvas?.toDataURL('image/png') || img?.src;
  if (!data) return notify('QR Code ainda não está disponível.');
  const a=document.createElement('a');a.href=data;a.download='qrcode-presenca-ifba.png';a.click();
}
function confirmDeleteEvent(id) {
  if (!confirm('Excluir este evento? Todas as presenças vinculadas também serão excluídas. Esta ação não pode ser desfeita.')) return;
  deleteEvent(id);
}
async function deleteEvent(id) {
  const {error}=await db.from('events').delete().eq('id',id);
  if (error) notify(`Não foi possível excluir: ${error.message}`);
  else {notify('Evento excluído.');renderDashboard();}
}

async function loadResults(id) {
  setLoading('Consultando presenças…');
  const [{data:event,error:eventError},{data:rows,error}] = await Promise.all([
    db.from('events').select('id,title').eq('id',id).single(),
    db.from('attendances').select('*').eq('event_id',id).order('created_at',{ascending:false})
  ]);
  if (eventError || error) {
    app.innerHTML=`<section class="panel"><div class="alert error">Não foi possível consultar os registros: ${esc((error||eventError).message)}</div><button class="btn secondary" onclick="showEvent('${id}')">Voltar</button></section>`;return;
  }
  currentRows=rows||[];
  const tableRows=currentRows.map(row=>`<tr><td>${esc(formatDate(row.created_at))}</td><td>${esc(row.full_name)}</td><td>${esc(row.enrollment)}</td><td>${esc(row.modality)}</td><td>${esc(row.course)}</td><td>${esc(row.period)}</td><td>${esc(row.class_name||'—')}</td></tr>`).join('');
  app.innerHTML=`<section class="panel"><p class="eyebrow">Relatório de presença</p><h1>${esc(event.title)}</h1><p class="muted">${currentRows.length} registro(s) encontrado(s).</p><div class="actions"><button class="btn" onclick="exportCsv('${id}')">Exportar CSV</button><button class="btn secondary" onclick="showEvent('${id}')">Voltar ao evento</button></div><div class="divider"></div>${currentRows.length?`<div class="table-wrap"><table><thead><tr><th>Data e hora</th><th>Nome completo</th><th>Matrícula</th><th>Modalidade</th><th>Curso</th><th>Ano/semestre</th><th>Turma</th></tr></thead><tbody>${tableRows}</tbody></table></div>`:'<div class="empty">Ainda não há presenças registradas neste evento.</div>'}</section>`;
}
function exportCsv(id) {
  const header=['Data e hora','Nome completo','Matrícula','Modalidade','Curso','Ano/semestre','Turma'];
  const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  const lines=[header.map(q).join(';'),...currentRows.map(r=>[new Date(r.created_at).toLocaleString('pt-BR'),r.full_name,r.enrollment,r.modality,r.course,r.period,r.class_name||''].map(q).join(';'))];
  const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`presencas-${id}.csv`;a.click();URL.revokeObjectURL(url);
}

async function renderPublicEvent(id) {
  setLoading('Carregando formulário de presença…');
  const {data:event,error}=await db.from('events').select('id,title,description,is_active,start_at,end_at').eq('id',id).maybeSingle();
  if (error || !event) {
    app.innerHTML='<section class="panel narrow"><p class="eyebrow">Presença IFBA</p><h1>Evento indisponível</h1><div class="alert">Não foi possível localizar este evento. Confira se o link está correto ou fale com a organização.</div></section>';
    return;
  }
  const state=eventState(event);
  if (!event.is_active) return closedEvent(event,'Este evento está desativado no momento.');
  if (event.start_at && Date.now()<new Date(event.start_at).getTime()) return closedEvent(event,`As inscrições ainda não começaram. Abertura prevista: ${formatDate(event.start_at)}.`);
  if (event.end_at && Date.now()>new Date(event.end_at).getTime()) return closedEvent(event,'O período de registro de presença foi encerrado.');
  app.innerHTML=`
    <section class="panel narrow">
      <p class="eyebrow">Registro de presença · IFBA</p>
      <h1>${esc(event.title)}</h1>
      ${event.description?`<p class="muted">${esc(event.description)}</p>`:''}
      <div class="alert success">Evento aberto para registro de presença.</div>
      <form id="attendance-form">
        <label for="full-name">Nome completo <span class="required">*</span></label>
        <input id="full-name" autocomplete="name" maxlength="180" required>
        <label for="enrollment">Número de matrícula <span class="required">*</span></label>
        <input id="enrollment" inputmode="numeric" maxlength="40" required>
        <label for="modality">Modalidade <span class="required">*</span></label>
        <select id="modality" required><option value="">Selecione</option>${Object.keys(CATALOG).map(x=>`<option>${esc(x)}</option>`).join('')}</select>
        <label for="course">Curso <span class="required">*</span></label>
        <select id="course" required disabled><option value="">Selecione primeiro a modalidade</option></select>
        <label for="period">Ano / semestre <span class="required">*</span></label>
        <select id="period" required disabled><option value="">Selecione primeiro o curso</option></select>
        <div id="class-wrap" class="hidden"><label for="class-name">Turma <span class="required">*</span></label><select id="class-name"><option value="">Selecione</option><option>Turma A</option><option>Turma B</option></select></div>
        <div class="actions" style="margin-top:22px"><button class="btn block" type="submit">Registrar presença</button></div>
        <p class="hint">Os dados serão utilizados para controle de participação neste evento. Não envie o formulário mais de uma vez.</p>
      </form>
    </section>`;
  document.getElementById('modality').addEventListener('change', updateCourses);
  document.getElementById('course').addEventListener('change', updatePeriods);
  document.getElementById('period').addEventListener('change', updateClassField);
  document.getElementById('attendance-form').addEventListener('submit', e=>submitAttendance(e,event));
}
function closedEvent(event,message) {
  app.innerHTML=`<section class="panel narrow"><p class="eyebrow">Presença IFBA</p><h1>${esc(event.title)}</h1><div class="alert">${esc(message)}</div><p class="muted">Se você acredita que isso é um erro, procure a organização do evento.</p></section>`;
}
function updateCourses() {
  const modality=document.getElementById('modality').value;
  const course=document.getElementById('course');
  course.innerHTML='<option value="">Selecione o curso</option>'+(CATALOG[modality]||[]).map(c=>`<option>${esc(c)}</option>`).join('');
  course.disabled=!modality;
  const period=document.getElementById('period');period.innerHTML='<option value="">Selecione primeiro o curso</option>';period.disabled=true;
  updateClassField();
}
function periodsFor(modality,course) {
  if (modality==='Técnico Integrado') return ['1º ano','2º ano','3º ano','4º ano'];
  if (modality==='Técnico Subsequente') return ['1º semestre','2º semestre','3º semestre','4º semestre'];
  if (modality==='Graduação') return Array.from({length:10},(_,i)=>`${i+1}º semestre`);
  return ['Especialização'];
}
function updatePeriods() {
  const modality=document.getElementById('modality').value;
  const course=document.getElementById('course').value;
  const period=document.getElementById('period');
  period.innerHTML='<option value="">Selecione</option>'+(course?periodsFor(modality,course):[]).map(p=>`<option>${p}</option>`).join('');
  period.disabled=!course;
  updateClassField();
}
function updateClassField() {
  const modality=document.getElementById('modality').value;
  const course=document.getElementById('course').value;
  const period=document.getElementById('period').value;
  const show=modality==='Técnico Integrado' && course==='Eletrônica' && ['1º ano','2º ano','3º ano','4º ano'].includes(period);
  const wrap=document.getElementById('class-wrap');
  wrap.classList.toggle('hidden',!show);
  document.getElementById('class-name').required=show;
  if (!show) document.getElementById('class-name').value='';
}
async function submitAttendance(e,event) {
  e.preventDefault();
  // Revalidar abertura/encerramento no momento do envio.
  const now=Date.now();
  if (!event.is_active || (event.start_at && now<new Date(event.start_at).getTime()) || (event.end_at && now>new Date(event.end_at).getTime())) {
    notify('O período de presença deste evento não está aberto.'); return renderPublicEvent(event.id);
  }
  const button=e.currentTarget.querySelector('button[type="submit"]');button.disabled=true;button.textContent='Registrando…';
  const modality=document.getElementById('modality').value;
  const course=document.getElementById('course').value;
  const period=document.getElementById('period').value;
  const className=document.getElementById('class-name').value;
  const payload={
    event_id:event.id,
    full_name:document.getElementById('full-name').value.trim(),
    enrollment:document.getElementById('enrollment').value.trim(),
    modality,course,period,
    class_name:className || null
  };
  if (!payload.full_name || !payload.enrollment || !modality || !course || !period || (modality==='Técnico Integrado' && course==='Eletrônica' && ['1º ano','2º ano','3º ano','4º ano'].includes(period) && !className)) {
    notify('Confira os campos obrigatórios.');button.disabled=false;button.textContent='Registrar presença';return;
  }
  const {error}=await db.from('attendances').insert(payload);
  if (error) {
    if (error.code==='23505' || /unique_attendance_per_event/i.test(error.message)) {
      app.innerHTML=`<section class="panel narrow"><div class="alert error"><strong>Presença já registrada.</strong><br>Esta matrícula já possui um registro neste evento.</div><p class="muted">Se você acredita que houve um erro, procure a organização.</p></section>`;
    } else {
      notify('Não foi possível registrar a presença. Tente novamente ou procure a organização.');button.disabled=false;button.textContent='Tentar novamente';
    }
    return;
  }
  app.innerHTML=`<section class="panel narrow"><div class="alert success"><strong>Presença registrada com sucesso!</strong></div><h1>Obrigado, ${esc(payload.full_name)}.</h1><p class="muted">Seu registro para “${esc(event.title)}” foi recebido.</p></section>`;
}

// A página administrativa é a rota padrão; os links públicos usam #evento=UUID.
route();
