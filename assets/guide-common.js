// Composant partagé FLSM / VLSM : rendu progressif d'une fiche IPv4 à 32 bits.
export function renderWorksheet(target,{initialPrefix,subnetPrefix,network,broadcast,subnetNumber,stage}){
 target.replaceChildren();
 const ipToBits=ip=>ip.split('.').map(x=>Number(x).toString(2).padStart(8,'0')).join('');
 const networkBits=ipToBits(network),broadcastBits=ipToBits(broadcast);
 const borrowed=subnetPrefix-initialPrefix;
 const table=document.createElement('table');table.className='flsm-bits';
 const caption=document.createElement('caption');caption.textContent='Sous-réseau '+subnetNumber+' : état de ma fiche';table.append(caption);
 const head=document.createElement('thead');
 const h=document.createElement('tr');const corner=document.createElement('th');corner.className='bit-row-name';corner.textContent='Octets';h.append(corner);
 for(let oct=0;oct<4;oct++){const cell=document.createElement('th');cell.colSpan=8;cell.textContent='Octet '+(oct+1);h.append(cell);}head.append(h);
 const weights=document.createElement('tr');const wlabel=document.createElement('th');wlabel.className='bit-row-name';wlabel.textContent='Poids';weights.append(wlabel);
 for(let i=0;i<32;i++){const c=document.createElement('th');c.textContent=String(2**(7-i%8));c.className=classFor(i);weights.append(c);}head.append(weights);table.append(head);
 function classFor(i){return (i<initialPrefix?'bit-fixed':i<subnetPrefix?'bit-borrowed':'bit-host')+(i%8===0?' bit-octet-start':'');}
 const body=document.createElement('tbody');
 const rows=[['Réseau (binaire)',networkBits,2],['Réseau (décimal)',network,3],['Broadcast (binaire)',broadcastBits,4],['Broadcast (décimal)',broadcast,5]];
 for(const [label,value,required] of rows){
  const tr=document.createElement('tr');const name=document.createElement('th');name.className='bit-row-name';name.textContent=label;tr.append(name);
  if(label.includes('décimal')){
   const octets=value.split('.');
   for(let oct=0;oct<4;oct++){const cell=document.createElement('td');cell.colSpan=8;cell.className=classFor(oct*8);cell.textContent=stage>=required?octets[oct]:'·';tr.append(cell);}
  }else{
   for(let i=0;i<32;i++){
    const cell=document.createElement('td');cell.className=classFor(i);
    // Dès l'étape D, seuls les bits empruntés sont renseignés.
    cell.textContent=stage>=required?value[i]:(stage>=1&&i>=initialPrefix&&i<subnetPrefix?networkBits[i]:'·');
    tr.append(cell);
   }
  }
  body.append(tr);
 }
 table.append(body);target.append(table);
 const legend=document.createElement('p');legend.className='hint';legend.textContent='Bleu : réseau initial · Orange : bits empruntés · Gris : bits hôtes. Les lignes se complètent au fil des étapes.';target.append(legend);
}
