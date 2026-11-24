/* Presença IFBA — versão reconstruída com Supabase */
const SUPABASE_URL = 'https://kvcqgceqgmagqlcazrxa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pQ65ZzJSgmqHElLumvPFTQ_BblhviDt';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const app = document.getElementById('app');
const toast = document.getElementById('toast');

const CATALOG = {
  'Técnico Integrado':['Eletromecânica','Eletrônica','Informática','Meio Ambiente'],
  'Técnico Subsequente':['Eletromecânica','Eletrônica','Informática','Segurança do Trabalho'],
  'Graduação':['Engenharia Ambiental','Engenharia Civil','Engenharia Elétrica','Engenharia Mecânica','Licenciatura em Química','Sistemas de Informação'],
  'Pós-Graduação':['Especialização Lato Sensu em Desenvolvimento Web']
};
const SYSTEM_FIELDS = [
  {key:'nome',label:'Nome completo',type:'text',required:true},
  {key:'matricula',label:'Número de matrícula',type:'text',required:true},
  {key:'modalidade',label:'Modalidade',type:'modality',required:true},
  {key:'curso',label:'Curso',type:'course',required:true},
  {key:'periodo',label:'Série / semestre / ano',type:'period',required:true}
];
let currentEvent=null, currentResponses=[], draftQuestions=[], draftFields=[], selectedBanner=null;

