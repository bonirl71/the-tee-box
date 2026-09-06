/* THE TEE BOX — REV 1.3.4 */
(() => {
"use strict";
const now=new Date(); const state={viewDate:new Date(now.getFullYear(),now.getMonth(),1),selectedDate:null,selectedSlot:null};
const SLOTS=[{time:"10:00",duration:"1 hour"},{time:"12:00",duration:"1 hour"},{time:"14:00",duration:"1 hour"},{time:"16:00",duration:"1 hour"},{time:"18:00",duration:"1 hour"},{time:"20:00",duration:"1 hour"}];
const $=id=>document.getElementById(id);
const OWNER={
  name:"Brian O'Neill",
  phone:"087 9165960",
  email:"bonirl71@gmail.com"
};
// EmailJS service is already known from setup; Public Key and Template ID
// are intentionally placeholders until the user supplies the final values.
const EMAIL_CONFIG={
  serviceId:"service_2f3sm26",
  templateId:"",
  publicKey:""
};
const els={menuToggle:$("menuToggle"),mainNav:$("mainNav"),calendarMonth:$("calendarMonth"),calendarGrid:$("calendarGrid"),prevMonth:$("prevMonth"),nextMonth:$("nextMonth"),selectedDateLabel:$("selectedDateLabel"),slotGrid:$("slotGrid"),bookingForm:$("quoteForm"),people:$("people"),durationDisplay:$("durationDisplay"),summaryDate:$("summaryDate"),summaryTime:$("summaryTime"),summaryPeople:$("summaryPeople"),confirmationModal:$("confirmationModal"),closeModal:$("closeModal"),modalDone:$("modalDone"),confirmName:$("confirmName"),confirmDate:$("confirmDate"),confirmTime:$("confirmTime"),confirmPeople:$("confirmPeople"),confirmNotes:$("confirmNotes"),confirmReference:$("confirmReference")};
function key(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function today(){const d=new Date();d.setHours(0,0,0,0);return d}
function available(d){if(d<today())return false;const day=d.getDay();return day===0||day===6||d.getDate()%3!==0}
function fmt(d){return new Intl.DateTimeFormat("en-IE",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(d)}
function renderCalendar(){
 const y=state.viewDate.getFullYear(),m=state.viewDate.getMonth();els.calendarMonth.textContent=new Intl.DateTimeFormat("en-IE",{month:"long",year:"numeric"}).format(state.viewDate);els.calendarGrid.innerHTML="";
 const first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),leading=(first.getDay()+6)%7;
 for(let i=0;i<leading;i++){const b=document.createElement("div");b.className="calendar-day empty";els.calendarGrid.appendChild(b)}
 for(let n=1;n<=days;n++){const d=new Date(y,m,n),b=document.createElement("button");b.type="button";b.className="calendar-day";b.textContent=n;
 if(available(d)){b.classList.add("available");b.addEventListener("click",()=>selectDate(d))}else{b.classList.add("unavailable");b.disabled=true}
 if(key(d)===key(today()))b.classList.add("today");if(state.selectedDate&&key(d)===key(state.selectedDate))b.classList.add("selected");els.calendarGrid.appendChild(b)}
}
function selectDate(d){state.selectedDate=new Date(d);state.selectedSlot=null;els.summaryDate.textContent=fmt(d);els.summaryTime.textContent="Not selected";els.durationDisplay.value="Select a quote period";renderCalendar();renderSlots()}
function renderSlots(){
  els.slotGrid.innerHTML = "";
  const periods = [
    {time:"Full Day", duration:"8 Hours"},
    {time:"Morning", duration:"4 Hours"},
    {time:"Afternoon", duration:"4 Hours"},
    {time:"Evening", duration:"4 Hours"}
  ];
  periods.forEach(s=>{
    const b=document.createElement("button");
    b.type="button";
    b.className="slot quote-period";
    b.disabled=!state.selectedDate;
    if(state.selectedSlot && state.selectedSlot.time===s.time)b.classList.add("selected");
    b.innerHTML=`<strong>${s.time}</strong><span>${s.duration}</span>`;
    b.addEventListener("click",()=>selectSlot(s));
    els.slotGrid.appendChild(b);
  });
}
function selectSlot(s){
  state.selectedSlot=s;
  els.summaryTime.textContent=`${s.time} (${s.duration})`;
  els.durationDisplay.value=`${s.time} — ${s.duration}`;
  renderSlots();
}
function closeMenu(){els.mainNav.classList.remove("open");els.menuToggle.setAttribute("aria-expanded","false")}
function resetBooking(){
  state.selectedDate = null;
  state.selectedSlot = null;

  // Clear every customer-entered field explicitly.
  document.getElementById("name").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("email").value = "";
  document.getElementById("eircode").value = "";
  document.getElementById("notes").value = "";
  els.people.value = "2";

  els.summaryDate.textContent = "Not selected";
  els.summaryTime.textContent = "Not selected";
  els.summaryPeople.textContent = "2";
  els.durationDisplay.value = "Select a quote period";
  

  renderCalendar();
  renderSlots();
}
function closeModal(reset=false){
  els.confirmationModal.hidden=true;
  document.body.style.overflow="";
  if(reset){
    resetBooking();
    document.getElementById("quote").scrollIntoView({behavior:"smooth",block:"start"});
  }
}
function openModal(){els.confirmationModal.hidden=false;document.body.style.overflow="hidden";els.modalDone.focus()}
els.menuToggle.addEventListener("click",()=>{const open=els.mainNav.classList.toggle("open");els.menuToggle.setAttribute("aria-expanded",String(open))});
els.mainNav.querySelectorAll("a").forEach(a=>a.addEventListener("click",e=>{
  closeMenu();
  if(a.getAttribute("href")==="#quote"){
    resetBooking();
  }
}));
document.querySelectorAll('a[href="#quote"]').forEach(a=>a.addEventListener("click",()=>{
  resetBooking();
}));
els.prevMonth.addEventListener("click",()=>{state.viewDate=new Date(state.viewDate.getFullYear(),state.viewDate.getMonth()-1,1);renderCalendar()});
els.nextMonth.addEventListener("click",()=>{state.viewDate=new Date(state.viewDate.getFullYear(),state.viewDate.getMonth()+1,1);renderCalendar()});
els.people.addEventListener("change",()=>els.summaryPeople.textContent=els.people.value);
els.bookingForm.addEventListener("submit",e=>{
 e.preventDefault();
 if(!state.selectedDate||!state.selectedSlot){alert("Please select an available date and quote period before requesting a quote.");return}
 const name=$("name").value.trim(),eircode=$("eircode").value.trim();
 if(!name||!eircode)return;
 const request={id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(),reference:createQuoteReference(),name,phone:$("phone").value.trim(),email:$("email").value.trim(),eircode,date:fmt(state.selectedDate),period:state.selectedSlot.time,duration:state.selectedSlot.duration,people:els.people.value==="6"?"6+":els.people.value,notes:$("notes").value.trim(),status:"New",createdAt:new Date().toISOString()};
 const reqs=getRequests(); reqs.unshift(request); saveRequests(reqs);
 els.confirmReference.textContent=request.reference;els.confirmName.textContent=name;els.confirmDate.textContent=fmt(state.selectedDate);els.confirmTime.textContent=`${state.selectedSlot.time} (${state.selectedSlot.duration})`;els.confirmPeople.textContent=request.people;els.confirmNotes.textContent=request.notes||"None";openModal();
});
els.closeModal.addEventListener("click",()=>closeModal(true));els.modalDone.addEventListener("click",()=>closeModal(true));els.confirmationModal.addEventListener("click",e=>{if(e.target===els.confirmationModal)closeModal(true)});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!els.confirmationModal.hidden)closeModal()});

