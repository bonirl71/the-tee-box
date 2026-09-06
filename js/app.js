/* THE TEE BOX — REV 1.3.0 */
(() => {
"use strict";
const state={viewDate:new Date(),selectedDate:null,selectedSlot:null};
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
const els={menuToggle:$("menuToggle"),mainNav:$("mainNav"),calendarMonth:$("calendarMonth"),calendarGrid:$("calendarGrid"),prevMonth:$("prevMonth"),nextMonth:$("nextMonth"),selectedDateLabel:$("selectedDateLabel"),slotGrid:$("slotGrid"),bookingForm:$("quoteForm"),people:$("people"),durationDisplay:$("durationDisplay"),summaryDate:$("summaryDate"),summaryTime:$("summaryTime"),summaryPeople:$("summaryPeople"),confirmationModal:$("confirmationModal"),closeModal:$("closeModal"),modalDone:$("modalDone"),confirmName:$("confirmName"),confirmDate:$("confirmDate"),confirmTime:$("confirmTime"),confirmPeople:$("confirmPeople"),confirmNotes:$("confirmNotes")};
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
els.mainNav.querySelectorAll("a").forEach(a=>a.addEventListener("click",closeMenu));
els.prevMonth.addEventListener("click",()=>{state.viewDate=new Date(state.viewDate.getFullYear(),state.viewDate.getMonth()-1,1);renderCalendar()});
els.nextMonth.addEventListener("click",()=>{state.viewDate=new Date(state.viewDate.getFullYear(),state.viewDate.getMonth()+1,1);renderCalendar()});
els.people.addEventListener("change",()=>els.summaryPeople.textContent=els.people.value);
els.bookingForm.addEventListener("submit",e=>{e.preventDefault();if(!state.selectedDate||!state.selectedSlot){alert("Please select an available date and quote period before requesting a quote.");return}const name=$("name").value.trim(),eircode=$("eircode").value.trim();if(!name||!eircode)return;const request={id:Date.now().toString(),name,phone:$("phone").value.trim(),email:$("email").value.trim(),eircode,date:fmt(state.selectedDate),period:state.selectedSlot.time,duration:state.selectedSlot.duration,people:els.people.value==="6"?"6+":els.people.value,notes:$("notes").value.trim(),status:"New"};const reqs=getRequests();reqs.unshift(request);saveRequests(reqs);els.confirmName.textContent=name;els.confirmDate.textContent=fmt(state.selectedDate);els.confirmTime.textContent=`${state.selectedSlot.time} (${state.selectedSlot.duration})`;els.confirmPeople.textContent=request.people;els.confirmNotes.textContent=request.notes||"None";openModal()});
els.closeModal.addEventListener("click",()=>closeModal(true));els.modalDone.addEventListener("click",()=>closeModal(true));els.confirmationModal.addEventListener("click",e=>{if(e.target===els.confirmationModal)closeModal(true)});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!els.confirmationModal.hidden)closeModal()});

