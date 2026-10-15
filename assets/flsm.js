import {renderWorksheetPaperD} from './guide-common.js?v=0.1.57';
import {parseNetwork,planSubnets,subnetAt,summaryIndices,usableHosts} from './ipcalc-ipv4.js';
const $=id=>document.getElementById(id);
let plan=null;
function renderPowers(count){
 const target=$('flsm-powers');if(!target)return;
 target.replaceChildren();
 const needed=Math.ceil(Math.log2(count)),capacity=2**needed,free=capacity-count;
 $('flsm-c-selected').textContent=count+' sous-réseaux';
 $('flsm-c-needed').textContent=count+' sous-réseaux';
 for(let bits=0;bits<=needed;bits++){
  const n=2**bits,item=document.createElement('div');
  item.className='flsm-power-item'+(bits===needed?' is-sufficient':'');
  const expression=document.createElement('strong');
  expression.append(document.createTextNode('2'),Object.assign(document.createElement('sup'),{textContent:String(bits)}),document.createTextNode(' = '+n));
  const status=document.createElement('span');status.textContent=n>=count?'Suffisant':'Pas assez';
  item.append(expression,status);target.append(item);
 }
 $('flsm-powers-explanation').textContent='2'+['⁰','¹','²','³','⁴','⁵'][needed]+' = '+capacity+' sous-réseaux possibles';
 $('flsm-c-bits').textContent="J'ai donc besoin de "+needed+' bits.';
 const bar=$('flsm-c-bar');bar.replaceChildren();
 const colors=['#2c729f','#228d85','#d19a38','#8876b4','#c46d78','#477fa4','#5c9d83','#9b7eae'];
 for(let i=0;i<capacity;i++){
  const cell=document.createElement('span');
  if(i<count){cell.style.backgroundColor=colors[i%colors.length];cell.title='Sous-réseau '+i+' utilisé';}
  else{cell.className='is-free';cell.title='Sous-réseau '+i+' disponible';}
  bar.append(cell);
 }
 bar.setAttribute('aria-label',count+' sous-réseaux utilisés sur '+capacity+', '+free+' disponibles');
 $('flsm-c-used').textContent=count+' utilisés ('+(100*count/capacity).toLocaleString('fr-FR',{maximumFractionDigits:2})+' %)';
 $('flsm-c-free').textContent=free+' disponibles ('+(100*free/capacity).toLocaleString('fr-FR',{maximumFractionDigits:2})+' %)';
}
function renderSteps(){
 if(!plan)return;
 const base=parseNetwork($('base-address').value.trim(),$('base-prefix').value.trim().replace(/^\//,''));
 const indices=summaryIndices(plan.concernedCount);
 const subnets=indices.map(number=>({...subnetAt(plan,number),number}));
 for(let stage=0;stage<=3;stage++){
  renderWorksheetPaperD($('flsm-sheet-'+stage),{
   initialPrefix:base.prefix,subnetPrefix:plan.prefix,
   baseNetwork:base.address,baseBroadcast:base.broadcast,
   subnets,stage
  });
 }
 const bilan=$('flsm-g-bilan-list');
 if(bilan){
  bilan.replaceChildren();
  $('flsm-g-bilan-intro').textContent='J’ai obtenu '+plan.concernedCount+' sous-réseaux en /'+plan.prefix+' :';
  const table=document.createElement('table');
  const body=document.createElement('tbody');
  for(const subnet of subnets){
   const row=document.createElement('tr');
   const label=document.createElement('th');label.scope='row';label.textContent='Sous-réseau '+subnet.number;
   const address=document.createElement('td');address.textContent=subnet.address+'/'+plan.prefix;
   row.append(label,address);body.append(row);
  }
  table.append(body);bilan.append(table);
  $('flsm-g-bilan-note').textContent=plan.concernedCount>6?'Voici les 3 premiers et les 3 derniers sous-réseaux. Les autres sont également compris dans le découpage.':'';
 }
 const e=$('flsm-e-explanation');
 if(e)e.textContent=plan.concernedCount<=6?
  'Je remplis les '+(plan.prefix-base.prefix)+' bits empruntés pour chaque sous-réseau, dans l’ordre binaire.':
  'Je remplis les '+(plan.prefix-base.prefix)+' bits empruntés pour les trois premiers et les trois derniers sous-réseaux. Les numéros intermédiaires ne sont pas oubliés.';
 const guide=$('flsm-e-last-guide');
 if(guide && guide.dataset.lastCount!==String(plan.concernedCount)){
  guide.open=plan.concernedCount>6;
  guide.dataset.lastCount=String(plan.concernedCount);
 }

}
function renderPepetteExample(){
 const count=Number($('flsm-e-example-count').value);
 const bits=Math.ceil(Math.log2(count));
 const capacity=2**bits;
 const length=Math.min(3,count);
 const first=Array.from({length},(_,i)=>i);
 const last=Array.from({length},(_,i)=>count-length+i);
 const show=(id,values)=>{
  const target=$(id);target.replaceChildren();
  for(const n of values){
   const line=document.createElement('div');line.className='flsm-pepette-example-row';
   const number=document.createElement('span');number.textContent=n+' =';
   const binary=document.createElement('code');binary.textContent=n.toString(2).padStart(bits,'0');
   line.append(number,binary);target.append(line);
  }
 };
 $('flsm-e-example-intro').textContent='Pour '+count+' sous-réseaux, j’emprunte '+bits+' bits.';
 show('flsm-e-example-first',first);show('flsm-e-example-last',last);
 $('flsm-e-example-capacity').textContent=count<capacity?'Je peux créer '+capacity+' combinaisons, mais seuls '+count+' sous-réseaux sont demandés. Les '+(capacity-count)+' autres restent disponibles.':'Les '+capacity+' combinaisons sont toutes utilisées.';
}
$('flsm-e-example-count').addEventListener('change',renderPepetteExample);
renderPepetteExample();
function calculate(){
 $('error').textContent='';
 try{
  const prefix=$('base-prefix').value.trim().replace(/^\//,'');
  const base=parseNetwork($('base-address').value.trim(),prefix);
  if(base.address!==$('base-address').value.trim())throw Error('Indiquez l’adresse réseau initiale, pas une adresse d’hôte.');
  if(!base.broadcast||base.broadcast!==$('base-broadcast').value.trim())throw Error('Le broadcast initial ne correspond pas au réseau et au préfixe fournis.');
  const count=Number($('subnet-count').value);
  if(!Number.isSafeInteger(count)||count<2||count>16)throw Error('Choisis un nombre de sous-réseaux entre 2 et 16.');
  plan=planSubnets(base,{method:'count',count});
  if(plan.prefix>=31)throw Error('Ce cours utilise des sous-réseaux avec des adresses réseau et broadcast distinctes : choisissez un découpage moins fin.');
  $('requested-count').textContent=String(count);
  $('possible-count').textContent=String(plan.capacity);
  $('free-count').textContent=String(plan.capacity-count);
  const free=plan.capacity-count;
  const allocation=$('flsm-allocation');
  allocation.replaceChildren();
  // Affichage limité pour garder une barre lisible, sans énumérer des milliers de sous-réseaux.
  if(plan.capacity<=32){
    allocation.style.gridTemplateColumns='repeat('+Math.min(plan.capacity,8)+',minmax(0,1fr))';
    for(let n=0;n<plan.capacity;n++){
      const cell=document.createElement('span');
      cell.textContent=String(n);
      cell.title='Sous-réseau '+n+(n<count?' attribué':' disponible');
      if(n<count)cell.classList.add('is-assigned');
      allocation.append(cell);
    }
  }else{
    allocation.style.gridTemplateColumns='1fr';
    const cell=document.createElement('span');
    cell.textContent=count+' sous-réseaux attribués sur '+plan.capacity+' possibles';
    cell.classList.add('is-assigned');
    allocation.append(cell);
  }
  $('free-explanation').textContent=free+' sous-réseau(x) non attribué(s) : '+(free*usableHosts(plan.prefix)).toLocaleString('fr-FR')+' adresses d’hôtes utilisables restent disponibles dans ces sous-réseaux.';
  renderSteps();
  $('result-initial').textContent='/'+base.prefix;
  $('result-bits').textContent=String(plan.prefix-base.prefix);
  renderPowers(count);
  $('result-prefix').textContent='/'+plan.prefix;
  $('flsm-c-final-prefix').textContent='/'+plan.prefix;

  const hostBits=32-plan.prefix;
  const formula=$('hosts-formula');
  formula.replaceChildren();
  for(const [exponent,suffix] of [
   ['(32 - CIDR)',' - 2'],
   ['(32 - '+plan.prefix+')',' - 2'],
   [String(hostBits),' - 2 = '+usableHosts(plan.prefix).toLocaleString('fr-FR')]
  ]){
   const line=document.createElement('div');
   line.append(document.createTextNode('Nb hôtes du sous-réseau = 2'),Object.assign(document.createElement('sup'),{textContent:exponent}),document.createTextNode(suffix));
   formula.append(line);
  }
  $('hosts-result').textContent=`Chaque sous-réseau /${plan.prefix} dispose de ${usableHosts(plan.prefix).toLocaleString('fr-FR')} hôtes utilisables.`;
 }catch(e){plan=null;$('error').textContent=e.message;}
}
$('subnet-count').value='4';
$('subnet-count').addEventListener('change',calculate);
const themeButton=$('theme');
try{const savedTheme=localStorage.getItem('ipv4-theme');if(savedTheme==='dark'||(!savedTheme&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.body.classList.add('dark')}catch{if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)document.body.classList.add('dark')}
themeButton.addEventListener('click',()=>{document.body.classList.toggle('dark');try{localStorage.setItem('ipv4-theme',document.body.classList.contains('dark')?'dark':'light')}catch{}});
calculate();

// Sélection de la difficulté : structure et classes reprises du manuel IPv4.
const difficultyButtons=[...document.querySelectorAll('[data-training-difficulty]')];
const launchTraining=document.getElementById('launch-training');
const launchInfo=document.getElementById('training-launch-info');
const difficultyNames={'1':'Avec Pépette','2':'Je me débrouille','3':'Je relève le défi'};
let selectedDifficulty=null;
difficultyButtons.forEach(button=>button.addEventListener('click',()=>{
 selectedDifficulty=button.dataset.trainingDifficulty;
 difficultyButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 launchTraining.disabled=false;
 launchTraining.textContent='Lancer : '+difficultyNames[selectedDifficulty];
 launchInfo.textContent='';
}));
launchTraining?.addEventListener('click',()=>{
 if(!selectedDifficulty)return;
 if(selectedDifficulty==='1'){startPepette();return;}
 launchInfo.textContent='Le parcours « '+difficultyNames[selectedDifficulty]+' » sera développé après validation du niveau Avec Pépette.';
});

const goFlsmTraining=$('go-flsm-training');
goFlsmTraining?.addEventListener('click',()=>{const section=$('training-fold');section.open=true;section.scrollIntoView({behavior:'smooth',block:'start'});});

 
// Parcours Avec Pépette : tirage indépendant, sans historique ni liste ordonnée.
// Le moteur IPcalc reste la seule source des calculs de sous-réseaux.
let pepettePlan=null,pepetteStep=0;
const pepetteStages=['bits','prefix','initial-network','initial-broadcast','borrowed','binary','decimal','hosts'];
const pepetteRows=[['Réseau (binaire)','address',true],['Réseau (décimal)','address',false],['Broadcast (binaire)','broadcast',true],['Broadcast (décimal)','broadcast',false]];
const pepetteBits=ip=>ip.split('.').map(x=>Number(x).toString(2).padStart(8,'0')).join('');
const pepetteTasks=()=>[
 {kind:'number',label:'Nombre de bits empruntés',expected:pepettePlan.prefix-pepettePlan.base.prefix},
 {kind:'number',label:'Nouveau CIDR (sans /)',expected:pepettePlan.prefix},
 ...['address','broadcast'].map((key,i)=>({kind:'initial',label:i?'Broadcast initial (binaire)':'Réseau initial (binaire)',key})),
 ...Array.from({length:pepettePlan.concernedCount},(_,index)=>['address','broadcast'].map((key,i)=>({kind:'borrowed',index,key,label:'Sous-réseau '+index+' : '+(i?'Broadcast':'Réseau')+' (bits empruntés)'}))).flat(),
 ...Array.from({length:pepettePlan.concernedCount},(_,index)=>['address','broadcast'].map((key,i)=>({kind:'binary',index,key,label:'Sous-réseau '+index+' : '+(i?'Broadcast':'Réseau')+' (binaire)'}))).flat(),
 ...Array.from({length:pepettePlan.concernedCount},(_,index)=>['address','broadcast'].map((key,i)=>({kind:'decimal',index,key,label:'Sous-réseau '+index+' : '+(i?'Broadcast':'Réseau')+' (décimal)'}))).flat(),
 {kind:'number',label:'Nombre d’hôtes utilisables par sous-réseau',expected:usableHosts(pepettePlan.prefix)}
];
function pepetteRandom(n){
 if(globalThis.crypto?.getRandomValues){const a=new Uint32Array(1);const limit=Math.floor(4294967296/n)*n;let v;do{crypto.getRandomValues(a);v=a[0];}while(v>=limit);return v%n;}
 return Math.floor(Math.random()*n);
}
function pepetteExercise(){
 const count=pepetteRandom(2)===0?2:4,borrowed=count===2?1:2;
 const candidates=[8,16,24].flatMap(edge=>[edge,edge-borrowed]).filter(p=>p>=4&&p+borrowed<=30);
 for(let tries=0;tries<1000;tries++){
  const prefix=candidates[pepetteRandom(candidates.length)];
  const first=[10,172,192][pepetteRandom(3)];
  const second=first===172?16+pepetteRandom(16):first===192?168:pepetteRandom(16);
  const third=pepetteRandom(16)*16,fourth=pepetteRandom(16)*16;
  const raw=[first,second,third,fourth].join('.');
  const parsed=parseNetwork(raw,prefix);
  const ones=parsed.address.split('.').reduce((sum,x)=>sum+Number(x).toString(2).replace(/0/g,'').length,0);
  if(ones>12)continue;
  const candidate=planSubnets(parsed,{method:'count',count});
  return candidate;
 }
 throw new Error("Impossible de générer l'exercice.");
}

function startPepette(){
 try{
  pepettePlan=pepetteExercise();pepetteStep=0;
  $('pepette-training').hidden=false;$('pepette-finish').hidden=true;
  $('pepette-feedback').textContent='';launchInfo.textContent='';
  const base=pepettePlan.base;
  $('pepette-statement').textContent='Réseau initial : '+base.address+' | CIDR initial : /'+base.prefix+' | Broadcast initial : '+base.broadcast+' | Sous-réseaux demandés : '+pepettePlan.concernedCount+'.';
  renderPepetteWorksheet();
  $('pepette-training').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){launchInfo.textContent=e.message;}
}
function renderPepetteWorksheet(){
 const host=$('pepette-exercise');host.replaceChildren();
 const tasks=pepetteTasks(),active=tasks[pepetteStep],base=pepettePlan.base;
 if(!active){$('pepette-finish').hidden=false;$('pepette-progress').textContent='Exercice terminé.';return;}
 $('pepette-progress').textContent='Étape '+(pepetteStep+1)+' sur '+tasks.length+' : '+active.label;
 const history=document.createElement('div');history.className='pepette-history';
 for(let i=0;i<pepetteStep;i++){
  const previous=tasks[i],line=document.createElement('div');
  line.className='pepette-row pepette-completed';
  const title=document.createElement('strong');title.textContent='✓ Étape '+(i+1)+' : '+previous.label;
  line.append(title);
  if(previous.kind==='number'){
   const answer=document.createElement('span');answer.className='pepette-answer';
   answer.textContent=' = '+previous.expected+(previous.label.includes('CIDR')?' (/'+previous.expected+')':'');
   line.append(answer);
  }
  history.append(line);
 }
 host.append(history);
 const prompt=document.createElement('div');prompt.className='pepette-row';
 prompt.append(Object.assign(document.createElement('strong'),{textContent:'Je complète : '+active.label}));
 const feedback=$('pepette-feedback');feedback.textContent='';feedback.className='';
 if(active.kind==='number'){
  const input=document.createElement('input');input.className='pepette-decimal';input.inputMode='numeric';input.type='number';input.min='0';input.setAttribute('aria-label',active.label);
  const check=document.createElement('button');check.type='button';check.textContent='Vérifier ma réponse';
  check.addEventListener('click',()=>{
   if(input.value.trim()!==''&&Number(input.value)===active.expected){pepetteStep++;renderPepetteWorksheet();}
   else{feedback.textContent='Je vérifie mon calcul avant de continuer.';feedback.className='pepette-error';input.focus();}
  });
  prompt.append(document.createTextNode(' '),input,document.createTextNode(' '),check);
 }
 host.append(prompt);
 const frame=document.createElement('div');frame.className='flsm-paper-d';
 const reference=document.createElement('table');reference.className='flsm-paper-grid flsm-paper-reference';
 const head=document.createElement('tbody');
 const mk=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el;};
 const oct=mk('tr');oct.append(mk('th','flsm-paper-label','OCTETS'));
 for(let o=0;o<4;o++){const th=mk('th','flsm-paper-octet',(o+1)+(o===0?'er':'e')+' octet');th.colSpan=8;oct.append(th);}head.append(oct);
 for(const [title,powers] of [['Puissances de 2',true],['Poids décimaux',false]]){
  const tr=mk('tr');tr.append(mk('th','flsm-paper-label',title));
  for(let i=0;i<32;i++){
   const cell=mk('th','flsm-paper-reference-bit'+(i%8===7&&i!==31?' flsm-paper-octet-end':'')+(pepetteStep>=2&&i>=base.prefix&&i<pepettePlan.prefix?' flsm-paper-borrowed-head':''));
   if(powers)cell.append(document.createTextNode('2'),mk('sup','',String(7-i%8)));
   else cell.textContent=String(2**(7-i%8));
   tr.append(cell);
  }head.append(tr);
 }
 reference.append(head);frame.append(reference);
 const interactive=[];
 function addBlock(title,subnet,index){
  const block=mk('div','flsm-paper-subnet'),header=mk('div','flsm-paper-subnet-title');
  header.append(mk('strong','',title));block.append(header);
  const table=mk('table','flsm-paper-grid flsm-paper-address'),tbody=mk('tbody');
  for(const [label,key,binary] of pepetteRows){
   const tr=mk('tr'),name=mk('th','flsm-paper-label',label);tr.append(name);
   const taskIndex=tasks.findIndex(t=>t.key===key&&t.index===index&&t.kind===(binary?'binary':'decimal'));
   const borrowIndex=tasks.findIndex(t=>t.kind==='borrowed'&&t.index===index&&t.key===key);
   const initialIndex=tasks.findIndex(t=>t.kind==='initial'&&t.key===key);
   const isInitial=index===0;
   const current=tasks[pepetteStep];
   const editing= binary ? (isInitial&&current.kind==='initial'&&current.key===key ||
      current.index===index&&current.key===key&&(current.kind==='borrowed'||current.kind==='binary'))
      :current.kind==='decimal'&&current.index===index&&current.key===key;
   const expected=pepetteBits(current.kind==='initial'?base[key]:subnet[key]);
   const groups=[];
   if(binary){
    for(let i=0;i<32;i++){
     const cls=['flsm-paper-bit',i<base.prefix?'flsm-paper-network':pepetteStep>=2&&i<pepettePlan.prefix?'flsm-paper-borrowed':'flsm-paper-host'];
     if(i===base.prefix-1)cls.push('flsm-paper-initial-bar');
     if(pepetteStep>=2&&i===pepettePlan.prefix-1)cls.push('flsm-paper-subnet-bar');
     const td=mk('td',cls.join(' '));
     const inInitial=i<base.prefix,inBorrowed=i>=base.prefix&&i<pepettePlan.prefix,inHost=i>=pepettePlan.prefix;
     let completed=false,editable=false;
     const initialDone=initialIndex<pepetteStep,borrowDone=borrowIndex<pepetteStep,binaryDone=taskIndex<pepetteStep;
     completed=(inInitial&&initialDone)||(inBorrowed&&borrowDone)||(inHost&&binaryDone);
     editable=editing&&(current.kind==='initial'?inInitial:current.kind==='borrowed'?inBorrowed:inHost);
     if(editable){
      const input=mk('input','pepette-bit');input.inputMode='numeric';input.maxLength=1;input.setAttribute('aria-label',label+', bit '+(i+1));
      input.addEventListener('input',()=>{input.value=input.value.replace(/[^01]/g,'').slice(0,1);});
      td.append(input);interactive.push({input,expected:expected[i],octet:Math.floor(i/8),cell:td,borrowed:current.kind==='borrowed'});
     }else if(completed){
      const val=(inInitial?pepetteBits(base[key]):pepetteBits(subnet[key]))[i];td.textContent=val==='0'&&!inBorrowed?'':val;
     }
     tr.append(td);
    }
   }else{
    for(let o=0;o<4;o++){
     const td=mk('td','flsm-paper-decimal');td.colSpan=8;
     if(editing){
      const input=mk('input','pepette-decimal');input.inputMode='numeric';input.maxLength=3;input.setAttribute('aria-label',label+', octet '+(o+1));
      input.addEventListener('input',()=>{input.value=input.value.replace(/[^0-9]/g,'').slice(0,3);});
      td.append(input);interactive.push({input,expected:subnet[key].split('.')[o],octet:o,cell:td,decimal:true});
     }else if(taskIndex>=0&&taskIndex<pepetteStep)td.textContent=subnet[key].split('.')[o];
     tr.append(td);
    }
   }
   tbody.append(tr);
  }
  table.append(tbody);block.append(table);frame.append(block);
 }
 for(let i=0;i<pepettePlan.concernedCount;i++)addBlock('Sous-réseau '+i,subnetAt(pepettePlan,i),i);
 host.append(frame);
 if(interactive.length){
  const check=mk('button','','Vérifier ma ligne');check.type='button';check.className='pepette-check';
  check.addEventListener('click',()=>{
   let wrongOctet=-1;
   for(const item of interactive){
    const value=item.input.value.trim();
    const correct=item.decimal?value!==''&&Number(value)===Number(item.expected):
     item.borrowed?value===item.expected:value===''||value===item.expected;
    item.cell.classList.toggle('pepette-octet-error',!correct);
    if(!correct&&wrongOctet<0)wrongOctet=item.octet;
   }
   if(wrongOctet>=0){
    feedback.textContent='Je vérifie le '+(wrongOctet+1)+(wrongOctet===0?'er':'e')+' octet, puis je corrige ma ligne.';
    feedback.className='pepette-error';
    interactive.find(item=>item.octet===wrongOctet)?.input.focus();
   }else{pepetteStep++;renderPepetteWorksheet();}
  });
  prompt.append(document.createTextNode(' '),check);
 }
 if(pepetteStep===tasks.length-1){
  const help=mk('p','hint','Je calcule 2 puissance (32 - '+pepettePlan.prefix+') - 2.');prompt.append(help);
 }
}
$('pepette-again')?.addEventListener('click',startPepette);
$('pepette-menu')?.addEventListener('click',()=>{
 $('pepette-training').hidden=true;pepettePlan=null;selectedDifficulty=null;
 difficultyButtons.forEach(button=>button.setAttribute('aria-pressed','false'));
 launchTraining.disabled=true;launchTraining.textContent='Je choisis ma difficulté';
 $('training-fold').scrollIntoView({behavior:'smooth',block:'start'});
});