function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function say(m){toast.textContent=m;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),4000);}
function loading(m='Carregando…'){app.innerHTML=`<section class="panel loading">${esc(m)}</section>`;}
function fmt(v){return v?new Date(v).toLocaleString('pt-BR'):'Não definido';}
function localValue(v){if(!v)return '';const d=new Date(v);return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
function iso(v){return v?new Date(v).toISOString():null;}
function urlFor(id){return `${location.href.split('#')[0]}#f-${id}`;}
function route(){const m=(location.hash||'').match(/^#f-([0-9a-f-]{36})$/i);if(m)return publicForm(m[1]);return dashboardOrLogin();}
window.addEventListener('hashchange',route);
async function dashboardOrLogin(){const {data:{session}}=await db.auth.getSession();session?dashboard():login();}
db.auth.onAuthStateChange((_e,s)=>{if(!location.hash.startsWith('#f-'))s?dashboard():login();});

function login(message=''){
 app.innerHTML=`<section class="panel narrow"><p class="eyebrow">Acesso restrito</p><h1>Área administrativa</h1><p class="muted">Entre com o e-mail e a senha cadastrados no sistema.</p>${message?`<div class="alert error">${esc(message)}</div>`:''}<form id="login-form"><label>E-mail</label><input id="email" type="email" autocomplete="username" required><label>Senha</label><input id="password" type="password" autocomplete="current-password" required><div class="actions"><button class="block" type="submit">Entrar</button></div></form><p class="hint">Estudantes: utilizem o link ou QR Code enviado pela organização.</p></section>`;
 document.getElementById('login-form').addEventListener('submit',async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;b.textContent='Entrando…';const {error}=await db.auth.signInWithPassword({email:document.getElementById('email').value.trim(),password:document.getElementById('password').value});if(error)login('E-mail ou senha inválidos, ou usuário sem acesso administrativo.');else dashboard();});
}
async function logout(){await db.auth.signOut();location.hash='';login();}
async function dashboard(){
 loading('Carregando formulários…');
 const {data:events,error}=await db.from('events').select('*').order('created_at',{ascending:false});
 if(error){app.innerHTML=`<section class="panel"><div class="alert error">${esc(error.message)}</div><button onclick="logout()">Sair</button></section>`;return;}
 app.innerHTML=`<section class="panel"><div class="actions" style="justify-content:space-between"><div><p class="eyebrow">Administração</p><h1>Painel do Presença IFBA</h1><p class="muted">Crie formulários, compartilhe QR Codes e consulte as respostas.</p></div><button class="secondary" onclick="logout()">Sair</button></div><div class="actions"><button onclick="newForm()">＋ Criar formulário</button></div><div class="divider"></div><h2>Formulários criados</h2>${events.length?events.map(ev=>{const st=state(ev);return `<article class="event-item"><div><span class="status ${st.cls}">${st.label}</span><h3>${esc(ev.title)}</h3><div class="event-meta">Criado em ${fmt(ev.created_at)} · Abertura: ${fmt(ev.start_at)} · Encerramento: ${fmt(ev.end_at)}</div></div><div class="actions"><button class="small" onclick="manage('${ev.id}')">Visualizar</button><button class="small secondary" onclick="editForm('${ev.id}')">Editar</button></div></article>`}).join(''):'<div class="empty">Nenhum formulário cadastrado.</div>'}</section>`;
}
function state(e){const n=Date.now();if(!e.is_active)return{label:'Desativado',cls:'closed'};if(e.start_at&&n<new Date(e.start_at))return{label:'Agendado',cls:'scheduled'};if(e.end_at&&n>new Date(e.end_at))return{label:'Encerrado',cls:'closed'};return{label:'Aberto',cls:''};}
function defaultFields(){return ['nome','matricula','modalidade','curso','periodo'];}
function newForm(){currentEvent=null;selectedBanner=null;draftFields=defaultFields();draftQuestions=[];editor();}
async function editForm(id){loading('Abrindo formulário…');const {data,error}=await db.from('events').select('*').eq('id',id).single();if(error)return say(error.message);currentEvent=data;selectedBanner=null;const c=data.form_config||{};draftFields=c.fields||defaultFields();draftQuestions=c.questions||[];editor(data);}
function editor(ev=null){
 const cfg=ev?.form_config||{};
 app.innerHTML=`<section class="panel"><p class="eyebrow">${ev?'Edição':'Novo formulário'}</p><h1>${ev?'Editar formulário':'Cadastrar formulário'}</h1>
 <form id="builder">
 <label>Nome do formulário *</label><input id="title" required maxlength="180" value="${esc(ev?.title||'')}">
 <label>Descrição / orientações</label><textarea id="description">${esc(ev?.description||'')}</textarea>
 <h3>Imagem no topo do formulário</h3><p class="hint">Escolha uma foto ou banner do computador ou celular. A imagem será armazenada no Supabase.</p><input id="banner" type="file" accept="image/*">${ev?.image_url?`<img class="banner" id="banner-preview" src="${esc(ev.image_url)}">`:'<img class="banner hidden" id="banner-preview">'}
 <h3>Campos de identificação</h3><p class="hint">Marque os dados que o estudante deverá preencher.</p>
 <div id="fields">${SYSTEM_FIELDS.map(f=>`<label class="inline-check"><input type="checkbox" data-field="${f.key}" ${draftFields.includes(f.key)?'checked':''}>${f.label}</label>`).join('')}</div>
 <h3>Perguntas adicionais</h3><div id="questions">${questionEditorHtml()}</div><button type="button" class="secondary" onclick="addQuestion()">＋ Adicionar pergunta</button>
 <h3>Código da aula</h3><label class="inline-check"><input id="use-code" type="checkbox" ${ev?.access_code?'checked':''} onchange="document.getElementById('code-wrap').classList.toggle('hidden',!this.checked)"> Exigir código para registrar presença</label><div id="code-wrap" class="${ev?.access_code?'':'hidden'}"><input id="access-code" placeholder="Ex.: IFBA2026" value="${esc(ev?.access_code||'')}"></div>
 <h3>Horário de funcionamento</h3><div class="grid2"><div><label>Abertura</label><input id="start" type="datetime-local" value="${localValue(ev?.start_at)}"></div><div><label>Encerramento</label><input id="end" type="datetime-local" value="${localValue(ev?.end_at)}"></div></div>
 <label class="inline-check"><input id="active" type="checkbox" ${ev?.is_active!==false?'checked':''}> Formulário ativo</label>
 <div class="actions"><button type="submit">${ev?'Salvar alterações':'Publicar formulário'}</button><button type="button" class="secondary" onclick="${ev?`manage('${ev.id}')`:'dashboard()'}">Cancelar</button></div></form></section>`;
 document.getElementById('banner').addEventListener('change',previewBanner);
 document.getElementById('builder').addEventListener('submit',saveForm);
}
function questionEditorHtml(){return draftQuestions.map((q,i)=>`<div class="question"><div class="question-row"><input placeholder="Digite a pergunta" value="${esc(q.label)}" oninput="draftQuestions[${i}].label=this.value"><select onchange="draftQuestions[${i}].type=this.value;editor(currentEvent)"><option value="text" ${q.type==='text'?'selected':''}>Resposta livre</option><option value="choice" ${q.type==='choice'?'selected':''}>Múltipla escolha</option></select><button type="button" class="danger small" onclick="draftQuestions.splice(${i},1);editor(currentEvent)">Remover</button></div><label class="inline-check"><input type="checkbox" ${q.required?'checked':''} onchange="draftQuestions[${i}].required=this.checked"> Resposta obrigatória</label>${q.type==='choice'?`<label>Opções (uma por linha)</label><textarea oninput="draftQuestions[${i}].options=this.value">${esc((q.options||[]).join('\n'))}</textarea>`:''}</div>`).join('')||'<p class="hint">Nenhuma pergunta adicional.</p>';}
function addQuestion(){draftQuestions.push({label:'',type:'text',required:false,options:[]});editor(currentEvent);}
function previewBanner(e){const f=e.target.files[0],img=document.getElementById('banner-preview');if(!f)return;if(!f.type.startsWith('image/'))return say('Escolha um arquivo de imagem.');img.src=URL.createObjectURL(f);img.classList.remove('hidden');}
async function saveForm(e){
 e.preventDefault();
 const title=document.getElementById('title').value.trim();if(!title)return;
 const start=document.getElementById('start').value,end=document.getElementById('end').value;if(start&&end&&new Date(start)>=new Date(end))return say('O encerramento precisa ser posterior à abertura.');
 const fields=[...document.querySelectorAll('[data-field]:checked')].map(x=>x.dataset.field);
 if(!fields.length&&!draftQuestions.length)return say('Selecione ao menos um campo ou crie uma pergunta.');
 const questions=draftQuestions.map(q=>({...q,label:(q.label||'').trim(),options:q.type==='choice'?String(q.options||'').split('\n').map(x=>x.trim()).filter(Boolean):[]})).filter(q=>q.label);
 if(questions.some(q=>q.type==='choice'&&q.options.length<2))return say('Cada pergunta de múltipla escolha precisa de pelo menos duas opções.');
 const useCode=document.getElementById('use-code').checked,code=useCode?document.getElementById('access-code').value.trim().toUpperCase():null;
 if(useCode&&!code)return say('Digite o código da aula.');
 const payload={title,description:document.getElementById('description').value.trim()||null,start_at:iso(start),end_at:iso(end),is_active:document.getElementById('active').checked,form_config:{fields,questions,requires_code:useCode},access_code:code};
 const b=e.submitter;b.disabled=true;b.textContent='Salvando…';
 let result=currentEvent?await db.from('events').update(payload).eq('id',currentEvent.id).select().single():await db.from('events').insert(payload).select().single();
 if(result.error){b.disabled=false;b.textContent='Tentar novamente';return say('Erro ao salvar: '+result.error.message);}
 let ev=result.data;
 const file=document.getElementById('banner').files[0];
 if(file){const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');const path=`${ev.id}/${Date.now()}.${ext}`;const up=await db.storage.from('event-banners').upload(path,file,{upsert:true,contentType:file.type});if(up.error){say('Formulário salvo, mas a imagem não foi enviada: '+up.error.message);}else{const {data}=db.storage.from('event-banners').getPublicUrl(path);const upd=await db.from('events').update({image_url:data.publicUrl}).eq('id',ev.id).select().single();if(!upd.error)ev=upd.data;}}
 say('Formulário salvo.');manage(ev.id);
}
async function manage(id){
 loading('Carregando formulário…');
 const [{data:ev,error},{count}]=await Promise.all([db.from('events').select('*').eq('id',id).single(),db.from('form_responses').select('*',{count:'exact',head:true}).eq('event_id',id)]);
 if(error){app.innerHTML=`<section class="panel"><div class="alert error">${esc(error.message)}</div><button onclick="dashboard()">Voltar</button></section>`;return;}
 const u=urlFor(id),st=state(ev);
 app.innerHTML=`<section class="panel"><div class="actions" style="justify-content:space-between"><div><p class="eyebrow">Formulário publicado</p><h1>${esc(ev.title)}</h1><span class="status ${st.cls}">${st.label}</span></div><button class="secondary" onclick="dashboard()">← Painel</button></div>${ev.image_url?`<img class="banner" src="${esc(ev.image_url)}">`:''}<p class="muted">${esc(ev.description||'Sem descrição.')}</p><div class="statrow"><div class="stat"><strong>${count||0}</strong><span>Respostas recebidas</span></div><div class="stat"><strong>${ev.is_active?'Sim':'Não'}</strong><span>Formulário ativo</span></div></div><div class="divider"></div><div class="qr-layout"><div id="qr" class="qr-box"></div><div style="flex:1;min-width:220px"><h3>Link e QR Code</h3><p class="hint">Compartilhe este link com os estudantes.</p><div class="link-row"><input id="public-link" readonly value="${esc(u)}"><button class="secondary" onclick="copyLink()">Copiar</button></div><div class="actions"><button class="secondary" onclick="downloadQr()">Baixar QR Code</button></div></div></div><div class="divider"></div><div class="actions"><button onclick="responses('${id}')">Consultar respostas</button><button class="secondary" onclick="editForm('${id}')">Editar formulário</button><button class="secondary" onclick="toggleActive('${id}',${!ev.is_active})">${ev.is_active?'Desativar':'Ativar'}</button><button class="danger" onclick="removeForm('${id}')">Excluir</button></div></section>`;
 new QRCode(document.getElementById('qr'),{text:u,width:190,height:190});
}
function copyLink(){const x=document.getElementById('public-link');x.select();navigator.clipboard?.writeText(x.value).then(()=>say('Link copiado!')).catch(()=>{document.execCommand('copy');say('Link copiado!')});}
function downloadQr(){const c=document.querySelector('#qr canvas');if(!c)return;const a=document.createElement('a');a.href=c.toDataURL('image/png');a.download='qrcode-presenca-ifba.png';a.click();}
async function toggleActive(id,active){const {error}=await db.from('events').update({is_active:active}).eq('id',id);if(error)say(error.message);else manage(id);}
async function removeForm(id){if(!confirm('Excluir este formulário e todas as respostas? Esta ação não pode ser desfeita.'))return;const {error}=await db.from('events').delete().eq('id',id);if(error)say('Não foi possível excluir: '+error.message);else{say('Formulário excluído.');dashboard();}}
async function responses(id){
 loading('Consultando respostas…');
 const [{data:ev,error:e1},{data:rows,error:e2}]=await Promise.all([db.from('events').select('id,title').eq('id',id).single(),db.from('form_responses').select('*').eq('event_id',id).order('created_at',{ascending:false})]);
 if(e1||e2){app.innerHTML=`<section class="panel"><div class="alert error">${esc((e1||e2).message)}</div><button onclick="manage('${id}')">Voltar</button></section>`;return;}
 currentResponses=rows||[];
 const keys=[...new Set(currentResponses.flatMap(r=>Object.keys(r.answers||{})))];
 app.innerHTML=`<section class="panel"><p class="eyebrow">Relatório</p><h1>${esc(ev.title)}</h1><p class="muted">${rows.length} resposta(s).</p><div class="actions"><button onclick="exportResponses('${id}')">Exportar CSV</button><button class="secondary" onclick="manage('${id}')">Voltar ao formulário</button></div><div class="table-wrap">${rows.length?`<table><thead><tr><th>Data e hora</th>${keys.map(k=>`<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td>${fmt(r.created_at)}</td>${keys.map(k=>`<td>${esc(r.answers?.[k]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table>`:'<div class="empty">Ainda não há respostas.</div>'}</div></section>`;
}
function exportResponses(id){const keys=[...new Set(currentResponses.flatMap(r=>Object.keys(r.answers||{})))];const q=x=>'"'+String(x??'').replace(/"/g,'""')+'"';const lines=[['Data e hora',...keys].map(q).join(';'),...currentResponses.map(r=>[new Date(r.created_at).toLocaleString('pt-BR'),...keys.map(k=>r.answers?.[k]??'')].map(q).join(';'))];const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`respostas-${id}.csv`;a.click();URL.revokeObjectURL(a.href);}

function periodsFor(modality){if(modality==='Técnico Integrado')return['1º ano','2º ano','3º ano','4º ano'];if(modality==='Técnico Subsequente')return['1º semestre','2º semestre','3º semestre','4º semestre'];if(modality==='Graduação')return Array.from({length:10},(_,i)=>`${i+1}º semestre`);return['Especialização'];}
async function publicForm(id){
 loading('Abrindo formulário…');
 const {data:ev,error}=await db.from('events').select('id,title,description,image_url,is_active,start_at,end_at,form_config').eq('id',id).maybeSingle();
 if(error||!ev){app.innerHTML='<section class="panel narrow"><h1>Formulário não encontrado</h1><p>Confira o link ou fale com a organização.</p></section>';return;}
 const now=Date.now();if(!ev.is_active)return closed(ev,'Este formulário está desativado.');if(ev.start_at&&now<new Date(ev.start_at))return closed(ev,'As respostas ainda não estão abertas. Abertura: '+fmt(ev.start_at));if(ev.end_at&&now>new Date(ev.end_at))return closed(ev,'O período de respostas foi encerrado.');
 const cfg=ev.form_config||{},fields=cfg.fields||defaultFields(),questions=cfg.questions||[];
 const html=fields.map(key=>renderSystemField(key)).join('')+questions.map((q,i)=>renderQuestion(q,i)).join('');
 app.innerHTML=`<section class="panel narrow">${ev.image_url?`<img class="banner" src="${esc(ev.image_url)}">`:''}<p class="eyebrow">Registro de presença · IFBA</p><h1>${esc(ev.title)}</h1>${ev.description?`<p class="muted">${esc(ev.description)}</p>`:''}<div class="alert success">Formulário disponível para preenchimento.</div><form id="public-form">${html}${ev.form_config?.requires_code?'<label>Código da aula *</label><input id="code" autocomplete="off" required>':''}<div class="actions"><button class="block" type="submit">Enviar resposta</button></div><p class="hint">Confira seus dados antes de enviar. A resposta será vinculada a este formulário.</p></form></section>`;
 document.getElementById('modality')?.addEventListener('change',updateCourses);
 document.getElementById('course')?.addEventListener('change',updatePeriods);
 document.getElementById('period')?.addEventListener('change',updateClass);
 document.getElementById('public-form').addEventListener('submit',e=>submitPublic(e,ev));
}
function renderSystemField(key){
 const f=SYSTEM_FIELDS.find(x=>x.key===key);if(!f)return '';
 if(key==='modalidade')return `<label>Modalidade *</label><select id="modality" required><option value="">Selecione</option>${Object.keys(CATALOG).map(x=>`<option>${esc(x)}</option>`).join('')}</select>`;
 if(key==='curso')return '<label>Curso *</label><select id="course" required disabled><option>Selecione a modalidade primeiro</option></select>';
 if(key==='periodo')return '<label>Série / semestre / ano *</label><select id="period" required disabled><option>Selecione o curso primeiro</option></select><div id="class-wrap" class="hidden"><label>Turma *</label><select id="class-name"><option value="">Selecione</option><option>Turma A</option><option>Turma B</option></select></div>';
 return `<label>${f.label} *</label><input id="${key}" required maxlength="180">`;
}
function renderQuestion(q,i){if(q.type==='choice')return `<div class="question"><label>${esc(q.label)}${q.required?' *':''}</label>${(q.options||[]).map((o,j)=>`<label class="option"><input type="radio" name="q-${i}" value="${esc(o)}" ${q.required?'required':''}>${esc(o)}</label>`).join('')}</div>`;return `<label>${esc(q.label)}${q.required?' *':''}</label><input id="q-${i}" ${q.required?'required':''}>`;}
function closed(ev,msg){app.innerHTML=`<section class="panel narrow"><p class="eyebrow">Presença IFBA</p><h1>${esc(ev.title)}</h1><div class="alert">${esc(msg)}</div><p class="muted">Se precisar, procure a organização do evento.</p></section>`;}
function updateCourses(){const m=document.getElementById('modality').value,c=document.getElementById('course');c.innerHTML='<option value="">Selecione o curso</option>'+(CATALOG[m]||[]).map(x=>`<option>${esc(x)}</option>`).join('');c.disabled=!m;const p=document.getElementById('period');p.innerHTML='<option value="">Selecione o curso primeiro</option>';p.disabled=true;updateClass();}
function updatePeriods(){const m=document.getElementById('modality').value,c=document.getElementById('course').value,p=document.getElementById('period');p.innerHTML='<option value="">Selecione</option>'+(c?periodsFor(m):[]).map(x=>`<option>${x}</option>`).join('');p.disabled=!c;updateClass();}
function updateClass(){const m=document.getElementById('modality')?.value,c=document.getElementById('course')?.value,p=document.getElementById('period')?.value;const show=m==='Técnico Integrado'&&c==='Eletrônica'&&['1º ano','2º ano','3º ano','4º ano'].includes(p);const w=document.getElementById('class-wrap');if(w){w.classList.toggle('hidden',!show);document.getElementById('class-name').required=show;if(!show)document.getElementById('class-name').value='';}}
async function submitPublic(e,ev){
 e.preventDefault();const now=Date.now();if(!ev.is_active||(ev.start_at&&now<new Date(ev.start_at))||(ev.end_at&&now>new Date(ev.end_at)))return closed(ev,'O período de respostas não está aberto.');
 const submittedCode=ev.form_config?.requires_code?document.getElementById('code').value.trim().toUpperCase():null;
 const cfg=ev.form_config||{},fields=cfg.fields||defaultFields(),answers={};
 if(fields.includes('nome'))answers['Nome completo']=document.getElementById('nome').value.trim();
 if(fields.includes('matricula'))answers['Número de matrícula']=document.getElementById('matricula').value.trim();
 if(fields.includes('modalidade'))answers['Modalidade']=document.getElementById('modality').value;
 if(fields.includes('curso'))answers['Curso']=document.getElementById('course').value;
 if(fields.includes('periodo'))answers['Série / semestre / ano']=document.getElementById('period').value;
 if(fields.includes('periodo')&&document.getElementById('class-name')&&!document.getElementById('class-wrap').classList.contains('hidden'))answers['Turma']=document.getElementById('class-name').value;
 (cfg.questions||[]).forEach((q,i)=>{answers[q.label]=q.type==='choice'?(document.querySelector(`[name="q-${i}"]:checked`)?.value||''):document.getElementById(`q-${i}`).value.trim();});
 if(Object.values(answers).some(v=>!String(v).trim()&&v!==''))return say('Confira os campos.');
 const b=e.submitter;b.disabled=true;b.textContent='Enviando…';
 const enrollment=answers['Número de matrícula']||null;
 const {error}=await db.rpc('submit_form_response',{p_event_id:ev.id,p_code:submittedCode,p_enrollment:enrollment,p_answers:answers});
 if(error){b.disabled=false;b.textContent='Tentar novamente';if(error.code==='23505')return say('Esta matrícula já registrou presença neste formulário.');if((error.message||'').toLowerCase().includes('código'))return say('Código da aula incorreto.');return say('Não foi possível enviar: '+error.message);}
 app.innerHTML=`<section class="panel narrow"><div class="alert success"><strong>Resposta registrada com sucesso!</strong></div><h1>Obrigado${answers['Nome completo']?', '+esc(answers['Nome completo']):''}!</h1><p class="muted">Seu registro foi recebido pelo Presença IFBA.</p></section>`;
}
route();
