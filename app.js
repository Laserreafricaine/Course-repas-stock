const STORAGE_KEY='courses-repas-stock-v3';
const defaultCategories=['Fruits et légumes','Produits frais','Épicerie','Boulangerie','Surgelés','Boissons','Hygiène','Entretien','Bébé','Animaux','Autres'];
const stockUnits=['unité','unités','paquet','paquets','boîte','boîtes','bouteille','bouteilles','sachet','sachets','kg','g','L','ml'];
const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ref={
  'Fruits et légumes':['tomate','banane','pomme','poire','orange','citron','mandarine','mangue','avocat','pasteque','melon','raisin','fraise','salade','laitue','carotte','oignon','ail','pomme de terre','patate','courgette','aubergine','concombre','poivron','brocoli','chou','epinard','persil','coriandre','menthe','gingembre','piment'],
  'Produits frais':['lait','beurre','creme','yaourt','fromage','oeuf','jambon','saucisse','viande','boeuf','poulet','dinde','poisson','saumon','crevette','tofu'],
  'Épicerie':['riz','pates','couscous','semoule','farine','sucre','sel','huile','vinaigre','moutarde','mayonnaise','ketchup','sauce','epice','poivre','cafe','the','chocolat','cereales','biscuit','gateau','confiture','miel','conserve','thon','haricot','lentille','pois chiche','mais','soupe','bouillon'],
  'Boulangerie':['pain','baguette','brioche','croissant','pain de mie','viennoiserie'],
  'Surgelés':['surgele','pizza','glace','frites'],
  'Boissons':['eau','jus','soda','sirop','boisson','lait vegetal'],
  'Hygiène':['savon','shampoing','shampooing','gel douche','dentifrice','brosse a dents','deodorant','papier toilette','mouchoir','coton','serviette hygienique'],
  'Entretien':['lessive','liquide vaisselle','produit vaisselle','nettoyant','javel','eponge','sac poubelle','essuie-tout','papier aluminium','film alimentaire','produit sol','desinfectant'],
  'Bébé':['couche','lingette','lait bebe','petit pot','compote bebe'],
  'Animaux':['croquette','patee','litiere']
};
const classMap={'Fruits et légumes':'fruit','Produits frais':'fresh','Épicerie':'grocery','Boulangerie':'bakery','Surgelés':'frozen','Boissons':'drinks','Hygiène':'hygiene','Entretien':'home','Bébé':'baby','Animaux':'pets','Autres':'other'};
const defaultCategoryColors={'Fruits et légumes':'#7aa85d','Produits frais':'#5b9fb4','Épicerie':'#c59735','Boulangerie':'#a97b49','Surgelés':'#5f93c1','Boissons':'#4e9ca0','Hygiène':'#8a67a7','Entretien':'#6f7f89','Bébé':'#b26d86','Animaux':'#8c6b43','Autres':'#7e7e7e'};
const defaultCategorySettings=defaultCategories.map(name=>({name,color:defaultCategoryColors[name],keywords:[...(ref[name]||[])]}));
const defaultState={
  active:'repas',
  meals:{'Lun-Midi':'Yassa','Mar-Midi':'Riz','Mer-Midi':'Poulet','Jeu-Midi':'Pâtes','Ven-Midi':'Salade','Sam-Midi':'Yassa','Dim-Midi':'Riz','Lun-Soir':'Gratin','Mar-Soir':'Soupe','Mer-Soir':'Pâtes','Jeu-Soir':'Riz','Ven-Soir':'Poulet','Sam-Soir':'Soupe','Dim-Soir':'Gratin'},
  courses:[
    {id:1,name:'Tomates',quantity:2,unit:'unités',category:'Fruits et légumes',done:false,note:'',source:''},
    {id:2,name:'Bananes',quantity:1,unit:'régime',category:'Fruits et légumes',done:false,note:'',source:''},
    {id:3,name:'Riz',quantity:1,unit:'kg',category:'Épicerie',done:false,note:'',source:''},
    {id:4,name:'Pain',quantity:1,unit:'unité',category:'Boulangerie',done:true,note:'',source:''},
    {id:5,name:'Savon',quantity:2,unit:'unités',category:'Hygiène',done:false,note:'',source:''}
  ],
  stock:[
    {id:11,name:'Lait',category:'Produits frais',qty:3,unit:'bouteilles',threshold:1,auto:true},
    {id:12,name:'Tomates',category:'Fruits et légumes',qty:1,unit:'unité',threshold:1,auto:true},
    {id:13,name:'Riz',category:'Épicerie',qty:4,unit:'kg',threshold:1,auto:false},
    {id:14,name:'Pâtes',category:'Épicerie',qty:0,unit:'paquet',threshold:1,auto:true},
    {id:15,name:'Savon',category:'Hygiène',qty:2,unit:'unités',threshold:1,auto:false}
  ],
  favoriteProducts:['Tomates','Lait','Riz','Pain','Savon'],
  usualMeals:['Yassa','Gratin','Riz au poulet','Pâtes','Soupe','Salade'],
  customUnits:[],
  categorySettings:defaultCategorySettings
};
function loadState(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(!saved)return structuredClone(defaultState);
    return {...structuredClone(defaultState),...saved,courses:Array.isArray(saved.courses)?saved.courses:defaultState.courses,stock:Array.isArray(saved.stock)?saved.stock:defaultState.stock,meals:{...defaultState.meals,...(saved.meals||{})},favoriteProducts:Array.isArray(saved.favoriteProducts)?saved.favoriteProducts:defaultState.favoriteProducts,usualMeals:Array.isArray(saved.usualMeals)?saved.usualMeals:defaultState.usualMeals,customUnits:Array.isArray(saved.customUnits)?saved.customUnits:[],categorySettings:Array.isArray(saved.categorySettings)?saved.categorySettings:structuredClone(defaultCategorySettings)};
  }catch{return structuredClone(defaultState)}
}
let state=loadState();
const dynamic=document.getElementById('dynamic'),editor=document.getElementById('editor'),editorForm=document.getElementById('editorForm'),settingsDialog=document.getElementById('settingsDialog'),settingsContent=document.getElementById('settingsContent');
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function categoryNames(){return state.categorySettings.map(x=>x.name)}
function classify(name){const n=normalize(name);for(const category of state.categorySettings){if(category.name!=='Autres'&&(category.keywords||[]).some(word=>n.includes(normalize(word))))return category.name}return categoryNames().includes('Autres')?'Autres':categoryNames().at(-1)}
function stockStatusKey(p){if(Number(p.qty)<Number(p.threshold))return'buy';if(Number(p.qty)===Number(p.threshold))return'low';return'good'}
function stockStatus(p){const key=stockStatusKey(p);return[key==='buy'?'À racheter':key==='low'?'Faible':'Bon',key]}
function options(values,current,blank=false){return`${blank?'<option value="">Aucune</option>':''}${values.map(v=>`<option value="${escapeHtml(v)}" ${v===current?'selected':''}>${escapeHtml(v)}</option>`).join('')}`}
function allUnits(){return[...new Set([...stockUnits,...state.customUnits])]}
function unitOptions(current){const units=allUnits(),values=units.includes(current)?units:[current,...units].filter(Boolean);return options(values,current)}
function productDatalist(){return`<datalist id="productSuggestions">${state.favoriteProducts.map(x=>`<option value="${escapeHtml(x)}"></option>`).join('')}</datalist>`}
function grouped(items){return categoryNames().reduce((groups,cat)=>{const matches=items.filter(x=>(x.category||'Autres')===cat);if(matches.length)groups.push([cat,matches]);return groups},[])}
function categoryStyle(name){const setting=state.categorySettings.find(x=>x.name===name),color=setting?.color||'#7e7e7e';return`style="background:${color}24;--category-color:${color}"`}
function updateCounts(){document.getElementById('courseCount').textContent=state.courses.filter(x=>!x.done).length;const watch=state.stock.filter(x=>stockStatusKey(x)!=='good');document.getElementById('stockLowCount').textContent=watch.length;updateStockAlert(watch)}
function updateStockAlert(watch){
  const alert=watch.find(x=>stockStatusKey(x)==='buy')||watch[0],line=document.getElementById('stockAlertLine'),hubBadge=document.getElementById('hubStockAlert'),navBadge=document.getElementById('navStockAlert');
  [hubBadge,navBadge].forEach(badge=>{badge.textContent=watch.length;badge.hidden=!watch.length});
  if(!alert){line.hidden=true;line.textContent='';return}
  line.hidden=false;line.innerHTML=`⚠️ ${escapeHtml(alert.name)} ${stockStatusKey(alert)==='buy'?'à racheter':'faible'}${watch.length>1?` · ${watch.length} produits à surveiller`:''}`;line.onclick=()=>setHub('stock')
}
function setBottomNav(name){document.querySelectorAll('[data-nav]').forEach(button=>button.classList.toggle('active',button.dataset.nav===name))}
function setHub(h,navName=h){state.active=h;save();document.querySelectorAll('.hub').forEach(b=>b.classList.toggle('active',b.dataset.hub===h));setBottomNav(navName);render()}
document.querySelectorAll('.hub').forEach(b=>b.addEventListener('click',()=>setHub(b.dataset.hub)));
document.querySelectorAll('[data-nav]').forEach(button=>button.addEventListener('click',()=>{
  const target=button.dataset.nav;
  if(target==='accueil'){setHub('repas','accueil');document.querySelector('.app').scrollIntoView({behavior:'smooth',block:'start'})}
  else setHub(target,target)
}));
function render(){updateCounts();if(state.active==='repas')renderMeals();else if(state.active==='courses')renderCourses();else renderStock()}
function renderMeals(){
  const days=[['Dim','Dimanche'],['Lun','Lundi'],['Mar','Mardi'],['Mer','Mercredi'],['Jeu','Jeudi'],['Ven','Vendredi'],['Sam','Samedi']],todayIndex=new Date().getDay();
  const orderedDays=Array.from({length:7},(_,offset)=>days[(todayIndex+offset)%7]);
  const list=orderedDays.map(([key,label],index)=>`<section class="day-card ${index===0?'current-day':''}" data-day="${key}"><div class="day-title"><span>${label}</span>${index===0?'<span class="today-badge">Aujourd’hui</span>':''}</div>${index===0?'<div class="day-message">Belle journée et bon appétit !</div>':''}<div class="day-meals"><button class="meal-slot midi-slot" data-slot="${key}-Midi"><span class="meal-slot-label">Midi</span><span class="meal-slot-value">${escapeHtml(state.meals[`${key}-Midi`]||'Ajouter')}</span></button><button class="meal-slot soir-slot" data-slot="${key}-Soir"><span class="meal-slot-label">Soir</span><span class="meal-slot-value">${escapeHtml(state.meals[`${key}-Soir`]||'Ajouter')}</span></button></div></section>`).join('');
  dynamic.innerHTML=`<div class="panel repas"><div class="section-title">Menu de la semaine</div><div class="meal-legend"><span class="legend"><i class="dot midi"></i>Midi</span><span class="legend"><i class="dot soir"></i>Soir</span></div><div class="week-list">${list}</div><button class="primary repas" id="addMeal">＋ Ajouter un repas</button><button class="clear-week" id="clearWeek">Effacer tout le menu de la semaine</button></div>`;
  dynamic.querySelectorAll('[data-slot]').forEach(c=>c.onclick=()=>openMeal(c.dataset.slot));document.getElementById('addMeal').onclick=()=>openMeal('Lun-Midi');document.getElementById('clearWeek').onclick=clearWeek
}
function clearWeek(){if(confirm('Effacer tous les repas de la semaine ?')){state.meals={};save();render()}}
function openMeal(slot){
  const [day,period]=slot.split('-'),value=state.meals[slot]||'';
  editorForm.innerHTML=`<h2>${day} – ${period}</h2><div class="field"><label>Repas</label><input id="mealName" value="${escapeHtml(value)}"><div class="meal-suggestions">${state.usualMeals.map(x=>`<button class="meal-suggestion" type="button">${escapeHtml(x)}</button>`).join('')}</div></div><div class="field"><label>Créneau</label><select id="mealSlot">${['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].flatMap(d=>['Midi','Soir'].map(p=>`<option value="${d}-${p}" ${d===day&&p===period?'selected':''}>${d} – ${p}</option>`)).join('')}</select></div><div class="field"><label>Note</label><textarea placeholder="Note facultative"></textarea></div><div class="modal-actions"><button class="cancel" value="cancel">Annuler</button><button class="save" type="button" id="saveMeal">Enregistrer</button></div>${value?'<button class="action-btn delete" type="button" id="deleteMeal" style="width:100%;margin-top:8px">Supprimer</button>':''}`;
  editorForm.querySelectorAll('.meal-suggestion').forEach(button=>button.onclick=()=>document.getElementById('mealName').value=button.textContent);
  editor.showModal();document.getElementById('saveMeal').onclick=()=>{const target=document.getElementById('mealSlot').value;delete state.meals[slot];state.meals[target]=document.getElementById('mealName').value.trim()||'Repas';save();editor.close();render()};
  const del=document.getElementById('deleteMeal');if(del)del.onclick=()=>{delete state.meals[slot];save();editor.close();render()}
}
function renderCourses(){
  dynamic.innerHTML=`<div class="panel courses"><div class="add-zone courses"><h3>Ajouter une course</h3><div class="add-row"><input id="courseInput" list="productSuggestions" aria-label="Produit" placeholder="Produit, ex. tomates"><button id="addCourse">Ajouter</button></div><div class="add-details"><input id="courseQuantity" type="number" min="0" step="0.1" aria-label="Quantité" placeholder="Quantité"><select id="courseUnit" aria-label="Unité de mesure">${unitOptions('unité')}</select></div><div class="help">Classement automatique par rayon. Les produits inconnus vont dans « Autres ».</div></div>${productDatalist()}<div id="courseLists"></div><button class="clear-list" id="clearCourses">Supprimer toutes les courses</button></div>`;
  document.getElementById('addCourse').onclick=addCourse;document.getElementById('courseInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addCourse()}});document.getElementById('clearCourses').onclick=clearCourses;renderCourseLists()
}
function clearCourses(){if(state.courses.length&&confirm('Supprimer toutes les courses ?')){state.courses=[];save();render()}}
function addCourse(){
  const input=document.getElementById('courseInput'),name=input.value.trim(),quantity=document.getElementById('courseQuantity').value,unit=document.getElementById('courseUnit').value;if(!name)return;
  state.courses.push({id:Date.now(),name,quantity,unit:quantity?unit:'',category:classify(name),done:false,note:'',source:''});save();render()
}
function renderCourseLists(){
  const box=document.getElementById('courseLists'),groups=grouped(state.courses);
  box.innerHTML=groups.length?groups.map(([cat,items])=>`<section class="rayon" ${categoryStyle(cat)}><div class="rayon-head"><span>${escapeHtml(cat)}</span><span>${items.length}</span></div><div class="rayon-list">${items.map(i=>`<div class="item" data-course-row="${i.id}"><button class="check ${i.done?'checked':''}" data-check="${i.id}" aria-label="${i.done?'Marquer comme non acheté':'Marquer comme acheté'}">${i.done?'✓':''}</button><div class="item-main"><div class="item-name ${i.done?'done':''}">${escapeHtml(i.name)}</div><div class="item-meta">${i.quantity!==''&&i.quantity!=null?`<span class="mini">${escapeHtml(i.quantity)}${i.unit?' '+escapeHtml(i.unit):''}</span>`:''}${i.source==='stock'?'<span class="mini source">Ajouté depuis Stock</span>':''}${i.note?`<span class="mini">${escapeHtml(i.note)}</span>`:''}</div></div><div class="item-actions"><button class="action-btn edit" data-edit-course="${i.id}">Modifier</button><button class="action-btn delete" data-delete-course="${i.id}">Supprimer</button></div></div>`).join('')}</div></section>`).join(''):'<div class="empty">Aucune course pour le moment.</div>';
  box.querySelectorAll('[data-check]').forEach(b=>b.onclick=()=>{const i=state.courses.find(x=>x.id==b.dataset.check);i.done=!i.done;save();render()});
  box.querySelectorAll('[data-edit-course]').forEach(b=>b.onclick=()=>openCourseEdit(Number(b.dataset.editCourse)));
  box.querySelectorAll('[data-delete-course]').forEach(b=>b.onclick=()=>deleteCourse(Number(b.dataset.deleteCourse)))
}
function openCourseEdit(id){
  const i=state.courses.find(x=>x.id===id);if(!i)return;
  editorForm.innerHTML=`<h2>Modifier la course</h2><div class="field"><label>Nom</label><input id="cName" value="${escapeHtml(i.name)}"></div><div class="modal-grid"><div class="field"><label>Quantité</label><input id="cQuantity" type="number" min="0" step="0.1" value="${escapeHtml(i.quantity)}"></div><div class="field"><label>Unité de mesure</label><select id="cUnit">${unitOptions(i.unit||'unité')}</select></div></div><div class="field"><label>Rayon</label><select id="cCat">${options(categoryNames(),i.category)}</select></div><div class="field"><label>Note éventuelle</label><textarea id="cNote">${escapeHtml(i.note||'')}</textarea></div><div class="switchline"><span>Article acheté</span><input id="cDone" type="checkbox" ${i.done?'checked':''}></div><div class="modal-actions"><button class="cancel" value="cancel">Annuler</button><button class="save" type="button" id="saveCourse">Enregistrer</button></div>`;
  editor.showModal();document.getElementById('saveCourse').onclick=()=>{i.name=document.getElementById('cName').value.trim()||i.name;i.quantity=document.getElementById('cQuantity').value;i.unit=document.getElementById('cUnit').value.trim();i.category=document.getElementById('cCat').value;i.note=document.getElementById('cNote').value.trim();i.done=document.getElementById('cDone').checked;save();editor.close();render()}
}
function deleteCourse(id){const i=state.courses.find(x=>x.id===id);if(i&&confirm(`Supprimer uniquement « ${i.name} » ?`)){state.courses=state.courses.filter(x=>x.id!==id);save();render()}}
function renderStock(){
  dynamic.innerHTML=`<div class="panel stock"><div class="add-zone stock"><h3>Ajouter un produit</h3><div class="add-row"><input id="stockInput" list="productSuggestions" aria-label="Nom du produit" placeholder="Ex. lait, riz, savon"><button id="addStock">Ajouter</button></div><div class="help">La catégorie est proposée automatiquement et reste modifiable.</div></div>${productDatalist()}<div id="stockLists"></div><button class="clear-list" id="clearStock">Supprimer tout le stock</button></div>`;
  document.getElementById('addStock').onclick=()=>{const name=document.getElementById('stockInput').value.trim();if(name)openStockEdit(null,name)};document.getElementById('stockInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();document.getElementById('addStock').click()}});document.getElementById('clearStock').onclick=clearStock;renderStockLists()
}
function clearStock(){if(state.stock.length&&confirm('Supprimer tous les produits du stock ?')){state.stock=[];save();render()}}
function renderStockLists(){
  const box=document.getElementById('stockLists'),groups=grouped(state.stock);
  box.innerHTML=groups.length?groups.map(([cat,items])=>`<section class="rayon" ${categoryStyle(cat)}><div class="rayon-head"><span>${escapeHtml(cat)}</span><span>${items.length}</span></div><div class="rayon-list">${items.map(i=>{const [label,cls]=stockStatus(i);return`<div class="item" data-stock-row="${i.id}"><div class="item-main"><div class="item-name">${escapeHtml(i.name)}</div><div class="item-meta"><span class="mini">${escapeHtml(i.qty)} ${escapeHtml(i.unit||'')}</span><span class="stock-status ${cls}">${label}</span></div></div><div class="item-actions"><button class="action-btn edit" data-edit-stock="${i.id}">Modifier</button><button class="action-btn delete" data-delete-stock="${i.id}">Supprimer</button></div></div>`}).join('')}</div></section>`).join(''):'<div class="empty">Aucun produit en stock.</div>';
  box.querySelectorAll('[data-edit-stock]').forEach(b=>b.onclick=()=>openStockEdit(Number(b.dataset.editStock)));
  box.querySelectorAll('[data-delete-stock]').forEach(b=>b.onclick=()=>deleteStock(Number(b.dataset.deleteStock)))
}
function openStockEdit(id,prefill=''){
  const current=id?state.stock.find(x=>x.id===id):null,i=current||{name:prefill,category:classify(prefill),qty:1,unit:'unité',threshold:1,auto:true},oldStatus=current?stockStatusKey(current):null;
  editorForm.innerHTML=`<h2>${id?'Modifier le produit':'Nouveau produit'}</h2><div class="field"><label>Nom</label><input id="sName" value="${escapeHtml(i.name)}"></div><div class="field"><label>Catégorie</label><select id="sCat">${options(categoryNames(),i.category)}</select></div><div class="modal-grid"><div class="field"><label>Quantité</label><input id="sQty" type="number" min="0" step="0.1" value="${escapeHtml(i.qty)}"></div><div class="field"><label>Unité de mesure</label><select id="sUnit">${unitOptions(i.unit||'unité')}</select></div></div><div class="field"><label>Seuil faible</label><input id="sThreshold" type="number" min="0" step="0.1" value="${escapeHtml(i.threshold)}"></div><div class="switchline"><span>Proposer l’ajout aux courses si faible</span><input id="sAuto" type="checkbox" ${i.auto?'checked':''}></div><div class="modal-actions"><button class="cancel" value="cancel">Annuler</button><button class="save" type="button" id="saveStock">Enregistrer</button></div>`;
  editor.showModal();document.getElementById('saveStock').onclick=()=>{
    const obj={id:id||Date.now(),name:document.getElementById('sName').value.trim()||'Produit',category:document.getElementById('sCat').value,qty:Number(document.getElementById('sQty').value||0),unit:document.getElementById('sUnit').value.trim(),threshold:Number(document.getElementById('sThreshold').value||0),auto:document.getElementById('sAuto').checked};
    if(current)Object.assign(current,obj);else state.stock.push(obj);
    const newStatus=stockStatusKey(obj),becameLow=newStatus!=='good'&&(oldStatus==='good'||oldStatus===null),duplicate=state.courses.some(c=>normalize(c.name)===normalize(obj.name));
    if(obj.auto&&becameLow&&!duplicate&&confirm(`« ${obj.name} » est ${newStatus==='low'?'faible':'à racheter'}. L’ajouter aux courses ?`)){state.courses.push({id:Date.now()+1,name:obj.name,quantity:1,unit:obj.unit,category:obj.category,done:false,note:'',source:'stock'})}
    save();editor.close();render()
  }
}
function deleteStock(id){const i=state.stock.find(x=>x.id===id);if(i&&confirm(`Supprimer uniquement « ${i.name} » du stock ?`)){state.stock=state.stock.filter(x=>x.id!==id);save();render()}}
function settingsSection(title,key,placeholder){
  return`<section class="settings-section"><h3>${title}</h3><div class="settings-add"><input data-setting-input="${key}" placeholder="${placeholder}"><button data-setting-add="${key}">Ajouter</button></div><div class="settings-list">${state[key].map((value,index)=>`<span class="setting-chip"><span>${escapeHtml(value)}</span><button data-setting-delete="${key}" data-setting-index="${index}" aria-label="Supprimer ${escapeHtml(value)}">×</button></span>`).join('')}</div></section>`
}
function categorySettingsSection(){
  const rows=state.categorySettings.map((category,index)=>`<div class="category-setting" data-category-setting="${index}"><div class="category-setting-row"><input class="category-color" type="color" value="${escapeHtml(category.color||'#7e7e7e')}" aria-label="Couleur du rayon"><input class="category-name" value="${escapeHtml(category.name)}" ${category.name==='Autres'?'readonly':''} aria-label="Nom du rayon"></div><textarea class="category-keywords" placeholder="Mots-clés séparés par des virgules" ${category.name==='Autres'?'disabled':''}>${escapeHtml((category.keywords||[]).join(', '))}</textarea>${category.name==='Autres'?'<div class="help">Rayon de secours obligatoire.</div>':`<div class="category-actions"><button class="save-category" data-save-category="${index}">Enregistrer</button><button class="delete-category" data-delete-category="${index}">Supprimer</button></div>`}</div>`).join('');
  return`<section class="settings-section"><h3>Rayons et classement</h3><div class="help">Les mots-clés déterminent le classement automatique.</div>${rows}<div class="new-category"><div class="category-setting-row"><input id="newCategoryColor" class="category-color" type="color" value="#6f9855" aria-label="Couleur du nouveau rayon"><input id="newCategoryName" class="category-name" placeholder="Nouveau rayon"></div><textarea id="newCategoryKeywords" class="category-keywords" placeholder="Mots-clés : bio, vrac…"></textarea><div class="category-actions"><button class="save-category" id="addCategory">Ajouter le rayon</button></div></div></section>`
}
function openSettings(){
  settingsContent.innerHTML=`${settingsSection('Produits favoris','favoriteProducts','Ex. tomates cerises')}${settingsSection('Repas habituels','usualMeals','Ex. poulet rôti')}${settingsSection('Unités personnalisées','customUnits','Ex. barquette')}${categorySettingsSection()}<section class="settings-section"><h3>Sauvegarde et données</h3><div class="settings-data"><button id="exportData">Exporter</button><button id="importData">Importer</button><button class="reset-data" id="resetData">Réinitialiser l’application</button></div></section>`;
  settingsContent.querySelectorAll('[data-setting-add]').forEach(button=>button.onclick=()=>addSettingValue(button.dataset.settingAdd));
  settingsContent.querySelectorAll('[data-setting-input]').forEach(input=>input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();addSettingValue(input.dataset.settingInput)}}));
  settingsContent.querySelectorAll('[data-setting-delete]').forEach(button=>button.onclick=()=>deleteSettingValue(button.dataset.settingDelete,Number(button.dataset.settingIndex)));
  settingsContent.querySelectorAll('[data-save-category]').forEach(button=>button.onclick=()=>saveCategorySetting(Number(button.dataset.saveCategory)));
  settingsContent.querySelectorAll('[data-delete-category]').forEach(button=>button.onclick=()=>deleteCategorySetting(Number(button.dataset.deleteCategory)));
  document.getElementById('addCategory').onclick=addCategorySetting;
  document.getElementById('exportData').onclick=exportData;document.getElementById('importData').onclick=()=>document.getElementById('importDataFile').click();document.getElementById('resetData').onclick=resetData;
  settingsDialog.showModal()
}
function addSettingValue(key){
  const input=settingsContent.querySelector(`[data-setting-input="${key}"]`),value=input.value.trim();if(!value)return;
  if(!state[key].some(item=>normalize(item)===normalize(value)))state[key].push(value);
  save();openSettingsRefresh()
}
function deleteSettingValue(key,index){state[key].splice(index,1);save();openSettingsRefresh()}
function saveCategorySetting(index){
  const row=settingsContent.querySelector(`[data-category-setting="${index}"]`),category=state.categorySettings[index],oldName=category.name,newName=row.querySelector('.category-name').value.trim();
  if(!newName||state.categorySettings.some((item,i)=>i!==index&&normalize(item.name)===normalize(newName))){alert('Ce nom de rayon est vide ou déjà utilisé.');return}
  category.name=newName;category.color=row.querySelector('.category-color').value;category.keywords=row.querySelector('.category-keywords').value.split(',').map(x=>x.trim()).filter(Boolean);
  if(oldName!==newName){state.courses.forEach(item=>{if(item.category===oldName)item.category=newName});state.stock.forEach(item=>{if(item.category===oldName)item.category=newName})}
  save();openSettingsRefresh()
}
function addCategorySetting(){
  const name=document.getElementById('newCategoryName').value.trim();if(!name||state.categorySettings.some(item=>normalize(item.name)===normalize(name))){alert('Ce nom de rayon est vide ou déjà utilisé.');return}
  const otherIndex=state.categorySettings.findIndex(item=>item.name==='Autres'),category={name,color:document.getElementById('newCategoryColor').value,keywords:document.getElementById('newCategoryKeywords').value.split(',').map(x=>x.trim()).filter(Boolean)};
  state.categorySettings.splice(otherIndex<0?state.categorySettings.length:otherIndex,0,category);save();openSettingsRefresh()
}
function deleteCategorySetting(index){
  const category=state.categorySettings[index];if(!category||category.name==='Autres')return;
  if(confirm(`Supprimer le rayon « ${category.name} » ? Ses produits seront déplacés vers « Autres ».`)){state.courses.forEach(item=>{if(item.category===category.name)item.category='Autres'});state.stock.forEach(item=>{if(item.category===category.name)item.category='Autres'});state.categorySettings.splice(index,1);save();openSettingsRefresh()}
}
function openSettingsRefresh(){settingsDialog.close();openSettings();render()}
function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=`courses-repas-stock-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
function importDataFile(file){
  const reader=new FileReader();reader.onload=()=>{
    try{
      const imported=JSON.parse(reader.result);if(!imported||!Array.isArray(imported.courses)||!Array.isArray(imported.stock))throw new Error();
      state={...structuredClone(defaultState),...imported,meals:{...(imported.meals||{})},favoriteProducts:Array.isArray(imported.favoriteProducts)?imported.favoriteProducts:[],usualMeals:Array.isArray(imported.usualMeals)?imported.usualMeals:[],customUnits:Array.isArray(imported.customUnits)?imported.customUnits:[],categorySettings:Array.isArray(imported.categorySettings)?imported.categorySettings:structuredClone(defaultCategorySettings)};save();settingsDialog.close();render();alert('Sauvegarde importée.')
    }catch{alert('Ce fichier de sauvegarde n’est pas valide.')}
  };reader.readAsText(file)
}
function resetData(){if(confirm('Réinitialiser toutes les données et tous les paramètres ?')){state=structuredClone(defaultState);save();settingsDialog.close();document.querySelectorAll('.hub').forEach(b=>b.classList.toggle('active',b.dataset.hub===state.active));render()}}
document.getElementById('openSettings').onclick=openSettings;
document.getElementById('closeSettings').onclick=()=>settingsDialog.close();
document.getElementById('importDataFile').onchange=event=>{const file=event.target.files[0];if(file)importDataFile(file);event.target.value=''};
window.__appTest={getState:()=>structuredClone(state),classify,stockStatusKey,setHub,reset:()=>{state=structuredClone(defaultState);save();render()}};
document.querySelectorAll('.hub').forEach(b=>b.classList.toggle('active',b.dataset.hub===state.active));setBottomNav(state.active);render();
if('serviceWorker' in navigator&&location.protocol.startsWith('http')){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
}
