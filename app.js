
(async function bootstrapPresencaIFBA(){
  async function ensureSupabaseSDK(){
    if(window.supabase && typeof window.supabase.createClient==='function') return true;
    const urls=[
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
      'https://unpkg.com/@supabase/supabase-js@2'
    ];
    for(const src of urls){
      try{
        await new Promise((resolve,reject)=>{
          const script=document.createElement('script');
          script.src=src; script.async=true;
          script.onload=resolve; script.onerror=()=>reject(new Error('Não foi possível carregar a biblioteca de autenticação.'));
          document.head.appendChild(script);
        });
        if(window.supabase && typeof window.supabase.createClient==='function') return true;
      }catch(err){ console.warn('Falha ao carregar SDK:',src,err); }
    }
    return false;
  }
  const sdkReady=await ensureSupabaseSDK();
  if(!sdkReady){
    const form=document.getElementById('loginForm');
    if(form){let msg=document.getElementById('loginError');if(!msg){msg=document.createElement('div');msg.id='loginError';msg.setAttribute('role','alert');msg.style.cssText='color:#b42318;background:#fef3f2;padding:12px;border-radius:8px;margin:12px 0';form.appendChild(msg)}msg.textContent='Não foi possível carregar o serviço de autenticação. Verifique sua conexão e recarregue a página.';}
    return;
  }
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const STORE='presencaIFBA_full_demo_v1';
// Integração real: eventos e respostas ficam no Supabase, não no armazenamento local.
const SUPABASE_URL='https://kvcqgceqgmagqlcazrxa.supabase.co';
const SUPABASE_ANON_KEY='sb_publishable_pQ65ZzJSgmqHElLumvPFTQ_BblhviDt';
const supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
let currentUser=null;
function fromDb(row){const c=row.form_config||{};return {id:row.id,title:row.title,description:row.description||'',start:toLocalInput(row.start_at),end:toLocalInput(row.end_at),code:row.access_code||'',active:row.is_active!==false,createdAt:row.created_at,fields:c.fields||Object.keys(fieldLabels),keepDefaults:c.keepDefaults!==false,questions:c.questions||[],gps:!!c.gps,locations:c.locations||[],banner:row.image_url||c.banner||'',settings:c.settings||JSON.parse(JSON.stringify(DEFAULTS))}}
function toLocalInput(v){if(!v)return '';const d=new Date(v);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
function toIso(v){return v?new Date(v).toISOString():null}
function configOf(e){return {fields:[...e.fields],keepDefaults:e.keepDefaults,questions:JSON.parse(JSON.stringify(e.questions||[])),gps:!!e.gps,locations:JSON.parse(JSON.stringify(e.locations||[])),settings:JSON.parse(JSON.stringify(e.settings||db.settings)),saved_at:new Date().toISOString()}}
function dbPayload(e){return {title:e.title,description:e.description||null,start_at:toIso(e.start),end_at:toIso(e.end),access_code:e.code||null,is_active:e.active,form_config:configOf(e),image_url:e.banner&&!e.banner.startsWith('data:')?e.banner:null}}
async function uploadEventBanner(dataUrl,eventId){
 if(!dataUrl||!dataUrl.startsWith('data:'))return dataUrl||null;
 const blob=await (await fetch(dataUrl)).blob();
 if(!blob.type.startsWith('image/'))throw new Error('O arquivo selecionado não é uma imagem válida.');
 const ext=blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg';
 const path=`${eventId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
 const {error}=await supabase.storage.from('event-banners').upload(path,blob,{contentType:blob.type,cacheControl:'3600',upsert:false});
 if(error)throw new Error('Não foi possível enviar a foto ao armazenamento: '+error.message);
 const {data}=supabase.storage.from('event-banners').getPublicUrl(path);
 if(!data?.publicUrl)throw new Error('A foto foi enviada, mas o Supabase não gerou o endereço público.');
 return data.publicUrl;
}
async function fetchEvents(){const {data,error}=await supabase.from('events').select('*').order('created_at',{ascending:false});if(error)throw error;db.events=(data||[]).map(fromDb);return db.events}
function showLoadError(prefix,error){
 console.error(prefix,error);
 const message=prefix+': '+(error?.message||error?.details||'verifique a conexão e as permissões do Supabase.');
 if(prefix.toLowerCase().includes('login')){
  let box=$('#loginError');
  if(!box){box=document.createElement('div');box.id='loginError';box.setAttribute('role','alert');box.style.cssText='color:#b42318;background:#fef3f2;padding:12px;border-radius:8px;margin:12px 0';$('#loginForm').appendChild(box)}
  box.textContent=message;
 }
 toast(message);
}

const DEFAULTS={
 modalities:['Integrado','Subsequente','Superior','Pós-graduação'],
 courses:[
  'Técnico em Eletromecânica','Técnico em Eletrônica','Técnico em Informática','Técnico em Meio Ambiente',
  'Técnico em Edificações','Técnico em Segurança do Trabalho',
  'Engenharia Ambiental','Engenharia Civil','Engenharia Elétrica','Engenharia Mecânica',
  'Licenciatura em Química','Sistemas de Informação',
  'Especialização Lato Sensu em Desenvolvimento de Sistemas Web'
 ],
 years:['1º ano','2º ano','3º ano','4º ano','1º semestre','2º semestre','3º semestre','4º semestre','5º semestre','6º semestre','7º semestre','8º semestre','9º semestre','10º semestre'],
 classes:['A','B','C','D'],
 locations:[
  {id:'loc-aud',name:'Auditório',lat:-14.841642,lng:-40.877270,radius:10},
  {id:'loc-marta',name:'Rua Marta Vasconcelos, 125 — Centro',lat:-14.850005,lng:-40.844120,radius:10},
  {id:'loc-3',name:'Localidade 3',lat:-14.853657,lng:-40.819272,radius:10}
 ]
};
let db=loadDB(),editingId=null,currentResponseEvent=null,questionSeq=0,uploadedBanner='',locationDrafts=[];
function loadDB(){
 try{
  const saved=JSON.parse(localStorage.getItem(STORE));
  if(!saved)return {events:[],settings:JSON.parse(JSON.stringify(DEFAULTS)),responses:{}};
  saved.settings=saved.settings||{};
  // Atualiza a lista padrão sem apagar configurações personalizadas já salvas no navegador.
  for(const key of ['modalities','courses','years','classes']){
   const current=Array.isArray(saved.settings[key])?saved.settings[key]:[];
   saved.settings[key]=[...new Set([...current,...DEFAULTS[key]])];
  }
  if(!Array.isArray(saved.settings.locations))saved.settings.locations=JSON.parse(JSON.stringify(DEFAULTS.locations));
  if(!Array.isArray(saved.events))saved.events=[];
  if(!saved.responses)saved.responses={};
  return saved;
 }catch(e){return {events:[],settings:JSON.parse(JSON.stringify(DEFAULTS)),responses:{}}}
}
function persist(){localStorage.setItem(STORE,JSON.stringify(db))}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(m){let t=$('#toast');t.textContent=m;t.classList.remove('hidden');clearTimeout(window._toastTimer);window._toastTimer=setTimeout(()=>t.classList.add('hidden'),3200)}
function showView(id){['dashboardView','builderView','settingsView','responsesView'].forEach(x=>$('#'+x).classList.toggle('hidden',x!==id))}
async function startApp(){ $('#loginScreen').classList.add('hidden');$('#appHeader').classList.remove('hidden');$('#appMain').classList.remove('hidden');showView('dashboardView');try{await fetchEvents();drawEvents()}catch(err){showLoadError('Não foi possível carregar os eventos',err)}}
$('#loginForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const email=$('#adminEmail').value.trim(),password=$('#adminPassword').value;
 if(!email||!password){showLoadError('Falha no login',new Error('Informe e-mail e senha para continuar.'));return}
 const btn=$('#loginForm').querySelector('[type="submit"]');
 const originalText=btn?.textContent;
 if(btn){btn.disabled=true;btn.textContent='Verificando acesso…'}
 const oldError=$('#loginError');if(oldError)oldError.remove();
 try{
  const {data,error}=await supabase.auth.signInWithPassword({email,password});
  if(error)throw error;
  if(!data?.user)throw new Error('O Supabase não retornou uma sessão de usuário.');
  currentUser=data.user;
  const {data:admin,error:adminError}=await supabase.rpc('is_admin');
  if(adminError)throw new Error('O login foi aceito, mas não foi possível confirmar a autorização administrativa: '+adminError.message);
  if(admin!==true){await supabase.auth.signOut();currentUser=null;throw new Error('O e-mail e a senha foram aceitos, mas esta conta não está autorizada na tabela admin_users.');}
  await startApp();
  toast('Login realizado com sucesso.');
 }catch(err){
  showLoadError('Falha no login',err);
 }finally{
  if(btn){btn.disabled=false;btn.textContent=originalText||'Entrar'}
 }
});
$('#togglePassword').onclick=()=>{let p=$('#adminPassword');p.type=p.type==='password'?'text':'password';$('#togglePassword').textContent=p.type==='password'?'Mostrar senha':'Ocultar senha'};
$('#logoutBtn').onclick=async()=>{await supabase.auth.signOut();currentUser=null;$('#appMain').classList.add('hidden');$('#appHeader').classList.add('hidden');$('#loginScreen').classList.remove('hidden');$('#adminPassword').value=''};
function openBuilder(id=null){editingId=id;locationDrafts=[];resetBuilder();if(id){let e=db.events.find(x=>x.id===id);if(!e)return;$('#builderTitle').textContent='Editar evento';$('#eventTitle').value=e.title;$('#eventDescription').value=e.description||'';$('#eventStart').value=e.start||'';$('#eventEnd').value=e.end||'';$('#eventCode').value=e.code||'';$('#eventActive').checked=e.active!==false;$('#keepDefaults').checked=e.keepDefaults!==false;$('#gpsOn').checked=!!e.gps;uploadedBanner=e.banner||'';if(uploadedBanner)$('#bannerPreview').innerHTML=`<img src="${uploadedBanner}" alt="Banner">`;$('#bannerName').textContent=uploadedBanner?'Banner armazenado':'Nenhum arquivo selecionado';selectedFields=e.fields||Object.keys(fieldLabels);locations=JSON.parse(JSON.stringify(e.locations||db.settings.locations));(e.questions||[]).forEach(q=>addQuestion(q));}else{locations=JSON.parse(JSON.stringify(db.settings.locations));selectedFields=Object.keys(fieldLabels)}renderLocations();renderFieldConfig();$('#gpsSettings').classList.toggle('hidden',!$('#gpsOn').checked);$('#generatedResult').classList.add('hidden');showView('builderView');switchBuilderTab('config');updateSummary()}
function resetBuilder(){['eventTitle','eventDescription','eventStart','eventEnd','eventCode'].forEach(id=>$('#'+id).value='');$('#eventActive').checked=true;$('#keepDefaults').checked=true;$('#gpsOn').checked=false;$('#questions').innerHTML='';$('#bannerFile').value='';$('#bannerName').textContent='Nenhum arquivo selecionado';$('#bannerPreview').innerHTML='';uploadedBanner='';$('#generatedResult').classList.add('hidden')}
const fieldLabels={name:'Nome completo',matricula:'Matrícula',modality:'Modalidade',course:'Curso',year:'Ano/semestre',class:'Turma'};
let selectedFields=Object.keys(fieldLabels),locations=JSON.parse(JSON.stringify(DEFAULTS.locations));
function renderFieldConfig(){$('#studentFieldConfig').innerHTML=Object.entries(fieldLabels).map(([k,v])=>`<label class="switchrow"><span><strong>${v}</strong><small>Campo de identificação</small></span><input class="switch fieldToggle" type="checkbox" data-field="${k}" ${selectedFields.includes(k)?'checked':''}></label>`).join('');$$('.fieldToggle').forEach(x=>x.onchange=()=>{selectedFields=$$('.fieldToggle:checked').map(y=>y.dataset.field);updateSummary()})}
function locationCard(l,i,kind){let title=kind==='draft'?'Nova localidade':'Editar localidade';return `<div class="location" data-kind="${kind}" data-index="${i}"><div class="lochead"><strong>${kind==='draft'?'Adicionar localização':esc(l.name||title)}</strong>${kind==='saved'?`<button class="btn ghost" type="button" data-action="remove">Remover</button>`:''}</div><div class="locgrid"><div class="field"><label>Nome da localidade</label><input data-field="name" value="${esc(l.name||'')}" placeholder="Ex.: Auditório"></div><div class="field"><label>Raio permitido</label><select data-field="radius">${[10,20,30,40,50,100,200,500,1000,'Livre'].map(r=>`<option value="${r}" ${String(l.radius??10)===String(r)?'selected':''}>${r==='Livre'?'Livre':r+' m'}</option>`).join('')}</select></div><div class="field"><label>Latitude</label><input data-field="lat" type="number" step="any" value="${esc(l.lat??'')}" placeholder="Ex.: -14.841642"></div><div class="field"><label>Longitude</label><input data-field="lng" type="number" step="any" value="${esc(l.lng??'')}" placeholder="Ex.: -40.877270"></div></div><div class="toolbar"><button class="btn secondary small" type="button" data-action="capture">Usar minha localização atual</button><button class="btn secondary small" type="button" data-action="save">Salvar localização</button>${kind==='draft'?'<span class="sub" style="margin:0">Preencha os dados e salve para incluir no evento.</span>':''}</div><p class="sub" style="margin:7px 0 0">Para definir o ponto exato, esteja fisicamente no local ao usar sua localização atual.</p></div>`}
function renderLocations(){$('#locations').innerHTML=locations.map((l,i)=>locationCard(l,i,'saved')).join('')+locationDrafts.map((l,i)=>locationCard(l,i,'draft')).join('')}
$('#locations').addEventListener('click',ev=>{let btn=ev.target.closest('button[data-action]');if(!btn)return;let card=btn.closest('.location'),kind=card.dataset.kind,i=Number(card.dataset.index),action=btn.dataset.action;if(action==='remove'){if(confirm('Remover esta localidade do evento?')){locations.splice(i,1);renderLocations();updateSummary()}return}if(action==='capture'){if(!navigator.geolocation){toast('Este navegador não oferece acesso à localização.');return}btn.disabled=true;btn.textContent='Obtendo localização…';navigator.geolocation.getCurrentPosition(pos=>{card.querySelector('[data-field="lat"]').value=pos.coords.latitude.toFixed(7);card.querySelector('[data-field="lng"]').value=pos.coords.longitude.toFixed(7);btn.disabled=false;btn.textContent='Usar minha localização atual';toast('Coordenadas preenchidas. Precisão aproximada: '+Math.round(pos.coords.accuracy)+' m. Clique em Salvar localização.');},err=>{btn.disabled=false;btn.textContent='Usar minha localização atual';toast('Não foi possível obter a localização. Verifique a permissão do navegador.');},{enableHighAccuracy:true,timeout:25000,maximumAge:0});return}if(action==='save'){let read=k=>card.querySelector(`[data-field="${k}"]`).value.trim(),name=read('name'),lat=Number(read('lat')),lng=Number(read('lng')),radius=read('radius');if(!name){toast('Informe o nome da localidade.');return}if(!read('lat')||!read('lng')||!Number.isFinite(lat)||!Number.isFinite(lng)||lat < -90||lat > 90||lng < -180||lng > 180){toast('Informe uma latitude e longitude válidas.');return}let item={id:kind==='draft'?'loc-'+Date.now():locations[i].id,name,lat,lng,radius};if(kind==='draft'){locations.push(item);locationDrafts.splice(i,1);toast('Localização adicionada ao evento.')}else{locations[i]=item;toast('Localização atualizada.')}renderLocations();updateSummary()}});
$('#addLocation').onclick=()=>{locationDrafts.push({name:'',lat:'',lng:'',radius:10});renderLocations();$('#locations .location[data-kind="draft"]:last-of-type input')?.focus()};
$('#gpsOn').onchange=()=>{$('#gpsSettings').classList.toggle('hidden',!$('#gpsOn').checked);updateSummary()};
$('#keepDefaults').onchange=()=>{if($('#keepDefaults').checked){selectedFields=Object.keys(fieldLabels);renderFieldConfig()}updateSummary()};
async function compressBanner(file){
 if(!file.type.startsWith('image/'))throw new Error('Selecione um arquivo de imagem.');
 let bitmap;
 if('createImageBitmap' in window){bitmap=await createImageBitmap(file)}else{bitmap=await new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Não foi possível abrir esta imagem.'))};img.src=url})}
 const max=1600,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height)),w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale));
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(bitmap,0,0,w,h);if(bitmap.close)bitmap.close();return canvas.toDataURL('image/jpeg',0.82);
}
$('#bannerFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;const name=$('#bannerName');name.textContent='Preparando imagem…';try{uploadedBanner=await compressBanner(f);name.textContent=f.name+' (otimizada)';$('#bannerPreview').innerHTML=`<img src="${uploadedBanner}" alt="Prévia do banner">`}catch(err){uploadedBanner='';name.textContent='Falha ao carregar imagem';toast(err.message||'Não foi possível preparar a imagem.')}};
function addQuestion(q=null){let id=++questionSeq;let el=document.createElement('div');el.className='question';el.dataset.qid=id;el.innerHTML=`<div class="qtop"><strong>Pergunta adicional</strong><div class="toolbar"><button class="btn secondary small" type="button" onclick="moveQuestion(this,-1)">↑</button><button class="btn secondary small" type="button" onclick="moveQuestion(this,1)">↓</button><button class="btn ghost" type="button" onclick="this.closest('.question').remove()">Excluir</button></div></div><div class="field"><label>Enunciado</label><input class="qprompt" placeholder="Digite a pergunta"></div><div class="grid2"><div class="field"><label>Tipo de resposta</label><select class="qtype"><option value="short">Texto curto</option><option value="long">Texto longo</option><option value="choice">Múltipla escolha</option></select></div><div class="field"><label>Obrigatoriedade</label><select class="qrequired"><option value="true">Obrigatória</option><option value="false">Opcional</option></select></div></div><div class="options hidden"><label>Alternativas</label><div class="optionList"></div><button class="btn secondary small addOption" type="button">＋ Adicionar alternativa</button></div>`;
$('#questions').appendChild(el);let sel=el.querySelector('.qtype');sel.onchange=()=>el.querySelector('.options').classList.toggle('hidden',sel.value!=='choice');el.querySelector('.addOption').onclick=()=>addOption(el);if(q){el.querySelector('.qprompt').value=q.prompt;sel.value=q.type;el.querySelector('.qrequired').value=String(q.required);if(q.type==='choice'){el.querySelector('.options').classList.remove('hidden');q.options.forEach(o=>addOption(el,o))}}updateQuestionCount();return el}
function addOption(el,value=''){let row=document.createElement('div');row.className='choice';row.innerHTML=`<span>•</span><input placeholder="Alternativa" value="${esc(value)}"><button type="button" class="btn ghost">Remover</button>`;row.querySelector('button').onclick=()=>row.remove();el.querySelector('.optionList').appendChild(row)}
window.moveQuestion=(btn,dir)=>{let el=btn.closest('.question'),sib=dir<0?el.previousElementSibling:el.nextElementSibling;if(sib){if(dir<0)el.parentNode.insertBefore(el,sib);else el.parentNode.insertBefore(sib,el)}};
$('#addQuestion').onclick=()=>addQuestion();
function updateQuestionCount(){let n=$$('#questions .question').length;$('#questionCount').textContent=n?`${n} pergunta(s) adicional(is)`:'Nenhuma pergunta adicionada'}
function collectQuestions(){return $$('#questions .question').map(q=>({prompt:q.querySelector('.qprompt').value.trim(),type:q.querySelector('.qtype').value,required:q.querySelector('.qrequired').value==='true',options:[...q.querySelectorAll('.optionList input')].map(x=>x.value.trim()).filter(Boolean)})).filter(q=>q.prompt)}
function updateSummary(){$('#summaryTitle').textContent=$('#eventTitle').value||'PRESENÇA IFBA';$('#summaryDescription').textContent=$('#eventDescription').value||'Formulário de presença do evento';$('#summaryFields').textContent='Campos: '+selectedFields.map(k=>fieldLabels[k]).join(', ');$('#summaryGps').textContent=$('#gpsOn').checked?'GPS obrigatório · '+locations.length+' localidade(s)':'GPS desativado'}
['eventTitle','eventDescription'].forEach(id=>$('#'+id).addEventListener('input',updateSummary));
function collectEvent(){return {id:editingId||null,title:$('#eventTitle').value.trim(),description:$('#eventDescription').value.trim(),start:$('#eventStart').value,end:$('#eventEnd').value,code:$('#eventCode').value.trim(),active:$('#eventActive').checked,fields:selectedFields,keepDefaults:$('#keepDefaults').checked,questions:collectQuestions(),gps:$('#gpsOn').checked,locations:JSON.parse(JSON.stringify(locations)),banner:uploadedBanner,settings:editingId?(db.events.find(e=>e.id===editingId)?.settings||db.settings):db.settings,createdAt:editingId?(db.events.find(e=>e.id===editingId)?.createdAt||new Date().toISOString()):new Date().toISOString()}}
function validateEvent(e){if(!e.title){toast('Informe o nome do evento.');return false}if(!e.start||!e.end){toast('Informe a data e a hora de abertura e encerramento.');return false}if(new Date(e.end)<=new Date(e.start)){toast('O encerramento deve ser posterior à abertura.');return false}if(!e.fields.length&&!e.questions.length){toast('Selecione ao menos um campo ou pergunta.');return false}if(e.gps&&(locationDrafts.length||!e.locations.length||e.locations.some(l=>!Number.isFinite(Number(l.lat))||!Number.isFinite(Number(l.lng))))){toast('Salve todas as localidades e revise as coordenadas GPS.');return false}return true}
async function saveEvent(generate=false){let e=collectEvent();if(!validateEvent(e))return;const isNew=!e.id,targetId=e.id||crypto.randomUUID();const buttons=[$('#saveEvent'),$('#generateForm')];buttons.forEach(b=>{if(b){b.disabled=true}});try{if(e.banner&&e.banner.startsWith('data:'))e.banner=await uploadEventBanner(e.banner,targetId);const payload=dbPayload(e);let query;if(isNew){payload.id=targetId;query=supabase.from('events').insert(payload)}else{query=supabase.from('events').update(payload).eq('id',targetId)}const result=await query.select('*').single();if(result.error)throw result.error;const saved=fromDb(result.data);editingId=saved.id;await fetchEvents();drawEvents();if(generate){let url=new URL('presenca.html', location.href).href+'?id='+encodeURIComponent(saved.id);$('#generatedResult').classList.remove('hidden');$('#studentLink').href=url;$('#studentLink').textContent=url;$('#qrBox').innerHTML='';if(window.QRCode)new QRCode($('#qrBox'),{text:url,width:160,height:160});else $('#qrBox').textContent='Biblioteca de QR Code indisponível.';toast('Evento salvo no Supabase e formulário gerado.')}else toast('Evento salvo no Supabase.')}catch(err){showLoadError('Não foi possível salvar o evento',err)}finally{buttons.forEach(b=>{if(b)b.disabled=false})}}
$('#saveEvent').onclick=()=>saveEvent(false);$('#generateForm').onclick=()=>saveEvent(true);
$('#copyLink').onclick=async()=>{try{await navigator.clipboard.writeText($('#studentLink').href);toast('Link copiado.')}catch(e){toast('Copie o endereço exibido no campo do link.')}};
$('#showQr').onclick=()=>$('#qrBox').classList.toggle('hidden');
function drawEvents(){let q=($('#eventSearch')?.value||'').toLowerCase();let items=db.events.filter(e=>e.title.toLowerCase().includes(q));$('#eventCount').textContent=`${db.events.length} evento(s) cadastrado(s)`;$('#eventList').innerHTML=items.length?items.map(e=>`<div class="event-row"><div class="rowhead"><div><strong>${esc(e.title)}</strong><div class="sub" style="margin:4px 0 0">${e.start?new Date(e.start).toLocaleString('pt-BR'):'Sem data'} · <span class="pill">${e.active?'Ativo':'Inativo'}</span> · ${(db.responses[e.id]||[]).length} participante(s)</div></div><div class="toolbar"><button class="btn secondary small" onclick="editEvent('${e.id}')">Editar</button><button class="btn secondary small" onclick="viewResponses('${e.id}')">Respostas</button><button class="btn secondary small" onclick="toggleEvent('${e.id}')">${e.active?'Desativar':'Ativar'}</button><button class="btn secondary small" onclick="copyEventLink('${e.id}')">Copiar link</button><button class="btn ghost" onclick="deleteEvent('${e.id}')">Excluir</button></div></div></div>`).join(''):'<div class="empty">Nenhum evento encontrado. Clique em “Cadastrar evento” para começar.</div>'}
window.editEvent=id=>openBuilder(id);
window.toggleEvent=async id=>{let e=db.events.find(x=>x.id===id);if(!e)return;try{const {error}=await supabase.from('events').update({is_active:!e.active}).eq('id',id);if(error)throw error;await fetchEvents();drawEvents();toast('Situação do evento atualizada.')}catch(err){showLoadError('Não foi possível atualizar o evento',err)}};
window.deleteEvent=async id=>{const event=db.events.find(e=>e.id===id);if(!confirm(`Excluir o formulário “${event?.title||'este evento'}” e todas as respostas vinculadas? Esta ação não pode ser desfeita.`))return;const button=[...document.querySelectorAll('button')].find(b=>b.getAttribute('onclick')===`deleteEvent('${id}')`);if(button){button.disabled=true;button.textContent='Excluindo…'}try{const {error}=await supabase.rpc('delete_event_with_responses',{p_event_id:id});if(error)throw error;if(responseChannel&&currentResponseEvent===id){await supabase.removeChannel(responseChannel);responseChannel=null;currentResponseEvent=null}await fetchEvents();drawEvents();toast('Formulário e respostas excluídos com sucesso.')}catch(err){console.error('Falha ao excluir formulário:',err);showLoadError('Não foi possível excluir o formulário',err);if(button){button.disabled=false;button.textContent='Excluir'}}};
window.copyEventLink=async id=>{let url=new URL('presenca.html', location.href).href+'?id='+encodeURIComponent(id);try{await navigator.clipboard.writeText(url);toast('Link copiado.')}catch(e){prompt('Copie o link do formulário:',url)}};
$('#eventSearch').oninput=drawEvents;
$('#newEvent').onclick=()=>openBuilder();$('#newEvent2').onclick=()=>openBuilder();$('#goEvents').onclick=()=>$('#eventListCard').scrollIntoView({behavior:'smooth'});$('#goSettings').onclick=()=>{showView('settingsView');renderSettings()};
['backDashboard','settingsBack','responsesBack'].forEach(id=>$('#'+id).onclick=()=>{showView('dashboardView');drawEvents()});
$$('.tab').forEach(b=>b.onclick=()=>switchBuilderTab(b.dataset.tab));
function switchBuilderTab(tab){$$('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$('#configTab').classList.toggle('hidden',tab!=='config');$('#studentPreviewTab').classList.toggle('hidden',tab!=='studentPreview');if(tab==='studentPreview')renderBuilderPreview()}
function renderBuilderPreview(){let e=collectEvent();$('#previewStudent').innerHTML=`<h2>${esc(e.title||'Nome do evento')}</h2><p>${esc(e.description)}</p>${e.banner?`<img class="student-banner" src="${e.banner}">`:''}<p class="muted">Campos: ${e.fields.map(x=>fieldLabels[x]).join(', ')}</p>${e.questions.map(q=>`<p><strong>${esc(q.prompt)}</strong> · ${q.type}</p>`).join('')}`}
function renderSettings(){renderSimpleList('modalities','modalityList','modalidade');renderSimpleList('courses','courseList','curso');renderSimpleList('years','yearList','ano/semestre');renderSimpleList('classes','classList','turma');$('#settingsLocations').innerHTML=db.settings.locations.map((l,i)=>`<div class="location"><div class="rowhead"><strong>${esc(l.name)}</strong><button class="btn ghost" onclick="removeSettingLocation(${i})">Excluir</button></div><p class="coords">${l.lat}, ${l.lng} · Raio ${l.radius==='Livre'?'livre':l.radius+' m'}</p></div>`).join('')}
function renderSimpleList(key,target,label){$('#'+target).innerHTML=db.settings[key].map((v,i)=>`<div class="switchrow"><span>${esc(v)}</span><button class="btn ghost" onclick="removeSetting('${key}',${i})">Excluir</button></div>`).join('')||'<p class="sub">Nenhum item cadastrado.</p>'}
window.removeSetting=(key,i)=>{if(confirm('Excluir este item?')){db.settings[key].splice(i,1);persist();renderSettings()}};
function addSetting(key,input){let v=$('#'+input).value.trim();if(!v)return;db.settings[key].push(v);$('#'+input).value='';persist();renderSettings()}
$('#addModality').onclick=()=>addSetting('modalities','newModality');$('#addCourse').onclick=()=>addSetting('courses','newCourse');$('#addYear').onclick=()=>addSetting('years','newYear');$('#addClass').onclick=()=>addSetting('classes','newClass');
window.removeSettingLocation=i=>{if(confirm('Excluir esta localidade das configurações?')){db.settings.locations.splice(i,1);persist();renderSettings()}};
$('#addSettingsLocation').onclick=()=>{let name=prompt('Nome da localidade:');if(!name)return;let lat=prompt('Latitude:');let lng=prompt('Longitude:');if(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng))){toast('Coordenadas inválidas.');return}db.settings.locations.push({id:'loc-'+Date.now(),name,lat:Number(lat),lng:Number(lng),radius:10});persist();renderSettings()};
let responseRowsCache=[],responseChannel=null;
function renderResponseRows(rows){responseRowsCache=rows;$('#responseCount').textContent=rows.length+' registro(s) · atualização em tempo real';$('#responsesTable').innerHTML=rows.length?`<table><thead><tr><th>Data/hora</th><th>Nome</th><th>Matrícula</th><th>Demais respostas</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${new Date(r.createdAt).toLocaleString('pt-BR')}</td><td>${esc(r.name||'—')}</td><td>${esc(r.matricula||'—')}</td><td>${Object.entries(r.answers||{}).filter(([k])=>!['name','matricula','coords'].includes(k)).map(([k,v])=>`<strong>${esc(r.labels?.[k]||k)}:</strong> ${esc(Array.isArray(v)?v.join(', '):v)}`).join('<br>')}${r.answers?.coords?`<br><strong>Localização:</strong> ${esc(r.answers.coords.lat)}, ${esc(r.answers.coords.lng)} (precisão ${esc(r.answers.coords.accuracy)} m)`:''}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">Ainda não há respostas para este evento.</div>'}
async function refreshResponseRows(id){const {data,error}=await supabase.from('form_responses').select('id,event_id,enrollment,answers,created_at').eq('event_id',id).order('created_at',{ascending:false});if(error)throw error;const event=db.events.find(x=>x.id===id);const labels={modality:'Modalidade',course:'Curso',year:'Ano/semestre',class:'Turma'};(event?.questions||[]).forEach((q,i)=>labels['custom_'+i]=q.prompt);renderResponseRows((data||[]).map(r=>({createdAt:r.created_at,matricula:r.enrollment,name:r.answers?.name||'',answers:r.answers||{},labels}))) }
async function viewResponses(id){currentResponseEvent=id;let e=db.events.find(x=>x.id===id);showView('responsesView');$('#responsesTitle').textContent='Respostas — '+(e?.title||'Evento');$('#responsesTable').innerHTML='<div class="empty">Carregando respostas…</div>';if(responseChannel){await supabase.removeChannel(responseChannel);responseChannel=null}try{await refreshResponseRows(id);responseChannel=supabase.channel('responses-'+id).on('postgres_changes',{event:'INSERT',schema:'public',table:'form_responses',filter:'event_id=eq.'+id},async()=>{try{await refreshResponseRows(id)}catch(err){console.error('Falha ao atualizar respostas em tempo real:',err)}}).subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){console.error('Supabase Realtime indisponível:',status);$('#responseCount').textContent='Respostas carregadas; atualização automática indisponível.'}})}catch(err){showLoadError('Não foi possível consultar as respostas',err);$('#responseCount').textContent='Falha na consulta das respostas';$('#responsesTable').innerHTML=`<div class="empty" role="alert">Não foi possível consultar as respostas.<br><strong>Detalhe:</strong> ${esc(err?.message||err?.details||'Erro desconhecido')}<br>Confira se o SQL de permissões foi executado no Supabase.</div>`}}
window.viewResponses=viewResponses;
$('#exportCsv').onclick=()=>{let rows=responseRowsCache;if(!rows.length){toast('Não há respostas para exportar.');return}let headers=['Data/hora','Nome','Matrícula','Respostas'];let csv=[headers,...rows.map(r=>[new Date(r.createdAt).toLocaleString('pt-BR'),r.name||'',r.matricula||'',JSON.stringify(r.answers||{})])].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\\n');let a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download='presencas-evento.csv';a.click();URL.revokeObjectURL(a.href)};
supabase.auth.getSession().then(async({data})=>{if(data.session){currentUser=data.session.user;const {data:admin,error}=await supabase.rpc('is_admin');if(!error&&admin)startApp();else await supabase.auth.signOut()}})
renderSettings();
})();
