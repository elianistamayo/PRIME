// PRIME - booking.js
// Un solo modal; los datos cambian según data-court del botón.
(function () {
  // ====== SUPABASE ======
  const SUPABASE_URL = 'https://wpxubughlgccoazfbazh.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_mUWo-fARNnfj4mFQ4bpoGQ_Cigsm_A-'; // clave anon / publishable (NUNCA la service_role)
  const sb = (window.supabase && !SUPABASE_KEY.startsWith('PEGA'))
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
  if (!sb) console.warn('Supabase no está configurado: las reservas no se guardarán.');
  const COURTS = {
    pool: {
      name: 'La Chorrera Municipal Pool', loc: 'La Chorrera, Panama West',
      img: 'pool.jpg', price: 25, sport: 'Swimming Pool', rating: 4.6,
      on: ['9:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '5:00 PM'],
      off: ['10:00 AM', '1:00 PM', '4:00 PM'] // 1:00 PM tachado como en tu captura
    },
    volley: {
      name: 'La Chorrera Volley Court', loc: 'La Chorrera, Panama West',
      img: 'volley.jpg', price: 40, sport: 'Volleyball', rating: 4.7,
      on: ['8:00 AM', '9:00 AM', '11:00 AM', '12:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'],
      off: ['10:00 AM', '4:00 PM']
    },
    turf: {
      name: 'La Chorrera Turf Pitch', loc: 'La Chorrera, Panama West',
      img: 'turf.jpg', price: 28, sport: '5-a-side Soccer', rating: 4.8,
      on: ['7:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '8:00 PM', '9:00 PM'],
      off: ['8:00 AM', '7:00 PM']
    }
  };

  const mins = t => {
    const [h, rest] = t.split(':'), m = +rest.slice(0, 2), pm = rest.includes('PM');
    return ((+h % 12) + (pm ? 12 : 0)) * 60 + m;
  };

  // Construir el modal una sola vez
  const ov = document.createElement('div');
  ov.className = 'bk-ov';
  ov.innerHTML = `
    <div class="bk-md" role="dialog" aria-modal="true" aria-labelledby="bk-name">
      <div class="bk-img" id="bk-img"></div>
      <button class="bk-x" id="bk-x" aria-label="Close">✕</button>
      <div class="bk-bd">
        <h3 id="bk-name"></h3>
        <div class="bk-loc" id="bk-loc"></div>
        <div class="bk-info">
          <div><small>Price per hour</small><b id="bk-price"></b></div>
          <div class="r"><small>Sport</small><b id="bk-sport"></b></div>
        </div>
        <div class="bk-lb">AVAILABILITY</div>
        <div class="bk-days" id="bk-days"></div>
        <div class="bk-slots" id="bk-slots"></div>
        <button class="bk-ok" id="bk-ok" disabled>Select a time slot</button>
        <div class="bk-ft">Free cancellation up to 2 hours before</div>
      </div>
    </div>`;
  document.body.appendChild(ov);

  const $ = id => document.getElementById(id);
  let court = null, courtKey = null, day = 'Today', slot = null, taken = new Set(), busy = false;

  // Fechas: Today, Tomorrow y el tercer día con su fecha real
  const d3 = new Date(); d3.setDate(d3.getDate() + 2);
  const DAYS = ['Today', 'Tomorrow',
    d3.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + d3.getDate()];

  const dateISO = d => {
    const o = DAYS.indexOf(d), x = new Date(); x.setDate(x.getDate() + o);
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  };

  // Lee de Supabase los horarios ya reservados de esta cancha y fecha
  async function loadTaken() {
    taken = new Set();
    if (!sb) return;
    const k = courtKey + day;
    const { data, error } = await sb.from('bookings').select('time_slot')
      .eq('court', courtKey).eq('booking_date', dateISO(day));
    if (k !== courtKey + day) return; // el usuario ya cambió de cancha/fecha
    if (error) { console.error(error); return; }
    taken = new Set(data.map(r => r.time_slot));
    if (slot && taken.has(slot)) slot = null;
    renderSlots(); updateOk();
  }

  function renderDays() {
    $('bk-days').innerHTML = '';
    DAYS.forEach(d => {
      const b = document.createElement('button');
      b.textContent = d;
      b.className = d === day ? 'on' : '';
      b.onclick = () => { day = d; slot = null; taken = new Set(); renderDays(); renderSlots(); updateOk(); loadTaken(); };
      $('bk-days').appendChild(b);
    });
  }

  function renderSlots() {
    const all = court.on.map(t => ({ t, ok: true }))
      .concat(court.off.map(t => ({ t, ok: false })))
      .sort((a, b) => mins(a.t) - mins(b.t));
    $('bk-slots').innerHTML = '';
    all.forEach(({ t, ok }) => {
      const b = document.createElement('button');
      b.textContent = t;
      b.disabled = !ok || taken.has(t);
      if (ok && !taken.has(t)) b.onclick = () => { slot = t; renderSlots(); updateOk(); };
      if (t === slot) b.className = 'on';
      $('bk-slots').appendChild(b);
    });
  }

  function updateOk() {
    const b = $('bk-ok');
    b.disabled = !slot;
    b.classList.toggle('ready', !!slot);
    b.textContent = slot ? `Confirm ${slot} · ${day}` : 'Select a time slot';
  }

  function open(key) {
    court = COURTS[key];
    if (!court) return;
    courtKey = key; day = 'Today'; slot = null; taken = new Set();
    $('bk-img').style.backgroundImage = `url('${court.img}')`;
    $('bk-name').textContent = court.name;
    $('bk-loc').textContent = `${court.loc} · ★ ${court.rating}`;
    $('bk-price').textContent = '$' + court.price;
    $('bk-sport').textContent = court.sport;
    renderDays(); renderSlots(); updateOk();
    ov.classList.add('open');
    loadTaken();
    document.body.classList.add('bk-lock');
  }

  function close() {
    ov.classList.remove('open');
    document.body.classList.remove('bk-lock');
  }

  $('bk-x').onclick = close;
  ov.onclick = e => { if (e.target === ov) close(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  $('bk-ok').onclick = async () => {
    if (!slot || busy) return;
    if (!sb) { alert('Falta configurar la clave de Supabase en booking.js'); return; }
    busy = true; $('bk-ok').textContent = 'Saving...';
    const { error } = await sb.from('bookings')
      .insert({ court: courtKey, booking_date: dateISO(day), time_slot: slot });
    busy = false;
    if (error) {
      if (error.code === '23505') alert('Ese horario acaba de ser reservado. Elige otro.');
      else { console.error(error); alert('No se pudo guardar la reserva. Intenta de nuevo.'); }
      slot = null; await loadTaken(); renderSlots(); updateOk();
      return;
    }
    alert(`Reserva registrada\n${court.name}\n${day} · ${slot} · $${court.price}`);
    close();
  };

  document.querySelectorAll('[data-court]').forEach(btn =>
    btn.addEventListener('click', () => open(btn.dataset.court)));
})();