// Composant partagé FLSM / VLSM : rendu progressif d'une fiche IPv4 à 32 bits.
export function renderWorksheet(target,{initialPrefix,subnetPrefix,network,broadcast,subnetNumber,stage}){
 target.replaceChildren();
 const ipToBits=ip=>ip.split('.').map(x=>Number(x).toString(2).padStart(8,'0')).join('');
 const networkBits=ipToBits(network),broadcastBits=ipToBits(broadcast);
 const borrowed=subnetPrefix-initialPrefix;
 const table=document.createElement('table');table.className='bit-table bit-table-lesson';
 const caption=document.createElement('caption');caption.textContent='Sous-réseau '+subnetNumber+' : état de ma fiche';table.append(caption);
 const head=document.createElement('thead');
 const h=document.createElement('tr');const corner=document.createElement('th');corner.className='';corner.textContent='Octets';h.append(corner);
 for(let oct=0;oct<4;oct++){const cell=document.createElement('th');cell.colSpan=8;cell.className='octet octet-'+(oct+1);cell.textContent=(oct+1)+(oct===0?'er':'e')+' octet';h.append(cell);}head.append(h);
 const weights=document.createElement('tr');const wlabel=document.createElement('th');wlabel.textContent='Poids des bits';weights.append(wlabel);
 for(let i=0;i<32;i++){const c=document.createElement('th');c.textContent=String(2**(7-i%8));c.className='weight'+(i>=initialPrefix&&i<subnetPrefix?' flsm-borrowed-head':'');weights.append(c);}head.append(weights);const exponents=document.createElement('tr');const elabel=document.createElement('th');elabel.textContent='Puissances de 2';exponents.append(elabel);for(let i=0;i<32;i++){const cell=document.createElement('th');cell.className='weight'+(i>=initialPrefix&&i<subnetPrefix?' flsm-borrowed-head':'');cell.append(document.createTextNode('2'));const sup=document.createElement('sup');sup.textContent=String(7-i%8);cell.append(sup);exponents.append(cell);}head.append(exponents);table.append(head);
 
 const body=document.createElement('tbody');
 const rows=[['Réseau (binaire)',networkBits,2],['Réseau (décimal)',network,3],['Broadcast (binaire)',broadcastBits,4],['Broadcast (décimal)',broadcast,5]];
 for(const [label,value,required] of rows){
  const tr=document.createElement('tr');const name=document.createElement('th');name.className='';name.textContent=label;tr.append(name);
  if(label.includes('décimal')){
   const octets=value.split('.');
   for(let oct=0;oct<4;oct++){const cell=document.createElement('td');cell.colSpan=8;cell.className='weight';cell.textContent=stage>=required?octets[oct]:'·';tr.append(cell);}
  }else{
   for(let i=0;i<32;i++){
    const cell=document.createElement('td');cell.className=(i<initialPrefix?'network':i<subnetPrefix?'flsm-borrowed-cell':'hostpart')+(i===initialPrefix-1?' flsm-initial-boundary':'')+(i===subnetPrefix-1?' flsm-new-boundary':'');
    // Dès l'étape D, seuls les bits empruntés sont renseignés.
    cell.textContent=stage>=required?value[i]:(stage>=1&&i>=initialPrefix&&i<subnetPrefix?networkBits[i]:'·');
    tr.append(cell);
   }
  }
  body.append(tr);
 }
 table.append(body);target.append(table);

}

/* Variante papier expérimentale : réservée à la partie D. */
export function renderWorksheetPaperD(target,{initialPrefix,subnetPrefix,subnetNumber}){
 target.replaceChildren();
 const make=(tag,cls,content)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e;};
 const frame=make('div','flsm-paper-d');
 const reference=make('table','flsm-paper-grid flsm-paper-reference');
 const refBody=make('tbody');
 const octets=make('tr');octets.append(make('th','flsm-paper-label','OCTETS'));
 for(let o=0;o<4;o++){const th=make('th','flsm-paper-octet flsm-paper-octet-'+(o+1),(o+1)+(o===0?'er':'e')+' octet');th.colSpan=8;octets.append(th);}refBody.append(octets);
 for(const [name,kind] of [['Puissances de 2','powers'],['Poids décimaux','weights']]){
  const tr=make('tr');tr.append(make('th','flsm-paper-label',name));
  for(let i=0;i<32;i++){
   const th=make('th','flsm-paper-reference-bit'+(i>=initialPrefix&&i<subnetPrefix?' flsm-paper-borrowed-head':''));
   if(kind==='weights')th.textContent=String(2**(7-i%8));
   else{th.append(document.createTextNode('2'));const sup=make('sup','',String(7-i%8));th.append(sup);}
   tr.append(th);
  }
  refBody.append(tr);
 }
 reference.append(refBody);frame.append(reference);
 const block=make('div','flsm-paper-subnet');
 const header=make('div','flsm-paper-subnet-title');header.append(make('strong','','Sous-réseau'),make('span','',String(subnetNumber)));block.append(header);
 const table=make('table','flsm-paper-grid flsm-paper-address');
 const tbody=make('tbody');
 for(const label of ['Réseau (binaire)','Réseau (décimal)','Broadcast (binaire)','Broadcast (décimal)']){
  const tr=make('tr');tr.append(make('th','flsm-paper-label',label));
  if(label.includes('décimal')){
   for(let oct=0;oct<4;oct++){const td=make('td','flsm-paper-decimal','');td.colSpan=8;tr.append(td);}
  }else{
   for(let i=0;i<32;i++){
    const classes=['flsm-paper-bit',i<initialPrefix?'flsm-paper-network':i<subnetPrefix?'flsm-paper-borrowed':'flsm-paper-host'];
    if(i===initialPrefix-1)classes.push('flsm-paper-initial-bar');
    if(i===subnetPrefix-1)classes.push('flsm-paper-subnet-bar');
    tr.append(make('td',classes.join(''),''));
   }
  }
  tbody.append(tr);
 }
 table.append(tbody);block.append(table);frame.append(block);target.append(frame);
}