function createQuoteReference(){
 const d=new Date(), stamp=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
 const suffix=Math.random().toString(36).slice(2,7).toUpperCase();
 return `TTB-${stamp}-${suffix}`;
}
function renderOffice(){
 let requests=getRequests();
 let changed=false;
 requests=requests.map((r,i)=>{
   if(!r.reference){r.reference=createQuoteReference();changed=true}
   if(!r.createdAt){r.createdAt=new Date(Date.now()-(requests.length-i)*1000).toISOString();changed=true}
   return r;
 });
 if(changed)saveRequests(requests);
 requests.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 const container=$("quoteRequests");
 $("newQuoteCount").textContent=requests.filter(r=>r.status==="New").length;
 $("pendingQuoteCount").textContent=requests.filter(r=>["Pending","Quote Sent"].includes(r.status)).length;
 if(!requests.length){container.innerHTML='<p class="empty-state">No quote requests yet.</p>';return}
 container.innerHTML="";
 requests.forEach(r=>{
   const card=document.createElement("div");card.className="quote-request";
   card.innerHTML=`
    <div class="quote-request-head"><h4>${escapeHtml(r.name)}</h4><p class="quote-reference">${escapeHtml(r.reference)}</p></div>
    <div><span class="quote-meta-label">Received</span><p>${escapeHtml(formatReceived(r.createdAt))}</p></div>
    <div><span class="quote-meta-label">Requested</span><p>${escapeHtml(r.date)} · ${escapeHtml(r.period)} (${escapeHtml(r.duration)})</p></div>
    <div><span class="quote-meta-label">Customer</span><p>${escapeHtml(r.eircode)} · ${escapeHtml(r.people)} players</p><p>${escapeHtml(r.email)}</p></div>
    <div><span class="quote-meta-label">Status</span><p class="status">${escapeHtml(r.status||"New")}</p></div>
    <button class="button button-gold select-request" type="button" data-id="${escapeHtml(r.id)}">SELECT FOR QUOTE</button>`;
   container.appendChild(card);
 });
 container.querySelectorAll(".select-request").forEach(b=>b.addEventListener("click",()=>selectRequestForQuote(b.dataset.id)));
}
function formatReceived(value){
 const d=new Date(value);
 if(Number.isNaN(d.getTime()))return "Unknown";
 return d.toLocaleDateString("en-IE",{day:"2-digit",month:"short",year:"numeric"})+" "+d.toLocaleTimeString("en-IE",{hour:"2-digit",minute:"2-digit"});
}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function selectRequestForQuote(id){
 const r=getRequests().find(x=>x.id===id); if(!r)return;
 $("travelEircode").value=r.eircode;
 $("quoteCalculation").dataset.requestId=r.id;
 $("sendQuoteArea").hidden=true;
 $("sendQuoteStatus").textContent="";
 $("quoteCalculation").innerHTML=`<strong>${escapeHtml(r.name)} · ${escapeHtml(r.period)}</strong><span>Quote reference: ${escapeHtml(r.reference||"NO REF")}</span><span>Session price: €${pricing[priceKey(r.period)]||0}</span><span>Customer Eircode: ${escapeHtml(r.eircode)}</span><span>Click CALCULATE QUOTE to calculate distance and travel cost.</span>`;
 $("travel-planner").scrollIntoView({behavior:"smooth",block:"start"});
}
const DEFAULT_PRICING={fullDay:400,morning:250,afternoon:250,evening:250,travel0:0,travel20:25,travel50:50,travel100:100};
const DEMO_DISTANCES={"E45DV25":3,"E21DEMO":24,"V94DEMO":58,"H91DEMO":112};
let pricing=JSON.parse(localStorage.getItem("teeBoxPricing")||"null")||{...DEFAULT_PRICING};
function saveRequests(list){localStorage.setItem("teeBoxQuoteRequests",JSON.stringify(list))}
function getRequests(){return JSON.parse(localStorage.getItem("teeBoxQuoteRequests")||"[]")}
function populatePricing(){updatePricingInputs()}
function updatePricingInputs(){["fullDay","morning","afternoon","evening","travel0","travel20","travel50","travel100"].forEach(k=>{const el=$("price"+k.charAt(0).toUpperCase()+k.slice(1))||$(k);if(el)el.value=pricing[k]})}
function travelCost(km){if(km<=20)return pricing.travel0;if(km<=50)return pricing.travel20;if(km<=100)return pricing.travel50;return pricing.travel100}
function priceKey(period){return period==="Full Day"?"fullDay":period.toLowerCase()}
function normaliseEircode(v){return v.trim().toUpperCase().replace(/\s+/g,"")}
function demoDistance(e){return DEMO_DISTANCES[normaliseEircode(e)]??null}
function showTravel(km,source="live"){
 const cost=travelCost(km);
 $("travelResult").innerHTML=`<strong>${km} km driving distance${source==="demo"?" (preview test distance)":""}</strong><span>Travel charge from the configured band: €${cost}.</span>`;
 return {km,cost};
}
async function calculateTravel(){
 const customer=normaliseEircode($("travelEircode").value),base=normaliseEircode($("baseEircode").value||"E45 WC97");
 if(!customer){$("travelResult").innerHTML='<strong>Select a quote request first.</strong><span>The customer Eircode is brought in automatically.</span>';return null}
 if(customer===base)return showTravel(0,"live");
 const demo=demoDistance(customer);
 if(demo!==null)return showTravel(demo,"demo");
 $("travelResult").innerHTML='<strong>Live distance calculation is not available in this preview.</strong><span>The real version will resolve both Eircodes in the backend and use the driving-route distance to select the travel-cost band. It will not default to 0 km.</span>';
 return null;
}
$("officeLoginForm").addEventListener("submit",e=>{e.preventDefault();if($("officeUsername").value==="office"&&$("officePassword").value==="teebox"){ $("officeLogin").hidden=true;$("officeDashboard").hidden=false;populatePricing();renderOffice()}else $("officeLoginMessage").innerHTML='<span style="color:var(--gold)">Incorrect username or password.</span>'});
$("officeLogout").addEventListener("click",()=>{$("officeDashboard").hidden=true;$("officeLogin").hidden=false;$("officePassword").value=""});
$("savePricing").addEventListener("click",()=>{pricing={fullDay:+$("priceFullDay").value||0,morning:+$("priceMorning").value||0,afternoon:+$("priceAfternoon").value||0,evening:+$("priceEvening").value||0,travel0:+$("travel0").value||0,travel20:+$("travel20").value||0,travel50:+$("travel50").value||0,travel100:+$("travel100").value||0};localStorage.setItem("teeBoxPricing",JSON.stringify(pricing));$("pricingSaved").textContent="Pricing saved on this device.";renderOffice()});
$("calculateTravel").addEventListener("click",calculateTravel);
$("planRoute").addEventListener("click",()=>{
 const customer=$("travelEircode").value.trim(),base=$("baseEircode").value.trim()||"E45 WC97";
 if(!customer){$("travelResult").innerHTML='<strong>Select a quote request first.</strong><span>The customer Eircode is brought in automatically.</span>';return}
 const url=`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(base)}&destination=${encodeURIComponent(customer)}&travelmode=driving`;
 window.open(url,"_blank","noopener");
});
$("calculateQuote").addEventListener("click",async()=>{
 const rid=$("quoteCalculation").dataset.requestId;
 if(!rid){$("quoteCalculation").innerHTML='<strong>No request selected.</strong><span>Select a quote request first.</span>';return}
 const r=getRequests().find(x=>x.id===rid); if(!r)return;
 const session=pricing[priceKey(r.period)]||0;
 $("travelEircode").value=r.eircode;
 const result=await calculateTravel();
 if(!result){$("quoteCalculation").innerHTML=`<strong>${escapeHtml(r.name)} · ${escapeHtml(r.period)}</strong><span>Quote reference: ${escapeHtml(r.reference||"NO REF")}</span><span>Session price: €${session}</span><span>Customer Eircode: ${escapeHtml(r.eircode)}</span><span>Travel cost not calculated.</span>`;return}
 const total=session+result.cost;
 $("quoteCalculation").innerHTML=`<strong>${escapeHtml(r.name)} · ${escapeHtml(r.period)}</strong><span>Quote reference: ${escapeHtml(r.reference||"NO REF")}</span><span>Session price: €${session}</span><span>Route distance: ${result.km} km</span><span>Travel charge: €${result.cost}</span><span><strong>Estimated quote total: €${total}</strong></span>`;
 $("sendQuoteArea").hidden=false;
 $("sendQuoteArea").dataset.total=String(total);
 $("sendQuoteArea").dataset.requestId=r.id;
});
$("sendQuote").addEventListener("click",()=>{
 const id=$("sendQuoteArea").dataset.requestId, total=Number($("sendQuoteArea").dataset.total||0);
 const r=getRequests().find(x=>x.id===id); if(!r)return;
 const body=`Hi ${r.name},\n\nThanks for your quote request.\n\nQuote reference: ${r.reference}\nDate: ${r.date}\nPeriod: ${r.period} (${r.duration})\nPlayers: ${r.people}\nTravel: ${$("travelResult").textContent.replace(/\s+/g," ").trim()}\n\nQuote total: €${total}\n\n${$("quoteMessage").value.trim()}\n\nRegards,\nTHE TEE BOX`;
 const mailto=`mailto:${encodeURIComponent(r.email)}?subject=${encodeURIComponent("THE TEE BOX Quote "+r.reference)}&body=${encodeURIComponent(body)}`;
 window.location.href=mailto;
 const updated=getRequests().map(x=>x.id===r.id?{...x,status:"Quote Sent",quoteAmount:total,quoteSentAt:new Date().toISOString()}:x);
 saveRequests(updated);renderOffice();
 $("sendQuoteStatus").textContent="Quote prepared for the customer. Your email app should open with the quote ready to send.";
});
window.addEventListener("storage",()=>{if(!$("officeDashboard").hidden)renderOffice()});
window.addEventListener("pageshow",()=>{state.viewDate=new Date(new Date().getFullYear(),new Date().getMonth(),1);renderCalendar();renderSlots()});
renderCalendar();renderSlots();
})();
