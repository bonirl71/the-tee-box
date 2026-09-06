/* THE TEE BOX — REV 1.3.2 */
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
els.bookingForm.addEventListener("submit",e=>{e.preventDefault();if(!state.selectedDate||!state.selectedSlot){alert("Please select an available date and quote period before requesting a quote.");return}const name=$("name").value.trim(),eircode=$("eircode").value.trim();if(!name||!eircode)return;const request={id:Date.now().toString(),name,phone:$("phone").value.trim(),email:$("email").value.trim(),eircode,date:fmt(state.selectedDate),period:state.selectedSlot.time,duration:state.selectedSlot.duration,people:els.people.value==="6"?"6+":els.people.value,notes:$("notes").value.trim(),status:"New"};const reqs=getRequests();reqs.unshift(request);saveRequests(reqs);els.confirmName.textContent=name;els.confirmDate.textContent=fmt(state.selectedDate);els.confirmTime.textContent=`${state.selectedSlot.time} (${state.selectedSlot.duration})`;els.confirmPeople.textContent=request.people;els.confirmNotes.textContent=request.notes||"None";openModal()});
els.closeModal.addEventListener("click",()=>closeModal(true));els.modalDone.addEventListener("click",()=>closeModal(true));els.confirmationModal.addEventListener("click",e=>{if(e.target===els.confirmationModal)closeModal(true)});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!els.confirmationModal.hidden)closeModal()});

const DEFAULT_PRICING={fullDay:400,morning:250,afternoon:250,evening:250,travel0:0,travel20:25,travel50:50,travel100:100};
const DEMO_DISTANCES={"E45DEMO":8,"E21DEMO":24,"V94DEMO":58,"H91DEMO":112};
let pricing=JSON.parse(localStorage.getItem("teeBoxPricing")||"null")||{...DEFAULT_PRICING};
function saveRequests(list){localStorage.setItem("teeBoxQuoteRequests",JSON.stringify(list))}
function getRequests(){return JSON.parse(localStorage.getItem("teeBoxQuoteRequests")||"[]")}
function updatePricingInputs(){["fullDay","morning","afternoon","evening","travel0","travel20","travel50","travel100"].forEach(k=>{const el=$("price"+k.charAt(0).toUpperCase()+k.slice(1))||$(k);if(el)el.value=pricing[k]})}
function travelCost(km){if(km<=20)return pricing.travel0;if(km<=50)return pricing.travel20;if(km<=100)return pricing.travel50;return pricing.travel100}
function priceKey(period){return period==="Full Day"?"fullDay":period.toLowerCase()}
function normaliseEircode(v){return v.trim().toUpperCase().replace(/\s+/g,"")}
function demoDistance(e){return DEMO_DISTANCES[normaliseEircode(e)]??null}
function showTravel(km){const cost=travelCost(km);$("travelResult").innerHTML=`<strong>${km} km estimated travel distance</strong><span>Travel charge from the configured band: €${cost}.</span>`;return {km,cost}}
async function calculateTravel(){
 const customer=$("travelEircode").value.trim(), base=$("baseEircode").value.trim()||"E45 WC97";
 if(!customer){$("travelResult").innerHTML='<strong>Select a quote request first.</strong><span>The customer Eircode is brought in automatically from the quote request.</span>';return null}
 const demo=demoDistance(customer);
 if(demo!==null)return showTravel(demo);
 $("travelResult").innerHTML='<strong>Calculating route distance…</strong><span>Looking up the customer Eircode and calculating the driving route.</span>';
 try{
   const geocode=async e=>{
     const url="https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=ie&q="+encodeURIComponent(e+", Ireland");
     const r=await fetch(url,{headers:{Accept:"application/json"}});
     if(!r.ok)throw new Error("Geocoding failed");
     const data=await r.json();
     if(!data.length)throw new Error("Eircode not found");
     return {lat:+data[0].lat,lon:+data[0].lon};
   };
   const [a,b]=await Promise.all([geocode(base),geocode(customer)]);
   const routeUrl=`https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`;
   const rr=await fetch(routeUrl);
   if(!rr.ok)throw new Error("Routing failed");
   const rd=await rr.json();
   if(!rd.routes?.length)throw new Error("No route found");
   const km=Math.round(rd.routes[0].distance/1000);
   return showTravel(km);
 }catch(err){
   $("travelResult").innerHTML='<strong>Route distance could not be calculated</strong><span>The production version should perform this lookup in the secure backend. Check the Eircode and try again.</span>';
   return null;
 }
}
$("officeLoginForm").addEventListener("submit",e=>{e.preventDefault();if($("officeUsername").value==="office"&&$("officePassword").value==="teebox"){ $("officeLogin").hidden=true;$("officeDashboard").hidden=false;populatePricing();renderOffice()}else $("officeLoginMessage").innerHTML='<span style="color:var(--gold)">Incorrect username or password.</span>'});
$("officeLogout").addEventListener("click",()=>{$("officeDashboard").hidden=true;$('officeLogin').hidden=false;$('officePassword').value=""});
$("savePricing").addEventListener("click",()=>{pricing={fullDay:+$("priceFullDay").value||0,morning:+$("priceMorning").value||0,afternoon:+$("priceAfternoon").value||0,evening:+$("priceEvening").value||0,travel0:+$("travel0").value||0,travel20:+$("travel20").value||0,travel50:+$("travel50").value||0,travel100:+$("travel100").value||0};localStorage.setItem("teeBoxPricing",JSON.stringify(pricing));$("pricingSaved").textContent="Pricing saved on this device."});
$("calculateTravel").addEventListener("click",()=>{
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
 if(!result){
   $("quoteCalculation").innerHTML=`<strong>${r.name} · ${r.period}</strong><span>Session price: €${session}</span><span>Customer Eircode: ${r.eircode}</span><span>Travel cost could not be calculated.</span>`;
   return;
 }
 $("quoteCalculation").innerHTML=`<strong>${r.name} · ${r.period}</strong><span>Session price: €${session}</span><span>Route distance: ${result.km} km</span><span>Travel charge: €${result.cost}</span><span><strong>Estimated quote total: €${session+result.cost}</strong></span>`;
});

renderCalendar();renderSlots();
})();
