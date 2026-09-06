/* THE TEE BOX — REV 1.6.8 */
(() => {
"use strict";
const now=new Date();
const state={viewDate:new Date(now.getFullYear(),now.getMonth(),1),selectedDate:null,selectedSlot:null,selectedRequestId:null,lastRoute:null};
const DEFAULT_PRICING={fullDay:400,morning:250,afternoon:250,evening:250,travel0:10,travel20:20,travel50:50,travel100:100,vatRate:23};
const DEFAULT_OWNER={name:"Brian O'Neill",phone:"087 9165960",email:"bonirl71@gmail.com",eircode:"E45 WC97"};
const DEFAULT_ADMIN_PIN="2468";
const DEFAULT_ROUTE_ENDPOINT="";
const $=id=>document.getElementById(id);
const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
const fmt=d=>new Intl.DateTimeFormat("en-IE",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(d);
function getRequests(){try{return JSON.parse(localStorage.getItem("teeBoxQuoteRequests")||"[]")}catch{return[]}}

// Restore the four Office test quote requests used during development.
// They are added once by stable test IDs, so they never duplicate on refresh.
function ensureTestQuoteRequests(){
  const existing=getRequests();
  const testIds=new Set(existing.map(r=>r.id));
  const tests=[
    {id:"test-quote-001",reference:"TB001-01",name:"John Murphy",phone:"087 123 4567",email:"john@example.com",eircode:"X91 N274",date:"Saturday, 12 September 2026",period:"Full Day",duration:"8 Hours",people:"4",notes:"Birthday round"},
    {id:"test-quote-002",reference:"TB002-01",name:"Sarah Kelly",phone:"086 555 0182",email:"sarah@example.com",eircode:"E45 DV25",date:"Sunday, 13 September 2026",period:"Morning",duration:"4 Hours",people:"6+",notes:"Friends group"},
    {id:"test-quote-003",reference:"TB003-01",name:"Mark Ryan",phone:"085 442 1988",email:"mark@example.com",eircode:"X91 N274",date:"Saturday, 19 September 2026",period:"Afternoon",duration:"4 Hours",people:"8",notes:"Corporate event"},
    {id:"test-quote-004",reference:"TB004-01",name:"Aoife Walsh",phone:"089 210 4455",email:"aoife@example.com",eircode:"E45 DV25",date:"Sunday, 20 September 2026",period:"Evening",duration:"4 Hours",people:"2",notes:"Practice session"}
  ];
  let changed=false;
  for(let i=0;i<tests.length;i++){
    const t=tests[i];
    if(!testIds.has(t.id)){
      existing.push({...t,status:"New",createdAt:new Date(Date.now()-(tests.length-i)*60000).toISOString(),isTestQuote:true});
      changed=true;
    }
  }
  if(changed)saveRequests(existing);
}
function saveRequests(v){localStorage.setItem("teeBoxQuoteRequests",JSON.stringify(v))}
function getJourneys(){try{return JSON.parse(localStorage.getItem("teeBoxJourneys")||"[]")}catch{return[]}}
function saveJourneys(v){localStorage.setItem("teeBoxJourneys",JSON.stringify(v))}
function getPricing(){
  try{
    const raw=localStorage.getItem("teeBoxPricing");
    if(!raw)return {...DEFAULT_PRICING};
    const saved=JSON.parse(raw)||{};
    // 1.6.1 pricing baseline: 0–20 km is €10. Migrate the previous €5 default only once.
    if(!localStorage.getItem("teeBoxPricingSchema")){
      if(Number(saved.travel0)===5)saved.travel0=10;
      if(saved.vatRate==null)saved.vatRate=23;
      localStorage.setItem("teeBoxPricing",JSON.stringify({...DEFAULT_PRICING,...saved}));
      localStorage.setItem("teeBoxPricingSchema","1.6.3");
    }
    return {...DEFAULT_PRICING,...saved};
  }catch{return {...DEFAULT_PRICING}}
}
function getOwner(){try{return {...DEFAULT_OWNER,...JSON.parse(localStorage.getItem("teeBoxOwner")||"{}")}}catch{return {...DEFAULT_OWNER}}}
function saveOwner(v){localStorage.setItem("teeBoxOwner",JSON.stringify(v))}
function getAdminPin(){return localStorage.getItem("teeBoxAdminPin")||DEFAULT_ADMIN_PIN}
function normaliseEircode(v){return String(v||"").trim().toUpperCase().replace(/\s+/g,"")}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function nextQuoteReference(){
  const rs=getRequests();
  let n=Number(localStorage.getItem("teeBoxNextQuoteNumber")||0);
  if(!Number.isFinite(n)||n<0)n=0;
  const used=new Set(rs.map(r=>String(r.reference||"")));
  let ref;
  do{n++;ref=`TB${String(n).padStart(3,"0")}-01`;}while(used.has(ref));
  localStorage.setItem("teeBoxNextQuoteNumber",String(n));
  return ref;
}
function createQuoteReference(){return nextQuoteReference()}
function repairRequests(){
  let rs=getRequests(),changed=false;
  const ordered=[...rs].sort((a,b)=>{
    const ta=Date.parse(a.createdAt),tb=Date.parse(b.createdAt);
    if(Number.isFinite(ta)&&Number.isFinite(tb))return ta-tb;
    return 0;
  });
  let legacyCounter=0;
  rs=rs.map(r=>{
    if(!r.reference || !/^TB\d{3}-\d{2}$/.test(String(r.reference))){
      r.reference=nextQuoteReference(); changed=true;
    }
    if(!r.createdAt){r.createdAt=new Date(Date.now()-(rs.length-legacyCounter++)*1000).toISOString();changed=true}
    if(!r.status)r.status="New";
    return r;
  });
  if(changed)saveRequests(rs);
  return rs;
}
function available(d){if(d<today())return false;const day=d.getDay();return day===0||day===6||d.getDate()%3!==0}
function renderCalendar(){const grid=$("calendarGrid"),month=$("calendarMonth");if(!grid||!month)return;const y=state.viewDate.getFullYear(),m=state.viewDate.getMonth();month.textContent=new Intl.DateTimeFormat("en-IE",{month:"long",year:"numeric"}).format(state.viewDate);grid.innerHTML="";const first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),leading=(first.getDay()+6)%7;for(let i=0;i<leading;i++){const b=document.createElement("div");b.className="calendar-day empty";grid.appendChild(b)}for(let n=1;n<=days;n++){const d=new Date(y,m,n),b=document.createElement("button");b.type="button";b.className="calendar-day";b.textContent=n;if(available(d)){b.classList.add("available");b.addEventListener("click",()=>selectDate(d))}else{b.classList.add("unavailable");b.disabled=true}if(key(d)===key(today()))b.classList.add("today");if(state.selectedDate&&key(d)===key(state.selectedDate))b.classList.add("selected");grid.appendChild(b)}}
function selectDate(d){state.selectedDate=new Date(d);state.selectedSlot=null;if($("summaryDate"))$("summaryDate").textContent=fmt(d);if($("summaryTime"))$("summaryTime").textContent="Not selected";if($("durationDisplay"))$("durationDisplay").value="Select a quote period";renderCalendar();renderSlots()}
function renderSlots(){const grid=$("slotGrid");if(!grid)return;grid.innerHTML="";[{time:"Full Day",duration:"8 Hours"},{time:"Morning",duration:"4 Hours"},{time:"Afternoon",duration:"4 Hours"},{time:"Evening",duration:"4 Hours"}].forEach(s=>{const b=document.createElement("button");b.type="button";b.className="slot quote-period";b.disabled=!state.selectedDate;if(state.selectedSlot?.time===s.time)b.classList.add("selected");b.innerHTML=`<strong>${s.time}</strong><span>${s.duration}</span>`;b.addEventListener("click",()=>{state.selectedSlot=s;$("summaryTime").textContent=`${s.time} (${s.duration})`;$("durationDisplay").value=`${s.time} — ${s.duration}`;renderSlots()});grid.appendChild(b)})}
function resetBooking(){state.selectedDate=null;state.selectedSlot=null;["name","phone","email","eircode","notes"].forEach(id=>{if($(id))$(id).value=""});if($("people"))$("people").value="2";if($("summaryDate"))$("summaryDate").textContent="Not selected";if($("summaryTime"))$("summaryTime").textContent="Not selected";if($("summaryPeople"))$("summaryPeople").textContent="2";if($("durationDisplay"))$("durationDisplay").value="Select a quote period";renderCalendar();renderSlots()}
function priceKey(period){return period==="Full Day"?"fullDay":String(period||"").toLowerCase()}
function travelCost(km,p=getPricing()){if(!Number.isFinite(Number(km)))return null;if(km<=20)return Number(p.travel0)||0;if(km<=50)return Number(p.travel20)||0;if(km<=100)return Number(p.travel50)||0;return Number(p.travel100)||0}
function sortRequests(rs){return [...rs].sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt))}
function formatReceived(v){const d=new Date(v);return Number.isNaN(d.getTime())?"Unknown":d.toLocaleDateString("en-IE",{day:"2-digit",month:"short",year:"numeric"})+" "+d.toLocaleTimeString("en-IE",{hour:"2-digit",minute:"2-digit"})}
function statusClass(s){return String(s||"New").toLowerCase().replace(/\s+/g,"-")}
let declineRequestId=null;
function deleteQuote(id){const r=repairRequests().find(x=>x.id===id);if(!r)return;if(!confirm(`Delete quote ${r.reference} for ${r.name}? This cannot be undone.`))return;saveRequests(repairRequests().filter(x=>x.id!==id));saveJourneys(getJourneys().filter(j=>j.requestId!==id));if(state.selectedRequestId===id)state.selectedRequestId=null;renderOffice();}
function openDeclineModal(id){const r=repairRequests().find(x=>x.id===id);if(!r)return;declineRequestId=id;$("declineCustomerSummary").textContent=`${r.reference} · ${r.name} · ${r.email||"No email address"}`;$("declineMessage").value=r.declineMessage||"";$("declineStatus").textContent="";$("declineModal").hidden=false;}
function closeDeclineModal(){$("declineModal").hidden=true;declineRequestId=null;}
function openDeclineEmail(){const r=repairRequests().find(x=>x.id===declineRequestId);if(!r)return;if(!r.email){$("declineStatus").textContent="This customer has no email address.";return;}const message=$("declineMessage").value.trim();if(!message){$("declineStatus").textContent="Please enter a short message explaining why the quote is being declined.";return;}const owner=getOwner();const subject=`THE TEE BOX — Update on quote ${r.reference}`;const body=`THE TEE BOX\nPREMIUM POP-UP GOLF SIMULATOR\n\nDear ${r.name},\n\nThank you for your enquiry regarding THE TEE BOX.\n\nUnfortunately, we are unable to proceed with this request on this occasion.\n\nReason / message:\n${message}\n\nIf you would like to discuss an alternative date or arrangement, please get in touch.\n\nKind regards,\n${owner.name}\nTHE TEE BOX\n${owner.phone}\n${owner.email}`;const gmail=`https://mail.google.com/mail/?view=cm&fs=1&tf=1&authuser=${encodeURIComponent(owner.email)}&to=${encodeURIComponent(r.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;saveRequests(repairRequests().map(x=>x.id===r.id?{...x,declineMessage:message,status:"Declined",declinedAt:new Date().toISOString()}:x));saveJourneys(getJourneys().filter(j=>j.requestId!==r.id));const popup=window.open(gmail,"_blank","noopener,noreferrer");if(!popup)window.location.href=gmail;$("declineStatus").textContent=`Gmail opened for ${owner.email}. Review and click Send in Gmail.`;renderOffice();}
function renderOffice(){
  const rs=sortRequests(repairRequests());
  $("newQuoteCount").textContent=rs.filter(r=>r.status==="New").length;
  $("pendingQuoteCount").textContent=rs.filter(r=>["Quote Sent to customer","Quote Sent","Accepted","Deposit Received"].includes(r.status)).length;
  $("journeyCount").textContent=rs.filter(r=>r.acceptedAt).length;
  const body=$("quoteRequests");
  if(!rs.length){
    body.innerHTML='<tr><td colspan="11" class="empty-cell">No quote requests yet.</td></tr>';
  }else{
    body.innerHTML=rs.map(r=>`<tr class="quote-row ${state.selectedRequestId===r.id?"selected-row":""}">
      <td class="accepted-cell"><input class="accept-quote" data-id="${escapeHtml(r.id)}" type="checkbox" aria-label="Mark ${escapeHtml(r.name)} as accepted" ${r.acceptedAt?"checked":""}></td>
      <td><strong class="table-ref">${escapeHtml(r.reference)}</strong></td>
      <td>${escapeHtml(formatReceived(r.createdAt))}</td>
      <td><strong>${escapeHtml(r.name)}</strong><small>${escapeHtml(r.phone||"")} · ${escapeHtml(r.email||"")}</small></td>
      <td><strong>${escapeHtml(r.date)}</strong><small>${escapeHtml(r.period)} · ${escapeHtml(r.duration)}</small></td>
      <td>${escapeHtml(r.eircode)}</td>
      <td>${escapeHtml(r.people)}</td>
      <td><span class="status-pill ${statusClass(r.status)}">${escapeHtml(r.status||"New")}</span></td>
      <td>${r.quoteAmount!=null?`€${Number(r.quoteAmount).toFixed(0)}`:"—"}</td>
      <td>${r.routeDistanceKm!=null?`${Number(r.routeDistanceKm).toFixed(1)} km`:"—"}</td>
      <td><div class="row-actions">
        <button class="table-action select-request" data-id="${escapeHtml(r.id)}" type="button">${state.selectedRequestId===r.id?"SELECTED":"SELECT"}</button>
        <button class="table-action decline-request" data-id="${escapeHtml(r.id)}" type="button">DECLINE</button>
        <button class="table-action danger delete-request" data-id="${escapeHtml(r.id)}" type="button" aria-label="Delete ${escapeHtml(r.name)} quote">DELETE</button>
      </div></td>
    </tr>`).join("");
    body.querySelectorAll(".select-request").forEach(b=>b.addEventListener("click",()=>selectRequestForQuote(b.dataset.id)));
    body.querySelectorAll(".accept-quote").forEach(cb=>cb.addEventListener("change",()=>toggleAccepted(cb.dataset.id,cb.checked)));
    body.querySelectorAll(".delete-request").forEach(b=>b.addEventListener("click",()=>deleteQuote(b.dataset.id)));
    body.querySelectorAll(".decline-request").forEach(b=>b.addEventListener("click",()=>openDeclineModal(b.dataset.id)));
  }
  renderJourneys();
}
function selectRequestForQuote(id){
  const r=repairRequests().find(x=>x.id===id); if(!r)return;
  state.selectedRequestId=id;
  state.lastRoute=r.routeDistanceKm!=null?{km:Number(r.routeDistanceKm),meters:Number(r.routeDistanceKm)*1000,durationMinutes:r.routeDurationMinutes!=null?Number(r.routeDurationMinutes):null,cost:travelCost(Number(r.routeDistanceKm)),source:r.routeSource||"manual"}:null;
  $("manualDistanceKm").value=r.routeDistanceKm!=null?Number(r.routeDistanceKm):"";
  if($("distanceMapStatus"))$("distanceMapStatus").textContent="";
  $("quoteSelectionBadge").textContent=`${r.reference} · ${r.name}`;
  updateRouteLink();
  $("quoteBuildArea").hidden=true;
  $("quoteSendRow").hidden=true;
  $("quoteCalculation").innerHTML=`<strong>${escapeHtml(r.name)} · ${escapeHtml(r.period)}</strong><span>Reference: ${escapeHtml(r.reference)}</span><span>Customer Eircode: ${escapeHtml(r.eircode)}</span><span>Step 1: click CALCULATE DISTANCE, then enter the Google Maps driving distance.</span>`;
  renderOffice();
  requestAnimationFrame(()=>{
    const workflow=document.querySelector(".quote-workflow-panel");
    if(workflow) workflow.scrollIntoView({behavior:"smooth",block:"start"});
  });
}
function updateStatusButtons(r){}
function buildGoogleRouteUrl(r){
  const customer=normaliseEircode(r?.eircode),base=normaliseEircode(getOwner().eircode);
  if(!customer||!base)return "";
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(base)}&destination=${encodeURIComponent(customer)}&travelmode=driving`;
}
function openNewTab(url){
  const a=document.createElement("a");
  a.href=url;
  a.target="_blank";
  a.rel="noopener noreferrer";
  a.style.display="none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  return true;
}
function updateRouteLink(){
  const a=$("calculateTravel"),r=state.selectedRequestId?repairRequests().find(x=>x.id===state.selectedRequestId):null;
  if(!a)return;
  const url=buildGoogleRouteUrl(r);
  a.href=url||"#";
  a.setAttribute("aria-disabled",url?"false":"true");
  a.classList.toggle("is-disabled",!url);
}
function openGoogleRoute(){
  const r=state.selectedRequestId?repairRequests().find(x=>x.id===state.selectedRequestId):null;
  const customer=normaliseEircode(r?.eircode),base=normaliseEircode(getOwner().eircode);
  const status=$("distanceMapStatus");
  if(!customer){if(status)status.textContent="Select a quote request first.";return false}
  if(!base){if(status)status.textContent="Business Eircode is missing. Update it in Admin.";return false}
  updateRouteLink();
  if(status)status.textContent=`Google Maps route: ${base} → ${customer}`;
  return true;
}
function calculateTravel(e){
  if(e?.preventDefault){
    const r=state.selectedRequestId?repairRequests().find(x=>x.id===state.selectedRequestId):null;
    if(!buildGoogleRouteUrl(r))e.preventDefault();
  }
  return openGoogleRoute();
}

