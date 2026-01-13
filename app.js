const LS_KEY = 'truco_anotador_v1'

const defaultState = () => ({
  teams: [ { name: 'Nosotros', score: 0 }, { name: 'Ellos', score: 0 } ],
  history: [],
  target: 30
})

let state = loadState()

// DOM
const scoreEls = [document.getElementById('score-0'), document.getElementById('score-1')]
const nameInputs = Array.from(document.querySelectorAll('.team-name'))
// if page-history list removed, fall back to modal list
const historyList = document.getElementById('history-list') || document.getElementById('modal-history-list')
const targetInput = document.getElementById('target')

function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY)
    if(raw) return JSON.parse(raw)
  }catch(e){console.warn('No se pudo leer storage',e)}
  return defaultState()
}

function saveState(){
  localStorage.setItem(LS_KEY, JSON.stringify(state))
}

function render(){
  state.teams.forEach((t,i)=>{
    scoreEls[i].textContent = t.score
    nameInputs[i].value = t.name
  })
  if(targetInput) targetInput.value = state.target
  renderHistory()
  updateTally()
}

function pushHistory(entry){
  // attach the current total score for the team to the history entry
  if(typeof entry.team === 'number'){
    entry.total = state.teams[entry.team]?.score ?? null
  }
  state.history.unshift(entry)
  if(state.history.length>200) state.history.pop()
}

function addPoints(teamIndex, pts){
  const before = JSON.parse(JSON.stringify(state))
  state.teams[teamIndex].score = Math.max(0, state.teams[teamIndex].score + pts)
  pushHistory({time: Date.now(), team: teamIndex, pts})
  saveState()
  render()
  checkWinner()
  state._lastBefore = before
}

function undo(){
  if(state._lastBefore){
    state = state._lastBefore
    delete state._lastBefore
    saveState()
    render()
  } else if(state.history.length){
    const last = state.history.shift()
    state.teams[last.team].score -= last.pts
    saveState()
    render()
  }
}

function reset(){
  state = defaultState()
  saveState()
  render()
}

function renderHistory(){
  historyList.innerHTML = ''
  state.history.forEach(h=>{
    const li = document.createElement('li')
    const t = new Date(h.time).toLocaleTimeString()
    const teamName = state.teams[h.team]?.name || `Equipo ${h.team+1}`
    const ptsText = h.pts>0 ? `+${h.pts}` : `${h.pts}`
    // if history entry has no stored total (older entries), compute total at that point
    let total = (h.total !== undefined && h.total !== null) ? h.total : null
    if(total === null){
      total = computeTotalAtHistoryEntry(h)
    }
    li.textContent = `${t} — ${teamName}: ${ptsText} (total ${total})`
    historyList.appendChild(li)
  })
}

function checkWinner(){
  const tgt = Number(state.target)
  state.teams.forEach((t,i)=>{
    if(t.score>=tgt){
      // prevent multiple modals if already shown
      if(!state._winnerShown){
        state._winnerShown = true
        setTimeout(()=> openWinModal(i),50)
      }
    }
  })
}

// Win modal handling
const winModal = document.getElementById('win-modal')
const winTitle = document.getElementById('win-title')
const winMessage = document.getElementById('win-message')
const winYes = document.getElementById('win-yes')
const winNo = document.getElementById('win-no')

function openWinModal(teamIdx){
  const team = state.teams[teamIdx]
  if(!winModal) return
  winTitle.textContent = `${team.name} ganó el partido`
  winMessage.textContent = '¿Jugamos de nuevo?'
  winModal.setAttribute('aria-hidden','false')
}

function closeWinModal(){
  if(!winModal) return
  winModal.setAttribute('aria-hidden','true')
  state._winnerShown = false
}

function newGameKeepNames(){
  // Clear scores and history, keep team names
  state.history = []
  state.teams.forEach(t => t.score = 0)
  saveState()
  render()
  closeWinModal()
}

if(winYes) winYes.addEventListener('click', ()=>{ newGameKeepNames() })
if(winNo) winNo.addEventListener('click', ()=>{ closeWinModal() })

// Listeners
document.querySelectorAll('[data-add]').forEach(btn=>{
  btn.addEventListener('click', e=>{
    const pts = Number(btn.dataset.add)
    const teamEl = btn.closest('.team')
    const idx = Number(teamEl.dataset.team)
    addPoints(idx, pts)
  })
})