const DEFAULT_PRICING={fullDay:400,morning:250,afternoon:250,evening:250,travel0:0,travel20:25,travel50:50,travel100:100};
const DEMO_DISTANCES={"E45DEMO":8,"E21DEMO":24,"V94DEMO":58,"H91DEMO":112};
let pricing=JSON.parse(localStorage.getItem("teeBoxPricing")||"null")||{...DEFAULT_PRICING};
function saveRequests(list){localStorage.setItem("teeBoxQuoteRequests",JSON.stringify(list))}
function getRequests(){return JSON.parse(localStorage.getItem("teeBoxQuoteRequests")||"[]")}
function updatePricingInputs(){["fullDay","morning","afternoon","evening","travel0","travel20","travel50","travel100"].forEach(k=>{const el=$("price"+k.charAt(0).toUpperCase()+k.slice(1))||$(k);if(el)el.value=pricing[k]})}
function priceKey(period){return period.toLowerCase().replace(/\s/g,"").includes("fullday")?"fullDay":period.toLowerCase()}
function travelCost(km){if(km<=20)return pricing.travel0;if(km<=50)return pricing.travel20;if(km<=100)return pricing.travel50;return pricing.travel100}
function renderOffice(){
 const reqs=getRequests().filter(r=>r.status!=="Completed");
 $("newQuoteCount").textContent=reqs.filter(r=>r.status==="New").length;
 $("pendingQuoteCount").textContent=reqs.filter(r=>r.status==="Pending").length;
 const box=$("quoteRequests");box.innerHTML="";
 if(!reqs.length){box.innerHTML='<p class="empty-state">No new or pending quote requests.</p>';return}
 reqs.forEach(r=>{const d=document.createElement("div");d.className="quote-request";d.innerHTML=`<div class="quote-request-head"><div><h4>${r.name}</h4><p>${r.date} · ${r.period} · ${r.people} players</p><p>${r.eircode} · ${r.phone} · ${r.email}</p></div><span class="status">${r.status}</span></div><p>${r.notes||"No notes"}</p><button class="button button-gold calculate-request" type="button">CALCULATE QUOTE</button>`;d.querySelector("button").addEventListener("click",()=>selectRequestForQuote(r));box.appendChild(d)})
}
function selectRequestForQuote(r){
 $("travelEircode").value=r.eircode;$("quoteCalculation").dataset.requestId=r.id;
 const session=pricing[priceKey(r.period)]||0;$("quoteCalculation").innerHTML=`<strong>${r.name} · ${r.period}</strong><span>Session price: €${session}</span><span>Travel: enter/calculate distance for ${r.eircode} to apply the travel band.</span>`;
 $("travel-planner")?.scrollIntoView?.({behavior:"smooth"});
}
function populatePricing(){
 const map={fullDay:"priceFullDay",morning:"priceMorning",afternoon:"priceAfternoon",evening:"priceEvening",travel0:"travel0",travel20:"travel20",travel50:"travel50",travel100:"travel100"};Object.entries(map).forEach(([k,id])=>$(id).value=pricing[k]);
}
function normaliseEircode(v){return v.trim().toUpperCase().replace(/\s+/g,"")}
function demoDistance(e){return DEMO_DISTANCES[normaliseEircode(e)]??null}
function showTravel(km){const cost=travelCost(km);$("travelResult").innerHTML=`<strong>${km} km estimated travel distance</strong><span>Travel charge from the configured band: €${cost}.</span>`;return {km,cost}}
function calculateTravel(){
 const customer=normaliseEircode($("travelEircode").value),base=normaliseEircode($("baseEircode").value);let km=demoDistance(customer);
 if(km===null){$("travelResult").innerHTML='<strong>Demo lookup needed</strong><span>For this preview use E45DEMO, E21DEMO, V94DEMO or H91DEMO as the customer Eircode. The production version will geocode real Eircodes and use route distance.</span>';return}
 const result=showTravel(km);const rid=$("quoteCalculation").dataset.requestId;if(rid){const r=getRequests().find(x=>x.id===rid);if(r){const session=pricing[priceKey(r.period)]||0;$("quoteCalculation").innerHTML=`<strong>${r.name} · ${r.period}</strong><span>Session price: €${session}</span><span>Travel (${km} km): €${result.cost}</span><span><strong>Estimated quote total: €${session+result.cost}</strong></span>`}}
}
$("officeLoginForm").addEventListener("submit",e=>{e.preventDefault();if($("officeUsername").value==="office"&&$("officePassword").value==="teebox"){ $("officeLogin").hidden=true;$("officeDashboard").hidden=false;populatePricing();renderOffice()}else $("officeLoginMessage").innerHTML='<span style="color:var(--gold)">Incorrect username or password.</span>'});
$("officeLogout").addEventListener("click",()=>{$("officeDashboard").hidden=true;$('officeLogin').hidden=false;$('officePassword').value=""});
$("savePricing").addEventListener("click",()=>{pricing={fullDay:+$("priceFullDay").value||0,morning:+$("priceMorning").value||0,afternoon:+$("priceAfternoon").value||0,evening:+$("priceEvening").value||0,travel0:+$("travel0").value||0,travel20:+$("travel20").value||0,travel50:+$("travel50").value||0,travel100:+$("travel100").value||0};localStorage.setItem("teeBoxPricing",JSON.stringify(pricing));$("pricingSaved").textContent="Pricing saved on this device."});
$("calculateTravel").addEventListener("click",calculateTravel);

renderCalendar();renderSlots();
})();