function useManualDistance(){
  const id=state.selectedRequestId, km=Number($("manualDistanceKm")?.value);
  if(!id){$("quoteCalculation").innerHTML='<strong>Select a quote request first.</strong><span>Select a row in All Quote Requests.</span>';return null}
  if(!Number.isFinite(km)||km<0){$("quoteCalculation").innerHTML='<strong>Enter a valid driving distance.</strong><span>Use the driving distance in kilometres shown by Google Maps.</span>';return null}
  const rounded=Math.round(km*10)/10, cost=travelCost(rounded), updated=repairRequests().map(x=>x.id===id?{...x,routeDistanceKm:rounded,routeDurationMinutes:null,travelCharge:cost,routeSource:"manual"}:x);
  saveRequests(updated);
  if($("distanceMapStatus"))$("distanceMapStatus").textContent=`Distance saved: ${rounded.toFixed(1)} km · travel band charge €${Number(cost).toFixed(2)}`;
  $("quoteCalculation").innerHTML=`<strong>Driving distance saved</strong><span>${rounded.toFixed(1)} km · travel charge €${Number(cost).toFixed(2)}</span><span>Now click PREPARE QUOTE.</span>`;
  renderOffice();
  return {km:rounded,cost,source:"manual"};
}
function prepareQuote(){
  const id=state.selectedRequestId;
  if(!id){$("quoteCalculation").innerHTML='<strong>Select a quote request first.</strong><span>Choose a row from All Quote Requests.</span>';return}
  const r=repairRequests().find(x=>x.id===id);
  if(!r)return;
  if(r.routeDistanceKm==null){$("quoteCalculation").innerHTML='<strong>Driving distance required.</strong><span>Open Google Maps, enter the driving distance and click SAVE DISTANCE first.</span>';return}
  const p=getPricing(),service=Number(p[priceKey(r.period)])||0,travel=Number(r.travelCharge!=null?r.travelCharge:travelCost(r.routeDistanceKm,p))||0;
  if($("quoteBuildArea").hidden){
    $("serviceAmount").value=service.toFixed(2);
    $("travelAmount").value=travel.toFixed(2);
    $("miscAmount").value=Number(r.miscAmount||0).toFixed(2);
    $("miscDescription").value=r.miscDescription||"";
    $("quoteVatRate").value=Number(r.vatRate!=null?r.vatRate:(p.vatRate??23));
    $("serviceLineLabel").textContent=`${r.period} · ${r.duration}`;
    $("travelLineLabel").textContent=`${Number(r.routeDistanceKm).toFixed(1)} km · configured distance band`;
    $("quoteBuildArea").hidden=false;
  }
  calculateQuote();
}
function calculateQuote(){
  const id=state.selectedRequestId;
  if(!id){$("quoteCalculation").innerHTML='<strong>No request selected.</strong><span>Select a request from the quote table first.</span>';return}
  const r=repairRequests().find(x=>x.id===id);
  if(!r)return;
  if(r.routeDistanceKm==null){$("quoteCalculation").innerHTML='<strong>Distance required.</strong><span>Open Google Maps, enter the driving distance and click SAVE DISTANCE first.</span>';return}
  const service=Math.max(0,Number($("serviceAmount").value)||0),travel=Math.max(0,Number($("travelAmount").value)||0),misc=Math.max(0,Number($("miscAmount").value)||0),miscDescription=($("miscDescription")?.value||"").trim(),vatRate=Math.max(0,Number($("quoteVatRate").value)||0),subtotal=service+travel+misc,vat=subtotal*vatRate/100,total=subtotal+vat;
  const updated=repairRequests().map(x=>x.id===id?{...x,sessionPrice:service,travelCharge:travel,miscAmount:misc,miscDescription,vatRate,quoteSubtotal:subtotal,vatAmount:vat,quoteAmount:total}:x);
  saveRequests(updated);
  const saved=updated.find(x=>x.id===id);
  const miscLine=misc>0?`<div><span>Miscellaneous</span><strong>€${misc.toFixed(2)}</strong></div>`:"";
  $("quoteCalculation").innerHTML=`<div class="quote-itemized"><div><span>Service — ${escapeHtml(r.period)}</span><strong>€${service.toFixed(2)}</strong></div><div><span>Travel — ${Number(r.routeDistanceKm).toFixed(1)} km</span><strong>€${travel.toFixed(2)}</strong></div>${miscLine}<div class="subtotal"><span>Subtotal</span><strong>€${subtotal.toFixed(2)}</strong></div><div><span>VAT (${vatRate.toFixed(1)}%)</span><strong>€${vat.toFixed(2)}</strong></div><div class="grand-total"><span>TOTAL QUOTE</span><strong>€${total.toFixed(2)}</strong></div></div>`;
  $("quoteSendRow").hidden=false;
  $("quoteSendRow").dataset.total=String(total);
  $("quoteSendRow").dataset.requestId=id;
  renderOffice();
}
function quoteEmailText(r,total,message){
  const owner=getOwner(),service=Number(r.sessionPrice||0),travel=Number(r.travelCharge||0),misc=Number(r.miscAmount||0),subtotal=Number(r.quoteSubtotal??service+travel+misc),vatRate=Number(r.vatRate??23),vat=Number(r.vatAmount??subtotal*vatRate/100);
  const miscLine=misc>0?`Miscellaneous${r.miscDescription?` — ${r.miscDescription}`:""}: €${misc.toFixed(2)}\n`:"";
  return `THE TEE BOX\nPREMIUM POP-UP GOLF SIMULATOR\n\nQUOTE — ${r.reference}\n\nDear ${r.name},\n\nThank you for your enquiry. Please find your quote below.\n\nSESSION DETAILS\nDate: ${r.date}\nPeriod: ${r.period} (${r.duration})\nPlayers: ${r.people||""}\nLocation: ${r.eircode||""}\n\nQUOTE BREAKDOWN\nService — ${r.period}: €${service.toFixed(2)}\nTravel — ${Number(r.routeDistanceKm).toFixed(1)} km: €${travel.toFixed(2)}\n${miscLine}Subtotal: €${subtotal.toFixed(2)}\nVAT (${vatRate.toFixed(1)}%): €${vat.toFixed(2)}\nTOTAL: €${Number(total).toFixed(2)}\n\n${message||"We would be delighted to provide THE TEE BOX for your event."}\n\nThis quotation is subject to availability and is not confirmed until accepted and the required deposit has been received.\n\nRegards,\n${owner.name}\nTHE TEE BOX\n${owner.phone}\n${owner.email}`;
}
function renderQuoteEmailPreview(r,total){
  const box=$("quoteEmailPreview");if(!box||!r)return;const owner=getOwner(),service=Number(r.sessionPrice||0),travel=Number(r.travelCharge||0),misc=Number(r.miscAmount||0),subtotal=Number(r.quoteSubtotal??service+travel+misc),vatRate=Number(r.vatRate??23),vat=Number(r.vatAmount??subtotal*vatRate/100);
  const miscPreview=misc>0?`<div><span>Miscellaneous${r.miscDescription?` — ${escapeHtml(r.miscDescription)}`:""}</span><strong>€${misc.toFixed(2)}</strong></div>`:"";
  box.innerHTML=`<div class="email-preview-head"><strong>THE TEE BOX</strong><span>QUOTE ${escapeHtml(r.reference)}</span></div><div class="email-preview-section"><b>QUOTE DETAILS</b><div><span>Customer</span><strong>${escapeHtml(r.name)}</strong></div><div><span>Date</span><strong>${escapeHtml(r.date)}</strong></div><div><span>Session</span><strong>${escapeHtml(r.period)} (${escapeHtml(r.duration)})</strong></div><div><span>Players</span><strong>${escapeHtml(r.people||"")}</strong></div><div><span>Eircode</span><strong>${escapeHtml(r.eircode||"")}</strong></div></div><div class="email-preview-section"><b>ITEMISED QUOTE</b><div><span>Service</span><strong>€${service.toFixed(2)}</strong></div><div><span>Travel (${Number(r.routeDistanceKm).toFixed(1)} km)</span><strong>€${travel.toFixed(2)}</strong></div>${miscPreview}<div><span>Subtotal</span><strong>€${subtotal.toFixed(2)}</strong></div><div><span>VAT (${vatRate.toFixed(1)}%)</span><strong>€${vat.toFixed(2)}</strong></div><div class="email-total"><span>Total</span><strong>€${Number(total).toFixed(2)}</strong></div></div><div class="email-preview-signoff">${escapeHtml(owner.name)} · ${escapeHtml(owner.phone)} · ${escapeHtml(owner.email)}</div>`;
}
function prepareQuoteEmail(){
  const area=$("quoteSendRow"),id=area?.dataset.requestId,total=Number(area?.dataset.total||0),r=repairRequests().find(x=>x.id===id);
  if(!r)return false;
  if(!r.email){$("sendQuoteStatus").textContent="This customer has no email address.";return false}
  const body=quoteEmailText(r,total,"We would be delighted to provide THE TEE BOX for your event."),subject=`THE TEE BOX — Quote ${r.reference}`,owner=getOwner();
  const gmail=`https://mail.google.com/mail/?view=cm&fs=1&tf=1&authuser=${encodeURIComponent(owner.email)}&to=${encodeURIComponent(r.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const link=$("sendQuote");
  if(link){link.href=gmail;link.setAttribute("aria-disabled","false");}
  saveRequests(repairRequests().map(x=>x.id===id?{...x,quotePreparedAt:new Date().toISOString()}:x));
  $("sendQuoteStatus").textContent=`Gmail draft ready for ${owner.email}. Click SEND QUOTE EMAIL to open it in a new tab.`;
  return true;
}
function syncJourneyForAcceptedQuote(r){
  const js=getJourneys().filter(j=>j.requestId!==r.id);
  if(r.acceptedAt){
    js.push({
      id:crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`,
      requestId:r.id,reference:r.reference,name:r.name,phone:r.phone,email:r.email,eircode:r.eircode,
      date:r.date,period:r.period,duration:r.duration,distanceKm:r.routeDistanceKm??null,status:"Accepted",
      createdAt:new Date().toISOString()
    });
  }
  saveJourneys(js);
}
function toggleAccepted(id,checked){
  const rs=repairRequests(), r=rs.find(x=>x.id===id);
  if(!r)return;
  if(checked){
    const acceptedAt=r.acceptedAt||new Date().toISOString();
    const updated={...r,acceptedAt,status:"Accepted"};
    saveRequests(rs.map(x=>x.id===id?updated:x));
    syncJourneyForAcceptedQuote(updated);
    state.selectedRequestId=id;
  }else{
    const fallback=r.quoteSentAt?"Quote Sent to customer":"New";
    const updated={...r,acceptedAt:null,status:fallback};
    saveRequests(rs.map(x=>x.id===id?updated:x));
    saveJourneys(getJourneys().filter(j=>j.requestId!==id));
  }
  renderOffice();
}
function markAccepted(){if(state.selectedRequestId){toggleAccepted(state.selectedRequestId,true)}}
function markDeposit(){const id=state.selectedRequestId;if(!id)return;const rs=repairRequests(),r=rs.find(x=>x.id===id);if(!r?.acceptedAt)return;saveRequests(rs.map(x=>x.id===id?{...x,depositReceivedAt:x.depositReceivedAt||new Date().toISOString(),status:"Accepted"}:x));renderOffice()}
function addJourney(){if(state.selectedRequestId){toggleAccepted(state.selectedRequestId,true)}}
function dateKeyFromText(text){const d=new Date(text);if(!Number.isNaN(d.getTime()))return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;const m=String(text).match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);if(!m)return "";const d2=new Date(`${m[2]} ${m[1]}, ${m[3]}`);return `${d2.getFullYear()}-${String(d2.getMonth()+1).padStart(2,"0")}-${String(d2.getDate()).padStart(2,"0")}`}
function timeOnly(d){return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`}
function renderJourneys(){
  const body=$("journeyRows"), filter=$("journeyDateFilter");
  let js=getJourneys().filter(j=>j.status==="Accepted"||j.status==="Scheduled");
  js.sort((a,b)=>dateKeyFromText(a.date).localeCompare(dateKeyFromText(b.date))||String(a.name).localeCompare(String(b.name)));
  const dates=[...new Set(js.map(j=>dateKeyFromText(j.date)).filter(Boolean))];
  if(filter){
    const current=filter.value||"all";
    filter.innerHTML='<option value="all">All dates</option>'+dates.map(d=>{const label=new Intl.DateTimeFormat("en-IE",{weekday:"short",day:"numeric",month:"short",year:"numeric"}).format(new Date(`${d}T00:00:00`));return `<option value="${d}">${label}</option>`}).join("");
    filter.value=dates.includes(current)?current:"all";
    js=filter.value==="all"?js:js.filter(j=>dateKeyFromText(j.date)===filter.value);
  }
  if(!js.length){body.innerHTML='<tr><td colspan="7" class="empty-cell">No accepted customer journeys for the selected date.</td></tr>';return}
  body.innerHTML=js.map(j=>{
    const owner=getOwner(),url=`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(owner.eircode)}&destination=${encodeURIComponent(j.eircode)}&travelmode=driving`;
    return `<tr><td><strong>${escapeHtml(j.date)}</strong></td><td><strong>${escapeHtml(j.name)}</strong><small>${escapeHtml(j.reference)}</small></td><td>${escapeHtml(j.eircode)}</td><td>${escapeHtml(j.period)}<small>${escapeHtml(j.duration)}</small></td><td>${j.distanceKm!=null?`${Number(j.distanceKm).toFixed(1)} km`:"Not entered"}</td><td><a class="table-link journey-route-button" href="${url}" target="_blank" rel="noopener">PLAN ROUTE TO CUSTOMER</a></td><td><span class="status-pill accepted">Accepted</span></td></tr>`;
  }).join("");
}
function loadPricing(){const p=getPricing();const ids={fullDay:"priceFullDay",morning:"priceMorning",afternoon:"priceAfternoon",evening:"priceEvening",travel0:"travel0",travel20:"travel20",travel50:"travel50",travel100:"travel100",vatRate:"vatRate"};Object.entries(ids).forEach(([k,id])=>{if($(id))$(id).value=p[k]})}
function savePricing(){const p={fullDay:+$("priceFullDay").value||0,morning:+$("priceMorning").value||0,afternoon:+$("priceAfternoon").value||0,evening:+$("priceEvening").value||0,travel0:+$("travel0").value||0,travel20:+$("travel20").value||0,travel50:+$("travel50").value||0,travel100:+$("travel100").value||0,vatRate:+$("vatRate")?.value||23};localStorage.setItem("teeBoxPricing",JSON.stringify(p));localStorage.setItem("teeBoxPricingSchema","1.6.3");$("pricingSaved").textContent="Pricing saved on this device.";renderOffice()}
function resetAdminPin(){localStorage.removeItem("teeBoxAdminPin");$("adminPin").value="";$("adminPinMessage").innerHTML="Admin PIN reset. Use the default PIN <strong>2468</strong> to unlock."}
function loadAdmin(){const o=getOwner();$("ownerName").value=o.name;$("ownerPhone").value=o.phone;$("ownerEmail").value=o.email;$("ownerEircode").value=o.eircode}
function saveAdmin(){const o={name:$("ownerName").value.trim(),phone:$("ownerPhone").value.trim(),email:$("ownerEmail").value.trim(),eircode:$("ownerEircode").value.trim().toUpperCase()};saveOwner(o);updateRouteLink();$("adminSaved").textContent="Admin settings saved on this device.";renderOffice()}

function bind(){
 $("menuToggle")?.addEventListener("click",()=>{const open=$("mainNav").classList.toggle("open");$("menuToggle").setAttribute("aria-expanded",String(open))});$("mainNav")?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>$("mainNav").classList.remove("open")));
 $("prevMonth")?.addEventListener("click",()=>{state.viewDate=new Date(state.viewDate.getFullYear(),state.viewDate.getMonth()-1,1);renderCalendar()});$("nextMonth")?.addEventListener("click",()=>{state.viewDate=new Date(state.viewDate.getFullYear(),state.viewDate.getMonth()+1,1);renderCalendar()});$("people")?.addEventListener("change",()=>$("summaryPeople").textContent=$("people").value);
 $("quoteForm")?.addEventListener("submit",e=>{e.preventDefault();if(!state.selectedDate||!state.selectedSlot){alert("Please select an available date and quote period before requesting a quote.");return}const name=$("name").value.trim(),eircode=$("eircode").value.trim();if(!name||!eircode)return;const request={id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(),reference:createQuoteReference(),name,phone:$("phone").value.trim(),email:$("email").value.trim(),eircode,date:fmt(state.selectedDate),period:state.selectedSlot.time,duration:state.selectedSlot.duration,people:$("people").value==="6"?"6+":$("people").value,notes:$("notes").value.trim(),status:"New",createdAt:new Date().toISOString()};const rs=getRequests();rs.push(request);saveRequests(rs);$("confirmReference").textContent=request.reference;$("confirmName").textContent=name;$("confirmDate").textContent=fmt(state.selectedDate);$("confirmTime").textContent=`${state.selectedSlot.time} (${state.selectedSlot.duration})`;$("confirmPeople").textContent=request.people;$("confirmNotes").textContent=request.notes||"None";$("confirmationModal").hidden=false;document.body.style.overflow="hidden"});
 $("closeModal")?.addEventListener("click",()=>{ $("confirmationModal").hidden=true;document.body.style.overflow="";resetBooking()});$("modalDone")?.addEventListener("click",()=>{ $("confirmationModal").hidden=true;document.body.style.overflow="";resetBooking()});
 $("officeLoginForm")?.addEventListener("submit",e=>{e.preventDefault();if($("officeUsername").value==="office"&&$("officePassword").value==="teebox"){ $("officeLogin").hidden=true;$("officeDashboard").hidden=false;loadPricing();renderOffice()}else $("officeLoginMessage").innerHTML='<span style="color:var(--gold)">Incorrect username or password.</span>'});$("officeLogout")?.addEventListener("click",()=>{$("officeDashboard").hidden=true;$("officeLogin").hidden=false;$("officePassword").value=""});
 $("savePricing")?.addEventListener("click",savePricing);$("closeDeclineModal")?.addEventListener("click",closeDeclineModal);$("cancelDecline")?.addEventListener("click",closeDeclineModal);$("openDeclineEmail")?.addEventListener("click",openDeclineEmail);$("calculateTravel")?.addEventListener("click",calculateTravel);$("prepareQuote")?.addEventListener("click",prepareQuote);$("sendQuote")?.addEventListener("click",e=>{prepareQuoteEmail();});$("useManualDistance")?.addEventListener("click",useManualDistance);$("markAccepted")?.addEventListener("click",markAccepted);$("markDeposit")?.addEventListener("click",markDeposit);$("addJourney")?.addEventListener("click",addJourney);
 $("adminPinForm")?.addEventListener("submit",e=>{e.preventDefault();const entered=$("adminPin").value.trim();if(entered===getAdminPin()){$("adminLocked").hidden=true;$("adminSettings").hidden=false;loadAdmin();loadPricing();$("adminPinMessage").textContent="Admin unlocked."}else $("adminPinMessage").innerHTML='<span style="color:var(--gold)">Incorrect admin PIN.</span>'});$("resetAdminPinLocked")?.addEventListener("click",resetAdminPin);$("resetAdminPin")?.addEventListener("click",resetAdminPin);$("saveAdmin")?.addEventListener("click",saveAdmin);$("lockAdmin")?.addEventListener("click",()=>{$("adminSettings").hidden=true;$("adminLocked").hidden=false});
}
window.addEventListener("storage",()=>{if($("officeDashboard")&&!$("officeDashboard").hidden)renderOffice()});
window.addEventListener("pageshow",()=>{state.viewDate=new Date(new Date().getFullYear(),new Date().getMonth(),1);renderCalendar();renderSlots()});
ensureTestQuoteRequests();bind();renderCalendar();renderSlots();updateRouteLink();
})();
