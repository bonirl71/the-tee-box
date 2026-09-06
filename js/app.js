/* THE TEE BOX — REV 1.1.1 */
(() => {
"use strict";
const state={viewDate:new Date(),selectedDate:null,selectedSlot:null};
const SLOTS=[{time:"10:00",duration:"1 hour"},{time:"12:00",duration:"1 hour"},{time:"14:00",duration:"1 hour"},{time:"16:00",duration:"1 hour"},{time:"18:00",duration:"1 hour"},{time:"20:00",duration:"1 hour"}];
const $=id=>document.getElementById(id);
const els={menuToggle:$("menuToggle"),mainNav:$("mainNav"),calendarMonth:$("calendarMonth"),calendarGrid:$("calendarGrid"),prevMonth:$("prevMonth"),nextMonth:$("nextMonth"),selectedDateLabel:$("selectedDateLabel"),slotGrid:$("slotGrid"),bookingForm:$("bookingForm"),people:$("people"),durationDisplay:$("durationDisplay"),summaryDate:$("summaryDate"),summaryTime:$("summaryTime"),summaryPeople:$("summaryPeople"),confirmationModal:$("confirmationModal"),closeModal:$("closeModal"),modalDone:$("modalDone"),confirmName:$("confirmName"),confirmDate:$("confirmDate"),confirmTime:$("confirmTime"),confirmPeople:$("confirmPeople")};
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
function selectDate(d){state.selectedDate=new Date(d);state.selectedSlot=null;els.selectedDateLabel.textContent=fmt(d);els.summaryDate.textContent=fmt(d);els.summaryTime.textContent="Not selected";els.durationDisplay.value="Select a time slot";renderCalendar();renderSlots()}
function renderSlots(){els.slotGrid.innerHTML="";if(!state.selectedDate){els.slotGrid.innerHTML='<p class="empty-state">Choose an available date to see session times.</p>';return}SLOTS.forEach(s=>{const b=document.createElement("button");b.type="button";b.className="slot";if(state.selectedSlot&&state.selectedSlot.time===s.time)b.classList.add("selected");b.innerHTML=`<strong>${s.time}</strong><span>${s.duration}</span>`;b.addEventListener("click",()=>selectSlot(s));els.slotGrid.appendChild(b)})}
function selectSlot(s){state.selectedSlot=s;els.summaryTime.textContent=s.time;els.durationDisplay.value=s.duration;renderSlots()}
function closeMenu(){els.mainNav.classList.remove("open");els.menuToggle.setAttribute("aria-expanded","false")}
function resetBooking(){
  state.selectedDate=null;
  state.selectedSlot=null;
  els.bookingForm.reset();
  els.summaryDate.textContent="Not selected";
  els.summaryTime.textContent="Not selected";
  els.summaryPeople.textContent="2";
  els.durationDisplay.value="Select a time slot";
  els.selectedDateLabel.textContent="Select a date";
  renderCalendar();
  renderSlots();
}
function closeModal(reset=false){
  els.confirmationModal.hidden=true;
  document.body.style.overflow="";
  if(reset){
    resetBooking();
    document.getElementById("booking").scrollIntoView({behavior:"smooth",block:"start"});
  }
}
function openModal(){els.confirmationModal.hidden=false;document.body.style.overflow="hidden";els.modalDone.focus()}
els.menuToggle.addEventListener("click",()=>{const open=els.mainNav.classList.toggle("open");els.menuToggle.setAttribute("aria-expanded",String(open))});
els.mainNav.querySelectorAll("a").forEach(a=>a.addEventListener("click",closeMenu));
els.prevMonth.addEventListener("click",()=>{state.viewDate=new Date(state.viewDate.getFullYear(),state.viewDate.getMonth()-1,1);renderCalendar()});
els.nextMonth.addEventListener("click",()=>{state.viewDate=new Date(state.viewDate.getFullYear(),state.viewDate.getMonth()+1,1);renderCalendar()});
els.people.addEventListener("change",()=>els.summaryPeople.textContent=els.people.value);
els.bookingForm.addEventListener("submit",e=>{e.preventDefault();if(!state.selectedDate||!state.selectedSlot){alert("Please select an available date and time before requesting a booking.");return}const name=$("name").value.trim();if(!name)return;els.confirmName.textContent=name;els.confirmDate.textContent=fmt(state.selectedDate);els.confirmTime.textContent=`${state.selectedSlot.time} (${state.selectedSlot.duration})`;els.confirmPeople.textContent=els.people.value==="6"?"6+":els.people.value;openModal()});
els.closeModal.addEventListener("click",()=>closeModal(true));els.modalDone.addEventListener("click",()=>closeModal(true));els.confirmationModal.addEventListener("click",e=>{if(e.target===els.confirmationModal)closeModal(true)});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!els.confirmationModal.hidden)closeModal()});
renderCalendar();renderSlots();
})();
