import {renderWorksheetPaperD} from './guide-common.js?v=0.1.42';
import {parseNetwork,planSubnets,subnetAt,summaryIndices,usableHosts,numberToIPv4,ipv4ToNumber} from './ipcalc-ipv4.js';
const $=id=>document.getElementById(id);
let plan=null,shown=0,workIndex=0;
const revealedLines=new Set();
function binary(address){return address.split('.').map(o=>Number(o).toString(2).padStart(8,'0')).join('.');}
function render(){
 if(!plan)return;
 const count=plan.concernedCount,indices=summaryIndices(count),body=$('flsm-rows');body.replaceChildren();
 $('shown-info').textContent=count<=6?`${count} sous-réseau(x) affiché(s)`:`${count} sous-réseaux demandés : les 3 premiers et les 3 derniers sont affichés (6 au total).`;
 indices.forEach((n,i)=>{const sr=subnetAt(plan,n),tr=document.createElement('tr');const values=[String(n),binary(sr.address),sr.address,binary(sr.broadcast),sr.broadcast];values.forEach((v,j)=>{const td=document.createElement('td');if(j===0){const b=document.createElement('b');b.textContent=v;td.append(b);}else if(i<shown){if(j===1||j===3){const c=document.createElement('code');c.textContent=v;td.append(c);}else td.textContent=v;}else td.textContent='…';tr.append(td);});body.append(tr);});
 $('flsm-next').disabled=shown>=indices.length;
 $('flsm-next').textContent=shown>=indices.length?'Tous les sous-réseaux sont visibles':'Révéler un sous-réseau';
}
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
  if(i<count){cell.style.backgroundColor=colors[i%colors.length];cell.title='Sous-réseau '+(i+1)+' utilisé';}
  else{cell.className='is-free';cell.title='Sous-réseau '+(i+1)+' disponible';}
  bar.append(cell);
 }
 bar.setAttribute('aria-label',count+' sous-réseaux utilisés sur '+capacity+', '+free+' disponibles');
 $('flsm-c-used').textContent=count+' utilisés ('+(100*count/capacity).toLocaleString('fr-FR',{maximumFractionDigits:2})+' %)';
 $('flsm-c-free').textContent=free+' disponibles ('+(100*free/capacity).toLocaleString('fr-FR',{maximumFractionDigits:2})+' %)';
}
function renderSteps(){
 if(!plan)return;
 const base=parseNetwork($('base-address').value.trim(),$('base-prefix').value.trim().replace(/^\\//,''));
 const indices=summaryIndices(plan.concernedCount);
 const subnets=indices.map(number=>({number,...subnetAt(plan,number)}));
 for(let stage=0;stage<=3;stage++){
  renderWorksheetPaperD($('flsm-sheet-'+stage),{
   initialPrefix:base.prefix,subnetPrefix:plan.prefix,
   baseNetwork:base.address,baseBroadcast:base.broadcast,
   subnets,stage
  });
 }
 const e=$('flsm-e-explanation');
 if(e)e.textContent=plan.concernedCount<=6?
  'Je remplis les '+(plan.prefix-base.prefix)+' bits empruntés pour chaque sous-réseau, dans l’ordre binaire.':
  'Je remplis les '+(plan.prefix-base.prefix)+' bits empruntés pour les trois premiers et les trois derniers sous-réseaux. Les numéros intermédiaires ne sont pas oubliés.';
}
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
  shown=0;
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
  $('unused-hosts').textContent=free+' sous-réseau(x) non attribué(s) × '+usableHosts(plan.prefix).toLocaleString('fr-FR')+' hôtes utilisables = '+(free*usableHosts(plan.prefix)).toLocaleString('fr-FR')+' hôtes utilisables non affectés.';
  $('result-initial').textContent='/'+base.prefix;
  $('result-bits').textContent=String(plan.prefix-base.prefix);
  renderPowers(count);
  $('result-prefix').textContent='/'+plan.prefix;
  $('flsm-c-final-prefix').textContent='/'+plan.prefix;

  const hostBits=32-plan.prefix;
  $('hosts-formula').replaceChildren(document.createTextNode('2'),Object.assign(document.createElement('sup'),{textContent:String(hostBits)}),document.createTextNode(' - 2 = '+usableHosts(plan.prefix).toLocaleString('fr-FR')));
  $('hosts-result').textContent=`Chaque sous-réseau /${plan.prefix} dispose de ${usableHosts(plan.prefix).toLocaleString('fr-FR')} hôtes utilisables.`;
  render();
 }catch(e){plan=null;$('flsm-rows').replaceChildren();$('error').textContent=e.message;}
}
$('subnet-count').value='4';
$('subnet-count').addEventListener('change',calculate);
$('flsm-next').addEventListener('click',()=>{if(plan){shown=Math.min(summaryIndices(plan.concernedCount).length,shown+1);render();}});
$('flsm-reset').addEventListener('click',()=>{shown=0;render();});
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
 launchTraining.textContent='Lancer : Exercice complet + '+difficultyNames[selectedDifficulty];
 launchInfo.textContent='';
}));
launchTraining?.addEventListener('click',()=>{
 if(!selectedDifficulty)return;
 launchInfo.textContent='Le parcours interactif « '+difficultyNames[selectedDifficulty]+' » sera intégré à la prochaine étape.';
});

const goFlsmTraining=$('go-flsm-training');
goFlsmTraining?.addEventListener('click',()=>{const section=$('training-fold');section.open=true;section.scrollIntoView({behavior:'smooth',block:'start'});});
