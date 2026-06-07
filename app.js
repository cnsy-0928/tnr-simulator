const areas=[
  {id:'campus',emoji:'🏫',name:'大學校園',desc:'固定餵食常見，移入中高',initial:220,K:460,r:0.55,wild:0.8,imm:0.09},
  {id:'park',emoji:'🌳',name:'都市公園',desc:'資源多、遊客餵食多',initial:300,K:650,r:0.62,wild:1.1,imm:0.12},
  {id:'suburb',emoji:'🏘️',name:'郊區社區',desc:'棄養與放養混合',initial:260,K:520,r:0.48,wild:1.0,imm:0.08},
  {id:'river',emoji:'🌊',name:'河濱綠地',desc:'棲地破碎，野生動物壓力高',initial:180,K:430,r:0.58,wild:1.5,imm:0.10},
  {id:'reserve',emoji:'🦉',name:'保護區周邊',desc:'初始數量少但生態敏感',initial:120,K:280,r:0.42,wild:2.1,imm:0.05}
];
const labels={owner:['很差','普通','良好','非常良好'],feeding:['完全禁止','偶爾餵食','固定餵食','餵食站制度'],shelter:['不足','普通','良好','充足'],euth:['完全不執行','特殊情況執行','中度執行','高強度執行']};
const el=id=>document.getElementById(id);let selected=areas[0],chart;
function renderAreas(){el('areaCards').innerHTML=areas.map(a=>`<button class="area-card ${a.id===selected.id?'active':''}" data-id="${a.id}"><span class="emoji">${a.emoji}</span><b>${a.name}</b><small>${a.desc}</small></button>`).join('');document.querySelectorAll('.area-card').forEach(b=>b.onclick=()=>{selected=areas.find(a=>a.id===b.dataset.id);renderAreas();simulate();});el('initialPop').textContent=selected.initial;}
function syncLabels(){el('tnrValue').textContent=el('tnr').value+'%';el('ownerValue').textContent=labels.owner[+el('owner').value];el('feedingValue').textContent=labels.feeding[+el('feeding').value];el('shelterValue').textContent=labels.shelter[+el('shelter').value];el('euthValue').textContent=labels.euth[+el('euth').value];el('yearsValue').textContent=el('years').value+' 年';}
function simulate(){syncLabels();const years=+el('years').value,tnr=+el('tnr').value/100,owner=+el('owner').value,feeding=+el('feeding').value,shelter=+el('shelter').value,euth=+el('euth').value;
 const ownerLeak=[0.16,0.09,0.045,0.015][owner]; const feedSurv=[-.08,.02,.12,.06][feeding]; const feedK=[.78,1.0,1.35,1.18][feeding]; const shelterRemove=[.03,.08,.14,.22][shelter]; const euthRemove=[0,.015,.07,.16][euth];
 let N=selected.initial, fertile=N*.78, shelterStock=0, maxShelterLoad=0, wildImpact=0; const K=selected.K*feedK; const rows=[{year:0,N:Math.round(N),fertile:Math.round(fertile)}];
 for(let y=1;y<=years;y++){
   const density=Math.max(0,1-N/K); const births=fertile*selected.r*density*(1+feedSurv); const naturalDeath=N*(0.18-feedSurv*.25); const imm=(K-N)*Math.max(0,selected.imm+ownerLeak)*0.55; const sterilized=fertile*tnr; fertile=Math.max(0,fertile+births*.55+imm*.55-sterilized-naturalDeath*.45);
   const removedByShelter=N*shelterRemove; const euthanized=N*euthRemove; shelterStock=Math.max(0,shelterStock+removedByShelter-euthanized-(25+shelter*35)); maxShelterLoad=Math.max(maxShelterLoad,shelterStock/(90+shelter*90));
   N=Math.max(0,N+births+imm-naturalDeath-removedByShelter-euthanized); if(N>K*1.35)N=K*1.35; wildImpact+=N*(0.25+feeding*.08)*selected.wild;
   rows.push({year:y,N:Math.round(N),fertile:Math.round(fertile)});
 }
 const final=rows.at(-1).N, change=(final-selected.initial)/selected.initial*100; el('finalPop').textContent=final; el('changeRate').textContent=(change>0?'+':'')+change.toFixed(1)+'%'; el('shelterLoad').textContent=Math.round(maxShelterLoad*100)+'%';
 const verdict=change<-45?'🌟 太棒了！族群明顯下降，小島壓力降低。':change<0?'🌱 有改善！族群正在下降，但還可以更穩。':change<25?'⚠️ 勉強持平，政策可能只是讓族群維持在戶外。':'🚨 族群增加！目前組合壓不住繁殖、餵食或移入效應。'; el('verdict').textContent=verdict;
 const tips=[]; if(tnr<.57)tips.push('✂️ TNR 覆蓋率偏低：低於約 50–60% 時，通常很難壓下族群成長。'); if(feeding>=2)tips.push('🍱 固定餵食提高存活與環境承載量，會讓族群更難下降。'); if(owner<2)tips.push('🏠 飼主責任不足會讓棄養、走失與未絕育個體持續補進族群。'); if(shelter<2&&euth===0)tips.push('🏥 收容量能不足又完全不處置時，戶外個體容易持續累積，收容系統也可能爆量。'); if(tips.length===0)tips.push('✅ 這組政策較完整：高覆蓋率、低移入、餵食管理與收容措施共同作用。'); el('diagnosis').innerHTML=tips.map(t=>`<div>${t}</div>`).join('');
 const badges=[]; if(tnr>=.75)badges.push('高覆蓋抓紮'); if(feeding===0)badges.push('餵食管制'); if(owner>=2)badges.push('飼主責任提升'); if(maxShelterLoad>1)badges.push('收容爆量警告'); if(change<0)badges.push('族群下降'); el('badges').innerHTML=badges.map(b=>`<span class="badge">${b}</span>`).join(''); draw(rows);
}
function draw(rows){const ctx=el('populationChart'); if(chart)chart.destroy(); chart=new Chart(ctx,{type:'line',data:{labels:rows.map(r=>'第 '+r.year+' 年'),datasets:[{label:'戶外犬貓總數',data:rows.map(r=>r.N),tension:.35,borderWidth:3},{label:'未絕育個體',data:rows.map(r=>r.fertile),tension:.35,borderWidth:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true}}}})}
['tnr','owner','feeding','shelter','euth','years'].forEach(id=>el(id).addEventListener('input',syncLabels));el('simulate').onclick=simulate;el('reset').onclick=()=>{['tnr','owner','feeding','shelter','euth','years'].forEach((id,i)=>el(id).value=[45,1,2,1,0,20][i]);selected=areas[0];renderAreas();simulate();};el('loadExample').onclick=()=>{selected=areas[1];el('tnr').value=30;el('owner').value=0;el('feeding').value=2;el('shelter').value=0;el('euth').value=0;el('years').value=20;renderAreas();simulate();location.hash='game';};renderAreas();simulate();
