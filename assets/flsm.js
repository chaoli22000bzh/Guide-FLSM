// Guide FLSM V0.1.0 - interaction transférée du guide IPv4
let flsmShown=0;
function updateFlsm(){
 const body=document.getElementById('flsm-rows');if(!body)return;
 body.innerHTML='';
 for(let n=0;n<4;n++){
  const v=n*64;const tr=document.createElement('tr');
  tr.innerHTML=`<td><b>${n}</b></td><td><code>${n.toString(2).padStart(2,'0')}</code></td><td><code>${v.toString(2).padStart(8,'0')}</code></td><td><code>${(v+63).toString(2).padStart(8,'0')}</code></td><td>${'192.168.10.'+v}</td><td>${'192.168.10.'+(v+63)}</td>`;
  if(n>=flsmShown)tr.querySelectorAll('td').forEach((cell,i)=>{if(i>0)cell.textContent='—'});
  body.appendChild(tr);
 }
 const next=document.getElementById('flsm-next');
 next.disabled=flsmShown===4;
 next.textContent=flsmShown===4?'Les 4 sous-réseaux sont visibles ✓':'Révéler un sous-réseau →';
}
document.getElementById('flsm-next')?.addEventListener('click',()=>{flsmShown=Math.min(4,flsmShown+1);updateFlsm()});
document.getElementById('flsm-reset')?.addEventListener('click',()=>{flsmShown=0;updateFlsm()});
const themeButton=document.getElementById('theme');
try{if(localStorage.getItem('ipv4-theme')==='dark')document.body.classList.add('dark')}catch{}
themeButton?.addEventListener('click',()=>{document.body.classList.toggle('dark');try{localStorage.setItem('ipv4-theme',document.body.classList.contains('dark')?'dark':'light')}catch{}});
updateFlsm();