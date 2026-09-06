/* THE TEE BOX — REV 1.5.0 */
(() => {
"use strict";
const now=new Date();
const state={viewDate:new Date(now.getFullYear(),now.getMonth(),1),selectedDate:null,selectedSlot:null,selectedRequestId:null,lastRoute:null};
const DEFAULT_PRICING={fullDay:400,morning:250,afternoon:250,evening:250,travel0:0,travel20:25,travel50:50,travel100:100};
const DEFAULT_OWNER={name:"Brian O'Neill",phone:"087 9165960",email:"bonirl71@gmail.com",eircode:"E45 WC97"};
const DEFAULT_ADMIN_PIN="2468";
const DEFAULT_ROUTE_ENDPOINT="";
const $=id=>document.getElementById(id);
const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
const fmt=d=>new Intl.DateTimeFormat("en-IE",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(d);
function getRequests(){try{return JSON.parse(localStorage.getItem("teeBoxQuoteRequests")||"[]")}catch{return[]}}
function saveRequests(v){localStorage.setItem("teeBoxQuoteRequests",JSON.stringify(v))}
function getJourneys(){try{return JSON.parse(localStorage.getItem("teeBoxJourneys")||"[]")}catch{return[]}}
function saveJourneys(v){localStorage.setItem("teeBoxJourneys",JSON.stringify(v))}
function getPricing(){try{return {...DEFAULT_PRICING,...JSON.parse(localStorage.getItem("teeBoxPricing")||"{}")}}catch{return {...DEFAULT_PRICING}}}
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
function travelCost(km,p=getPricing()){if(km<=20)return p.travel0;if(km<=50)return p.travel20;if(km<=100)return p.travel50;return p.travel100}
function sortRequests(rs){return [...rs].sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt))}
function formatReceived(v){const d=new Date(v);return Number.isNaN(d.getTime())?"Unknown":d.toLocaleDateString("en-IE",{day:"2-digit",month:"short",year:"numeric"})+" "+d.toLocaleTimeString("en-IE",{hour:"2-digit",minute:"2-digit"})}
function statusClass(s){return String(s||"New").toLowerCase().replace(/\s+/g,"-")}
function renderOffice(){
  const rs=sortRequests(repairRequests());
  $("newQuoteCount").textContent=rs.filter(r=>r.status==="New").length;
  $("pendingQuoteCount").textContent=rs.filter(r=>["Quote Sent","Accepted","Deposit Received"].includes(r.status)).length;
  $("journeyCount").textContent=rs.filter(r=>r.acceptedAt&&r.depositReceivedAt).length;
  const body=$("quoteRequests");
  if(!rs.length){
    body.innerHTML='<tr><td colspan="10" class="empty-cell">No quote requests yet.</td></tr>';
  }else{
    body.innerHTML=rs.map(r=>`<tr class="quote-row ${state.selectedRequestId===r.id?"selected-row":""}">
      <td><strong class="table-ref">${escapeHtml(r.reference)}</strong></td>
      <td>${escapeHtml(formatReceived(r.createdAt))}</td>
      <td><strong>${escapeHtml(r.name)}</strong><small>${escapeHtml(r.phone||"")} · ${escapeHtml(r.email||"")}</small></td>
      <td><strong>${escapeHtml(r.date)}</strong><small>${escapeHtml(r.period)} · ${escapeHtml(r.duration)}</small></td>
      <td>${escapeHtml(r.eircode)}</td>
      <td>${escapeHtml(r.people)}</td>
      <td><span class="status-pill ${statusClass(r.status)}">${escapeHtml(r.status||"New")}</span></td>
      <td>${r.quoteAmount!=null?`€${Number(r.quoteAmount).toFixed(0)}`:"—"}</td>
      <td>${r.routeDistanceKm!=null?`${Number(r.routeDistanceKm).toFixed(1)} km`:"—"}</td>
      <td><button class="table-action select-request" data-id="${escapeHtml(r.id)}" type="button">${state.selectedRequestId===r.id?"SELECTED":"SELECT"}</button></td>
    </tr>`).join("");
    body.querySelectorAll(".select-request").forEach(b=>b.addEventListener("click",()=>selectRequestForQuote(b.dataset.id)));
  }
  renderJourneys();
}
function selectRequestForQuote(id){const r=repairRequests().find(x=>x.id===id);if(!r)return;state.selectedRequestId=id;state.lastRoute=null;$("travelEircode").value=r.eircode;$("quoteSelectionBadge").textContent=`${r.reference} · ${r.name}`;$("quoteCalculation").innerHTML=`<strong>${escapeHtml(r.name)} · ${escapeHtml(r.period)}</strong><span>Quote reference: ${escapeHtml(r.reference)}</span><span>Session price: €${getPricing()[priceKey(r.period)]||0}</span><span>Customer Eircode: ${escapeHtml(r.eircode)}</span><span>Calculate the route before calculating the final quote.</span>`;$("sendQuoteArea").hidden=true;$("quoteStatusActions").hidden=false;updateStatusButtons(r);renderOffice();$("travel-planner").scrollIntoView({behavior:"smooth",block:"start"})}
function updateStatusButtons(r){$("markAccepted").disabled=!r||r.status==="Accepted"||r.status==="Deposit Received"||r.status==="Scheduled"||r.status==="Completed";$("markDeposit").disabled=!r||!r.acceptedAt||r.status==="Deposit Received"||r.status==="Scheduled"||r.status==="Completed";$("addJourney").disabled=!r||!r.acceptedAt||!r.depositReceivedAt}
async function calculateTravel(){
  const customer=normaliseEircode($("travelEircode").value),base=normaliseEircode($("baseEircode").value||getOwner().eircode);
  if(!customer){$("travelResult").innerHTML='<strong>Select a quote request first.</strong><span>The customer Eircode is brought in automatically.</span>';return null}
  if(!base){$("travelResult").innerHTML='<strong>Business Eircode is missing.</strong><span>Update it in Admin.</span>';return null}
  if(customer===base){
    const r={km:0,meters:0,durationMinutes:0,cost:travelCost(0),source:"same-location"};
    state.lastRoute=r;showTravel(r);return r;
  }
  const endpoint=(localStorage.getItem("teeBoxRouteEndpoint")||DEFAULT_ROUTE_ENDPOINT).trim();
  if(!endpoint){$("travelResult").innerHTML='<strong>Route service is not connected.</strong><span>Deploy the supplied backend route service, then add its URL in Admin. The app will not guess a distance.</span>';return null}
  $("travelResult").innerHTML='<strong>Calculating actual driving route…</strong><span>Resolving both Eircodes and calculating the road distance.</span>';
  try{
    const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({originEircode:$("baseEircode").value.trim()||getOwner().eircode,destinationEircode:$("travelEircode").value.trim()})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||`Route service returned ${res.status}`);
    if(!Number.isFinite(Number(data.distanceMeters)))throw new Error(data.error||"No driving distance was returned");
    const km=Math.round(Number(data.distanceMeters)/1000*10)/10;
    const minutes=Number.isFinite(Number(data.durationSeconds))?Math.round(Number(data.durationSeconds)/60):null;
    const r={km,meters:Number(data.distanceMeters),durationMinutes:minutes,cost:travelCost(km),source:"route"};
    state.lastRoute=r;
    const id=state.selectedRequestId;
    if(id){saveRequests(repairRequests().map(x=>x.id===id?{...x,routeDistanceKm:km,routeDurationMinutes:minutes,travelCharge:r.cost}:x));}
    showTravel(r);
    renderOffice();
    return r;
  }catch(err){
    state.lastRoute=null;
    $("travelResult").innerHTML=`<strong>Route calculation failed.</strong><span>${escapeHtml(err.message||"The route service did not return a valid driving distance.")}</span><span>No travel charge has been applied.</span>`;
    return null;
  }
}
function showTravel(r){
  $("travelResult").innerHTML=`<strong>${r.km.toFixed(1)} km actual driving distance</strong><span>Travel charge from the configured band: €${Number(r.cost).toFixed(0)}</span>${r.durationMinutes!=null?`<span>Estimated driving time: ${r.durationMinutes} minutes</span>`:""}`;
}
function calculateQuote(){
  const id=state.selectedRequestId;
  if(!id){$("quoteCalculation").innerHTML='<strong>No request selected.</strong><span>Select a request from the quote table first.</span>';return}
  const r=repairRequests().find(x=>x.id===id);
  if(!r)return;
  const session=getPricing()[priceKey(r.period)]||0;
  if(!state.lastRoute){$("quoteCalculation").innerHTML='<strong>Calculate the actual route first.</strong><span>The quote will not use a guessed distance.</span>';return}
  const total=session+state.lastRoute.cost;
  const updated=repairRequests().map(x=>x.id===id?{...x,routeDistanceKm:state.lastRoute.km,routeDurationMinutes:state.lastRoute.durationMinutes,travelCharge:state.lastRoute.cost,sessionPrice:session,quoteAmount:total}:x);
  saveRequests(updated);
  const saved=updated.find(x=>x.id===id);
  renderQuoteEmailPreview(saved,total);
  $("quoteCalculation").innerHTML=`<strong>${escapeHtml(r.name)} · ${escapeHtml(r.period)}</strong><span>Quote reference: ${escapeHtml(r.reference)}</span><span>Session price: €${session}</span><span>Actual driving distance: ${state.lastRoute.km.toFixed(1)} km</span><span>Travel charge: €${state.lastRoute.cost}</span><span><strong>Estimated quote total: €${total}</strong></span>`;
  $("sendQuoteArea").hidden=false;
  $("sendQuoteArea").dataset.total=String(total);
  $("sendQuoteArea").dataset.requestId=id;
  renderOffice();
}
function quoteEmailText(r,total,message){
  const owner=getOwner();
  const travel=Number(r.travelCharge||0);
  const route=r.routeDistanceKm!=null?`${Number(r.routeDistanceKm).toFixed(1)} km driving distance${r.routeDurationMinutes!=null?` / approx. ${r.routeDurationMinutes} min`:""}`:"Route not calculated";
  return `THE TEE BOX
PREMIUM POP-UP GOLF SIMULATOR

========================================
QUOTE — ${r.reference}
========================================

CUSTOMER DETAILS
Name:        ${r.name}
Phone:       ${r.phone||""}
Email:       ${r.email||""}
Eircode:     ${r.eircode||""}
Players:     ${r.people||""}

SESSION DETAILS
Date:        ${r.date}
Period:      ${r.period}
Duration:    ${r.duration}

QUOTE BREAKDOWN
Session:     €${Number(r.sessionPrice||0).toFixed(0)}
Travel:      €${travel.toFixed(0)}
Distance:    ${route}
----------------------------------------
TOTAL QUOTE: €${Number(total).toFixed(0)}
----------------------------------------

MESSAGE
${message||"Thank you for your quote request. We would be delighted to provide THE TEE BOX for your event."}

This quote is subject to availability and is not confirmed until accepted and the required deposit has been received.

Regards,
${owner.name}
THE TEE BOX
${owner.phone}
${owner.email}`;
}
function renderQuoteEmailPreview(r,total){
  const box=$("quoteEmailPreview");if(!box||!r)return;
  const owner=getOwner();
  box.innerHTML=`<div class="email-preview-head"><strong>THE TEE BOX</strong><span>QUOTE ${escapeHtml(r.reference)}</span></div><div class="email-preview-section"><b>CUSTOMER DETAILS</b><div><span>Name</span><strong>${escapeHtml(r.name)}</strong></div><div><span>Phone</span><strong>${escapeHtml(r.phone||"")}</strong></div><div><span>Email</span><strong>${escapeHtml(r.email||"")}</strong></div><div><span>Eircode</span><strong>${escapeHtml(r.eircode||"")}</strong></div></div><div class="email-preview-section"><b>SESSION DETAILS</b><div><span>Date</span><strong>${escapeHtml(r.date)}</strong></div><div><span>Period</span><strong>${escapeHtml(r.period)} (${escapeHtml(r.duration)})</strong></div><div><span>Players</span><strong>${escapeHtml(r.people||"")}</strong></div></div><div class="email-preview-section"><b>QUOTE</b><div><span>Session</span><strong>€${Number(r.sessionPrice||0).toFixed(0)}</strong></div><div><span>Travel</span><strong>€${Number(r.travelCharge||0).toFixed(0)}</strong></div><div><span>Distance</span><strong>${r.routeDistanceKm!=null?Number(r.routeDistanceKm).toFixed(1)+" km":"—"}</strong></div><div class="email-total"><span>Total</span><strong>€${Number(total).toFixed(0)}</strong></div></div><div class="email-preview-signoff">${escapeHtml(owner.name)} · ${escapeHtml(owner.phone)} · ${escapeHtml(owner.email)}</div>`;
}
function prepareQuoteEmail(){
  const id=$("sendQuoteArea").dataset.requestId,total=Number($("sendQuoteArea").dataset.total||0),r=repairRequests().find(x=>x.id===id);
  if(!r)return;
  if(!r.email){$("sendQuoteStatus").textContent="This customer has no email address.";return}
  const message=$("quoteMessage").value.trim();
  const body=quoteEmailText(r,total,message);
  const mailto=`mailto:${encodeURIComponent(r.email)}?subject=${encodeURIComponent("THE TEE BOX — Quote "+r.reference)}&body=${encodeURIComponent(body)}`;
  saveRequests(repairRequests().map(x=>x.id===id?{...x,status:"Quote Sent",quoteSentAt:new Date().toISOString(),quoteMessage:message}:x));
  window.location.href=mailto;
  $("sendQuoteStatus").textContent="Quote email prepared using the THE TEE BOX form-style template.";
  renderOffice();
}
function markAccepted(){const id=state.selectedRequestId;if(!id)return;saveRequests(repairRequests().map(r=>r.id===id?{...r,acceptedAt:r.acceptedAt||new Date().toISOString(),status:r.depositReceivedAt?"Deposit Received":"Accepted"}:r));renderOffice();const r=repairRequests().find(x=>x.id===id);updateStatusButtons(r)}
function markDeposit(){const id=state.selectedRequestId;if(!id)return;const rs=repairRequests();const r=rs.find(x=>x.id===id);if(!r?.acceptedAt)return;saveRequests(rs.map(x=>x.id===id?{...x,depositReceivedAt:x.depositReceivedAt||new Date().toISOString(),status:"Deposit Received"}:x));renderOffice();updateStatusButtons(repairRequests().find(x=>x.id===id))}
function defaultStart(period){return period==="Full Day"?"10:00":period==="Morning"?"10:00":period==="Afternoon"?"14:00":"18:00"}
function addJourney(){const id=state.selectedRequestId,r=repairRequests().find(x=>x.id===id);if(!r||!r.acceptedAt||!r.depositReceivedAt){alert("The quote must be accepted and the deposit received before it can be added to the journey schedule.");return}if(!r.routeDistanceKm){alert("Calculate the route and quote first so the journey has a driving distance.");return}const start=prompt("Customer session start time",defaultStart(r.period));if(!start)return;const setup=Number(prompt("Setup / arrival buffer in minutes", "30"));if(!Number.isFinite(setup)||setup<0)return;const travel=r.routeDurationMinutes||0;const startDate=new Date(`${dateKeyFromText(r.date)}T${start}:00`);if(Number.isNaN(startDate.getTime())){alert("Could not read the requested date.");return}const arrive=new Date(startDate.getTime()-setup*60000);const depart=new Date(arrive.getTime()-travel*60000);const journey={id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(),requestId:r.id,reference:r.reference,name:r.name,phone:r.phone,email:r.email,eircode:r.eircode,date:r.date,period:r.period,duration:r.duration,startTime:start,departTime:timeOnly(depart),arriveTime:timeOnly(arrive),travelDurationMinutes:travel,setupMinutes:setup,distanceKm:r.routeDistanceKm,status:"Scheduled",createdAt:new Date().toISOString()};const js=getJourneys().filter(j=>j.requestId!==r.id);js.push(journey);saveJourneys(js);saveRequests(repairRequests().map(x=>x.id===id?{...x,status:"Scheduled"}:x));renderOffice();alert("Journey added to the owner schedule.")}
function dateKeyFromText(text){const d=new Date(text);if(!Number.isNaN(d.getTime()))return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;const m=String(text).match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);if(!m)return "";const d2=new Date(`${m[2]} ${m[1]}, ${m[3]}`);return `${d2.getFullYear()}-${String(d2.getMonth()+1).padStart(2,"0")}-${String(d2.getDate()).padStart(2,"0")}`}
function timeOnly(d){return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`}
function renderJourneys(){const body=$("journeyRows"),js=getJourneys().sort((a,b)=>new Date(a.date)-new Date(b.date)||String(a.startTime).localeCompare(String(b.startTime)));if(!js.length){body.innerHTML='<tr><td colspan="8" class="empty-cell">No confirmed journeys yet.</td></tr>';return}body.innerHTML=js.map(j=>`<tr><td><strong>${escapeHtml(j.date)}</strong></td><td><strong>${escapeHtml(j.name)}</strong><small>${escapeHtml(j.reference)}</small></td><td>${escapeHtml(j.eircode)}<small>${escapeHtml(j.distanceKm)} km</small></td><td>${escapeHtml(j.period)}<small>${escapeHtml(j.startTime)}</small></td><td>${escapeHtml(j.departTime)}</td><td>${escapeHtml(j.arriveTime)}</td><td><a class="table-link" href="https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(getOwner().eircode)}&destination=${encodeURIComponent(j.eircode)}&travelmode=driving" target="_blank" rel="noopener">OPEN MAP</a></td><td><span class="status-pill scheduled">${escapeHtml(j.status)}</span></td></tr>`).join("")}
function loadPricing(){const p=getPricing();["fullDay","morning","afternoon","evening","travel0","travel20","travel50","travel100"].forEach(k=>{const id="price"+k.charAt(0).toUpperCase()+k.slice(1);if($(id))$(id).value=p[k]})}
function savePricing(){const p={fullDay:+$("priceFullDay").value||0,morning:+$("priceMorning").value||0,afternoon:+$("priceAfternoon").value||0,evening:+$("priceEvening").value||0,travel0:+$("travel0").value||0,travel20:+$("travel20").value||0,travel50:+$("travel50").value||0,travel100:+$("travel100").value||0};localStorage.setItem("teeBoxPricing",JSON.stringify(p));$("pricingSaved").textContent="Pricing saved on this device.";renderOffice()}
function loadAdmin(){const o=getOwner();$("ownerName").value=o.name;$("ownerPhone").value=o.phone;$("ownerEmail").value=o.email;$("ownerEircode").value=o.eircode;$("routeApiEndpoint").value=localStorage.getItem("teeBoxRouteEndpoint")||""}
function saveAdmin(){const o={name:$("ownerName").value.trim(),phone:$("ownerPhone").value.trim(),email:$("ownerEmail").value.trim(),eircode:$("ownerEircode").value.trim().toUpperCase()};saveOwner(o);localStorage.setItem("teeBoxRouteEndpoint",$("routeApiEndpoint").value.trim());$("baseEircode").value=o.eircode;$("adminSaved").textContent="Admin settings saved on this device."}

async function testRouteService(){
  const endpoint=$("routeApiEndpoint").value.trim();
  const result=$("routeTestResult");
  if(!endpoint){result.textContent="Enter the route service URL first.";return}
  result.textContent="Testing route service…";
  try{
    const o=$("ownerEircode").value.trim()||getOwner().eircode;
    const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({originEircode:o,destinationEircode:o})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||`HTTP ${res.status}`);
    if(Number(data.distanceMeters)!==0)throw new Error("The service responded, but did not return the expected same-location test result.");
    result.textContent="Route service connected successfully.";
  }catch(e){result.textContent=`Route service test failed: ${e.message||e}`;}
}
function bind(){
 $("menuToggle")?.addEventListener("click",()=>{const open=$("mainNav").classList.toggle("open");$("menuToggle").setAttribute("aria-expanded",String(open))});$("mainNav")?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>$("mainNav").classList.remove("open")));
 $("prevMonth")?.addEventListener("click",()=>{state.viewDate=new Date(state.viewDate.getFullYear(),state.viewDate.getMonth()-1,1);renderCalendar()});$("nextMonth")?.addEventListener("click",()=>{state.viewDate=new Date(state.viewDate.getFullYear(),state.viewDate.getMonth()+1,1);renderCalendar()});$("people")?.addEventListener("change",()=>$("summaryPeople").textContent=$("people").value);
 $("quoteForm")?.addEventListener("submit",e=>{e.preventDefault();if(!state.selectedDate||!state.selectedSlot){alert("Please select an available date and quote period before requesting a quote.");return}const name=$("name").value.trim(),eircode=$("eircode").value.trim();if(!name||!eircode)return;const request={id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(),reference:createQuoteReference(),name,phone:$("phone").value.trim(),email:$("email").value.trim(),eircode,date:fmt(state.selectedDate),period:state.selectedSlot.time,duration:state.selectedSlot.duration,people:$("people").value==="6"?"6+":$("people").value,notes:$("notes").value.trim(),status:"New",createdAt:new Date().toISOString()};const rs=getRequests();rs.push(request);saveRequests(rs);$("confirmReference").textContent=request.reference;$("confirmName").textContent=name;$("confirmDate").textContent=fmt(state.selectedDate);$("confirmTime").textContent=`${state.selectedSlot.time} (${state.selectedSlot.duration})`;$("confirmPeople").textContent=request.people;$("confirmNotes").textContent=request.notes||"None";$("confirmationModal").hidden=false;document.body.style.overflow="hidden"});
 $("closeModal")?.addEventListener("click",()=>{ $("confirmationModal").hidden=true;document.body.style.overflow="";resetBooking()});$("modalDone")?.addEventListener("click",()=>{ $("confirmationModal").hidden=true;document.body.style.overflow="";resetBooking()});
 $("officeLoginForm")?.addEventListener("submit",e=>{e.preventDefault();if($("officeUsername").value==="office"&&$("officePassword").value==="teebox"){ $("officeLogin").hidden=true;$("officeDashboard").hidden=false;loadPricing();$("baseEircode").value=getOwner().eircode;renderOffice()}else $("officeLoginMessage").innerHTML='<span style="color:var(--gold)">Incorrect username or password.</span>'});$("officeLogout")?.addEventListener("click",()=>{$("officeDashboard").hidden=true;$("officeLogin").hidden=false;$("officePassword").value=""});
 $("savePricing")?.addEventListener("click",savePricing);$("calculateTravel")?.addEventListener("click",calculateTravel);$("calculateQuote")?.addEventListener("click",calculateQuote);$("sendQuote")?.addEventListener("click",prepareQuoteEmail);$("markAccepted")?.addEventListener("click",markAccepted);$("markDeposit")?.addEventListener("click",markDeposit);$("addJourney")?.addEventListener("click",addJourney);
 $("planRoute")?.addEventListener("click",()=>{const customer=$("travelEircode").value.trim(),base=$("baseEircode").value.trim()||getOwner().eircode;if(!customer){$("travelResult").innerHTML='<strong>Select a quote request first.</strong><span>The customer Eircode is brought in automatically.</span>';return}window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(base)}&destination=${encodeURIComponent(customer)}&travelmode=driving`,"_blank","noopener")});
 $("adminPinForm")?.addEventListener("submit",e=>{e.preventDefault();if($("adminPin").value===getAdminPin()){$("adminLocked").hidden=true;$("adminSettings").hidden=false;loadAdmin();$("adminPinMessage").textContent="Admin unlocked."}else $("adminPinMessage").innerHTML='<span style="color:var(--gold)">Incorrect admin PIN.</span>'});$("saveAdmin")?.addEventListener("click",saveAdmin);$("testRouteService")?.addEventListener("click",testRouteService);$("lockAdmin")?.addEventListener("click",()=>{$("adminSettings").hidden=true;$("adminLocked").hidden=false});
}
window.addEventListener("storage",()=>{if($("officeDashboard")&&!$("officeDashboard").hidden)renderOffice()});
window.addEventListener("pageshow",()=>{state.viewDate=new Date(new Date().getFullYear(),new Date().getMonth(),1);renderCalendar();renderSlots()});
bind();renderCalendar();renderSlots();
})();
