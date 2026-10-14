import {parseNetwork,planSubnets,subnetAt,summaryIndices,usableHosts,numberToIPv4,ipv4ToNumber} from './ipv4-engine.js';
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
function renderBitWorkspace(){
 if(!plan)return;
 const base=parseNetwork($('base-address').value.trim(),$('base-prefix').value.trim().replace(/^\\//,''));
 const sr=subnetAt(plan,workIndex);
 const fixed=base.prefix,borrowed=plan.prefix-base.prefix;
 const net=ipv4ToNumber(sr.address),broadcast=ipv4ToNumber(sr.broadcast);
 const bitAt=(value,position)=>String((value >>> (31-position))&1);
 const wrap=$('flsm-bit-workspace');wrap.replaceChildren();
 const table=document.createElement('table');table.className='flsm-bits';
 const caption=document.createElement('caption');caption.textContent='Sous-réseau '+workIndex+' : je complète les cases de ma fiche';table.append(caption);
 const head=document.createElement('thead');
 const header=document.createElement('tr');
 const label=document.createElement('th');label.textContent='OCTETS';label.className='bit-row-name';header.append(label);
 for(let oct=0;oct<4;oct++){const th=document.createElement('th');th.colSpan=8;th.textContent=(oct+1)+'e octet';header.append(th);}
 head.append(header);
 const weights=document.createElement('tr');const wl=document.createElement('th');wl.textContent='Poids décimaux';wl.className='bit-row-name';weights.append(wl);
 for(let bit=0;bit<32;bit++){const th=document.createElement('th');th.textContent=String(2**(7-bit%8));th.className=(bit<fixed?'bit-fixed':bit<fixed+borrowed?'bit-borrowed':'bit-host')+(bit%8===0?' bit-octet-start':'');weights.append(th);}
 head.append(weights);table.append(head);
 const body=document.createElement('tbody');
 const rows=[
 ['Bits empruntés','borrowed'],
 ['Réseau (binaire)','network-binary'],
 ['Réseau (décimal)','network-decimal'],
 ['Broadcast (binaire)','broadcast-binary'],
 ['Broadcast (décimal)','broadcast-decimal']
 ];
 rows.forEach(([title,key])=>{
  const tr=document.createElement('tr');const name=document.createElement('th');name.textContent=title;name.className='bit-row-name';tr.append(name);
  for(let bit=0;bit<32;bit++){
   const td=document.createElement('td');
   td.className=(bit<fixed?'bit-fixed':bit<fixed+borrowed?'bit-borrowed':'bit-host')+(bit%8===0?' bit-octet-start':'');
   const show=revealedLines.has(key);
   if(key==='borrowed')td.textContent=bit>=fixed&&bit<fixed+borrowed?bitAt(net,bit):'';
   else if(key==='network-binary'||key==='broadcast-binary')td.textContent=show?bitAt(key==='network-binary'?net:broadcast,bit):'·';
   else if(bit%8===0){
    if(show){const oct=(key==='network-decimal'?net:broadcast) >>> (24-8*Math.floor(bit/8)) &255;td.textContent=String(oct);td.colSpan=8;tr.append(td);}
    else {td.textContent='…';td.colSpan=8;tr.append(td);}
    bit+=7;continue;
   }else continue;
   tr.append(td);
  }
  body.append(tr);
 });
 table.append(body);wrap.append(table);
 document.querySelectorAll('.flsm-reveal-line').forEach(button=>{
  const visible=revealedLines.has(button.dataset.flsmLine);
  button.setAttribute('aria-pressed',String(visible));
  button.textContent=(visible?'Masquer':'Afficher')+' la ligne '+({'network-binary':'réseau en binaire','network-decimal':'réseau en décimal','broadcast-binary':'broadcast en binaire','broadcast-decimal':'broadcast en décimal'}[button.dataset.flsmLine]);
 });
}
$('flsm-work-subnet').addEventListener('change',e=>{workIndex=Number(e.target.value);revealedLines.clear();renderBitWorkspace();});
document.querySelectorAll('.flsm-reveal-line').forEach(button=>button.addEventListener('click',()=>{
 const key=button.dataset.flsmLine;
 if(revealedLines.has(key))revealedLines.delete(key);else revealedLines.add(key);
 renderBitWorkspace();
}));
function calculate(){
 $('error').textContent='';
 try{
  const prefix=$('base-prefix').value.trim().replace(/^\//,'');
  const base=parseNetwork($('base-address').value.trim(),prefix);
  if(base.address!==$('base-address').value.trim())throw Error('Indiquez l’adresse réseau initiale, pas une adresse d’hôte.');
  if(!base.broadcast||base.broadcast!==$('base-broadcast').value.trim())throw Error('Le broadcast initial ne correspond pas au réseau et au préfixe fournis.');
  const count=Number($('subnet-count').value);
  if(!Number.isSafeInteger(count)||count<1)throw Error('Indiquez un nombre entier de sous-réseaux supérieur à zéro.');
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
  const borrowedBody=$('borrowed-rows');
  borrowedBody.replaceChildren();
  const borrowed=plan.prefix-base.prefix;
  summaryIndices(count).forEach(n=>{
    const tr=document.createElement('tr');
    const bitText=borrowed? n.toString(2).padStart(borrowed,'0'):'(aucun)';
    [String(n),bitText,'Sous-réseau '+n+' : '+bitText].forEach(v=>{
      const td=document.createElement('td');td.textContent=v;tr.append(td);
    });
    borrowedBody.append(tr);
  });
  const workSelect=$('flsm-work-subnet');
  workSelect.replaceChildren();
  summaryIndices(count).forEach(n=>{
    const option=document.createElement('option');option.value=String(n);option.textContent='Sous-réseau '+n;workSelect.append(option);
  });
  workIndex=summaryIndices(count)[0]??0;
  revealedLines.clear();
  workSelect.value=String(workIndex);
  renderBitWorkspace();
  $('unused-hosts').textContent=free+' sous-réseau(x) non attribué(s) × '+usableHosts(plan.prefix).toLocaleString('fr-FR')+' hôtes utilisables = '+(free*usableHosts(plan.prefix)).toLocaleString('fr-FR')+' hôtes utilisables non affectés.';
  $('result-initial').textContent='/'+base.prefix;
  $('result-bits').textContent=String(plan.prefix-base.prefix);
  $('result-prefix').textContent='/'+plan.prefix;
  $('result-capacity').textContent=`${count} sous-réseaux demandés, ${plan.capacity} sous-réseaux possibles avec ${plan.prefix-base.prefix} bit(s) emprunté(s).`;
  const hostBits=32-plan.prefix;
  $('hosts-formula').textContent=`2^(${hostBits}) - 2 = ${usableHosts(plan.prefix).toLocaleString('fr-FR')}`;
  $('hosts-result').textContent=`Chaque sous-réseau /${plan.prefix} dispose de ${usableHosts(plan.prefix).toLocaleString('fr-FR')} hôtes utilisables.`;
  render();
 }catch(e){plan=null;$('flsm-rows').replaceChildren();$('error').textContent=e.message;}
}
$('calculate').addEventListener('click',calculate);
$('flsm-next').addEventListener('click',()=>{if(plan){shown=Math.min(summaryIndices(plan.concernedCount).length,shown+1);render();}});
$('flsm-reset').addEventListener('click',()=>{shown=0;render();});
const themeButton=$('theme');
try{if(localStorage.getItem('ipv4-theme')==='dark')document.body.classList.add('dark')}catch{}
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