nameInputs.forEach((inp,i)=>{
  inp.addEventListener('input', ()=>{
    state.teams[i].name = inp.value || (`Equipo ${i+1}`)
    saveState()
    renderHistory()
  })

  // click header to focus and select the input (make clear it's editable)
  const teamEl = inp.closest('.team')
  if(teamEl){
    const header = teamEl.querySelector('.team-header')
    if(header){
      header.style.cursor = 'text'
      header.addEventListener('click', ()=>{
        inp.focus()
        try{ inp.select() }catch(e){}
      })
    }
  }

  // keyboard shortcuts: Enter to save/blur, Escape to revert
  inp.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      e.preventDefault()
      inp.blur()
    } else if(e.key === 'Escape'){
      inp.value = state.teams[i].name || (`Equipo ${i+1}`)
      inp.blur()
    }
  })

  // ensure changes persist on blur
  inp.addEventListener('blur', ()=>{
    state.teams[i].name = inp.value || (`Equipo ${i+1}`)
    saveState()
    renderHistory()
  })
})

// Menu toggle and menu action bindings
const menuToggle = document.getElementById('menu-toggle')
const sideMenu = document.getElementById('side-menu')
const menuClose = document.getElementById('menu-close')
const menuUndo = document.getElementById('menu-undo')
const menuReset = document.getElementById('menu-reset')
const menuHistoryBtn = document.getElementById('menu-history')

if(menuToggle){
  menuToggle.addEventListener('click', ()=>{ if(sideMenu) sideMenu.setAttribute('aria-hidden','false') })
}
if(menuClose){
  menuClose.addEventListener('click', ()=>{ if(sideMenu) sideMenu.setAttribute('aria-hidden','true') })
}
if(menuUndo){
  menuUndo.addEventListener('click', ()=>{ undo(); if(sideMenu) sideMenu.setAttribute('aria-hidden','true') })
}
if(menuReset){
  menuReset.addEventListener('click', ()=>{ if(confirm('Reiniciar puntajes?')){ reset(); if(sideMenu) sideMenu.setAttribute('aria-hidden','true') } })
}
if(menuHistoryBtn){
  menuHistoryBtn.addEventListener('click', ()=>{ openHistory(); if(sideMenu) sideMenu.setAttribute('aria-hidden','true') })
}

if(targetInput){
  targetInput.addEventListener('change', ()=>{ state.target = Number(targetInput.value) || 30; saveState() })
}

// export/import buttons were removed from the UI; continue with modal history behavior

const modal = document.getElementById('history-modal')
const modalList = document.getElementById('modal-history-list')
const openHistoryBtn = document.getElementById('open-history')
const closeHistoryBtn = document.getElementById('close-history')

function openHistory(){
  modal.setAttribute('aria-hidden','false')
  renderModalHistory()
}
function closeHistory(){
  modal.setAttribute('aria-hidden','true')
}

if(openHistoryBtn) openHistoryBtn.addEventListener('click', openHistory)
if(closeHistoryBtn) closeHistoryBtn.addEventListener('click', closeHistory)
if(modal){
  const bd = modal.querySelector('.modal-backdrop')
  if(bd) bd.addEventListener('click', closeHistory)
}

function renderModalHistory(){
  modalList.innerHTML = ''
  state.history.forEach((h, idx)=>{
    const li = document.createElement('li')
    const label = document.createElement('div')
    label.className = 'hist-label'
    label.textContent = h.pts>0?'+':(h.pts<0?'-':'N')
    label.classList.add(h.pts>0? 'hist-sum':'hist-rest')

    const txt = document.createElement('div')
    const teamName = state.teams[h.team]?.name || `Equipo ${h.team+1}`
    let total = (h.total !== undefined && h.total !== null) ? h.total : null
    if(total === null){
      total = computeTotalAtHistoryEntry(h)
    }
    txt.innerHTML = `<strong>${h.pts>0? 'SUMA':'RESTA'}</strong> ${h.pts>0? '+'+h.pts: h.pts} (<em>${teamName}</em>) <span class="hist-total">total ${total}</span>`

    const meta = document.createElement('div')
    meta.className = 'hist-meta'
    meta.textContent = new Date(h.time).toLocaleTimeString()

    li.appendChild(label)
    li.appendChild(txt)
    li.appendChild(meta)
    modalList.appendChild(li)
  })
}

// Compute the total score that the team had at the moment of this history entry.
// If the entry already stores `.total` we can use it; otherwise reconstruct by
// summing history entries from oldest up to (and including) this one for the same team.
function computeTotalAtHistoryEntry(entry){
  if(entry && entry.total !== undefined && entry.total !== null) return entry.total
  const hist = state.history || []
  // Find the index of this entry instance in the history array (by time + team + pts)
  let idx = -1
  for(let i=hist.length-1;i>=0;i--){
    const h = hist[i]
    if(h.time === entry.time && h.team === entry.team && h.pts === entry.pts){ idx = i; break }
  }
  // If not found, as a fallback compute total by summing all history for that team
  if(idx === -1) idx = hist.length-1

  // Sum from oldest (end of array) up to idx (inclusive)
  let total = 0
  for(let i=hist.length-1; i>=idx; i--){
    const h = hist[i]
    if(h.team === entry.team) total += Number(h.pts)
  }
  // Also add any initial score stored in state if history doesn't cover it
  // (assume default 0 otherwise)
  const initial = 0
  return initial + total
}

// Usa directamente los archivos SVG de la carpeta assets
function getPapafritaSVG(idx, position){
  const num = (idx % 5) + 1;
  // Usar SVG horizontal para top y bottom
  if(position === 'top' || position === 'bottom') {
    return `<img src="assets/papafrita-horizontal.svg" alt="papafrita" style="width:100%;height:100%">`;
  }
  return `<img src="assets/papafrita${num}.svg" alt="papafrita" style="width:100%;height:100%">`;
}

// Tally (fosforos) helpers
function buildTallies(){
  // Build tallies based on current score so matches appear as points increase
  const max = Number(state.target) || 30
  document.querySelectorAll('.tally').forEach((tally, teamIdx)=>{
    tally.innerHTML = ''

    const score = state.teams[teamIdx]?.score || 0
    const target = Number(state.target) || 30
    const totalGroups = Math.max(6, Math.ceil(target / 5))
    for(let g=0; g<totalGroups; g++){
      const grp = document.createElement('div')
      grp.className = 'group'
      grp.dataset.g = g
      const startIdx = g*5
      const filledInGroup = Math.max(0, Math.min(5, score - startIdx))

      // Renderizar papafritas en marco cuadrado: top, right, bottom, left, diagonal
      const positions = ['top', 'right', 'bottom', 'left', 'diag'];
      for(let j=0; j<5; j++){
        const idx = startIdx + j;
        const pos = positions[j];
        const papa = document.createElement('div');
        papa.className = 'papa papa-' + pos;
        if(j < filledInGroup) {
          papa.classList.add('filled');
          const svgIdx = idx % 5;
          papa.innerHTML = getPapafritaSVG(svgIdx, pos);
        }
        grp.appendChild(papa);
      }

      // if fully filled, add a class to style the diagonal strongly
      if(filledInGroup >= 5) grp.classList.add('cross')
      tally.appendChild(grp)
      
      // Agregar línea divisoria después del grupo que contiene el punto 15
      const groupEndPoint = (g + 1) * 5;
      if(groupEndPoint === 15) {
        const divider = document.createElement('div');
        divider.className = 'tally-divider';
        tally.appendChild(divider);
      }
    }
    // no height adjustment: allow .tally to grow so groups keep fixed size
    // remember last rendered score for this tally
    tally.dataset._lastScore = score
  })
}

function updateTally(){
  state.teams.forEach((t,i)=>{
    const el = document.getElementById('tally-'+i)
    if(!el) return
    const prev = el.dataset._lastScore ? Number(el.dataset._lastScore) : 0
    if(prev !== t.score){
      buildTallies()
    }
  })
}

// Attach tally click handlers (touch-friendly)
function initTallyListeners(){
  document.querySelectorAll('.tally').forEach(t=>{
    t.addEventListener('click', ()=>{
      const idx = Number(t.dataset.team)
      addPoints(idx, 1)
    })
  })
}

// Inicializar
buildTallies()
initTallyListeners()
render()
