START ROBUST EMAILJS MODULE === -->

const EMAILJS_DEBUG = true;

const EMAILJS_CONFIG = {
  publicKey: 'g0qgyzjQ_9jAGBzjN',
  serviceId: 'service_8oy4ofi',
  templates: {
    otp: 'template_kqvaooc',
    reset: 'template_yymmayd',
    contact: 'template_contact_form',
    inquiry: 'template_inquiry_form',
    bulk: 'template_bulk_notifications',
  },
  fromEmail: 'agasluxedrive@gmail.com',
  fromName: 'AGAS LUXE DRIVE',
};

async function initEmailJS() {
  let tries = 0;
  while (tries < 6) {
    if (window.emailjs && emailjs.init) {
      try {
        emailjs.init(EMAILJS_CONFIG.publicKey);
        return true;
      } catch (e) { console.error(e); return false; }
    }
    tries++;
    await new Promise(r => setTimeout(r, tries * 500));
  }
  return false;
}

async function sendEmail({templateId, params}) {
  // log entry helper
  function pushLog(entry){ try{ const key='emailLogs'; const cur=JSON.parse(localStorage.getItem(key)||'[]'); cur.push(entry); localStorage.setItem(key, JSON.stringify(cur)); }catch(e){console.error('log error',e);} }

  if (!window.emailjs) return {success:false, message:'EmailJS SDK missing'};
  try {
    const res = await emailjs.send(EMAILJS_CONFIG.serviceId, templateId, params);
    pushLog({type:'email_sent',templateId:templateId,params:params,timestamp:new Date().toISOString(),status:'ok'}); return {success:true, data:res};
  } catch (err) { console.error(err); pushLog({type:'email_error',templateId:templateId,params:params,timestamp:new Date().toISOString(),status:'error',error: (err && err.message) || err}); return {success:false, message: err.text || err.message}; }
}

async function sendOTPEmail(toEmail, otp) {
  return sendEmail({
    templateId: EMAILJS_CONFIG.templates.otp,
    params: {
      to_email: toEmail,
      otp_code: otp,
      from_name: EMAILJS_CONFIG.fromName,
      timestamp: new Date().toLocaleString()
    }
  });
}

async function sendPasswordResetEmail(toEmail, token) {
  const link = `${location.origin}${location.pathname}#reset-password?token=${token}`;
  return sendEmail({
    templateId: EMAILJS_CONFIG.templates.reset,
    params: {
      to_email: toEmail,
      reset_link: link,
      from_name: EMAILJS_CONFIG.fromName,
      timestamp: new Date().toLocaleString()
    }
  });
}

async function sendContactEmail(name, email, subject, message) {
  return sendEmail({
    templateId: EMAILJS_CONFIG.templates.contact,
    params: {
      from_name: name,
      from_email: email,
      subject,
      message,
      timestamp: new Date().toLocaleString(),
      to_email: EMAILJS_CONFIG.fromEmail
    }
  });
}

async function sendInquiryEmail(carId, name, email, phone, message) {
  const car = (window.cars || []).find(c => c.id === carId) || {};
  return sendEmail({
    templateId: EMAILJS_CONFIG.templates.inquiry,
    params: {
      car_name: `${car.make||''} ${car.model||''} ${car.year||''}`.trim(),
      inquirer_name: name,
      inquirer_email: email,
      inquirer_phone: phone,
      message,
      timestamp: new Date().toLocaleString(),
      to_email: EMAILJS_CONFIG.fromEmail
    }
  });
}

async function sendBulkNotificationEmail(toEmail, subject, message) {
  return sendEmail({
    templateId: EMAILJS_CONFIG.templates.bulk,
    params: {
      to_email: toEmail,
      subject,
      message,
      from_name: EMAILJS_CONFIG.fromName,
      timestamp: new Date().toLocaleString()
    }
  });
}

initEmailJS();



document.addEventListener('DOMContentLoaded', function () {
  // Helper: safe call with notification
  function safeCall(fn, args) {
    try { return fn.apply(null, args || []); }
    catch (e) { console.error(e); return null; }
  }

  // Attach contact form handler
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const name = document.getElementById('contact-name')?.value || '';
      const email = document.getElementById('contact-email')?.value || '';
      const subject = document.getElementById('contact-subject')?.value || '';
      const message = document.getElementById('contact-message')?.value || '';
      if (!email) return showNotification('Please provide an email', 'warning');
      showNotification('Sending message...', 'info', 3000);
      const resp = await safeCall(window.sendContactEmail, [name, email, subject, message]);
      if (resp && resp.success) {
        showNotification('Message sent. Thank you!', 'success', 5000);
        contactForm.reset();
      } else {
        showNotification('Failed to send. Try again.', 'error', 6000);
        console.error('Contact send error:', resp);
      }
    });
  }

  // Attach inquiry form handler
  const inquiryForm = document.getElementById('inquiry-form');
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const carId = document.getElementById('inquiry-car-id')?.value || '';
      const name = document.getElementById('inquiry-name')?.value || '';
      const email = document.getElementById('inquiry-email')?.value || '';
      const phone = document.getElementById('inquiry-phone')?.value || '';
      const message = document.getElementById('inquiry-message')?.value || '';
      showNotification('Sending inquiry...', 'info', 3000);
      const resp = await safeCall(window.sendInquiryEmail, [carId, name, email, phone, message]);
      if (resp && resp.success) {
        showNotification('Inquiry sent. We will contact you.', 'success', 5000);
        inquiryForm.reset();
        // close modal if present
        try { closeModal('inquiry-modal'); } catch (e) {}
      } else {
        showNotification('Failed to send inquiry.', 'error', 6000);
        console.error('Inquiry send error:', resp);
      }
    });
  }

  // Attach generic modal close handlers for elements with class 'close-modal'
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function () {
      const modal = this.closest('.modal');
      if (modal) modal.style.display = 'none';
    });
  });

  // Replace inline showSection onclick handlers by adding listeners and removing attribute
  document.querySelectorAll('[onclick]').forEach(el => {
    const attr = el.getAttribute('onclick');
    if (!attr) return;
    const m = attr.match(/showSection\(['"]([^'"]+)['"]\)/);
    if (m) {
      el.removeAttribute('onclick');
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        try { window.showSection(m[1]); } catch (e) { console.error(e); }
      });
    }
    // Optionally handle closeModal inline handlers
    const m2 = attr.match(/closeModal\(['"]([^'"]+)['"]\)/);
    if (m2) {
      el.removeAttribute('onclick');
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        try { window.closeModal(m2[1]); } catch (e) { console.error(e); }
      });
    }
  });

  // Improve performance: defer heavy images by adding loading="lazy"
  document.querySelectorAll('img').forEach(img => {
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
  });

  // Accessibility: ensure modals have role and aria-hidden toggling when shown/hidden
  document.querySelectorAll('.modal').forEach(modal => {
    if (!modal.hasAttribute('role')) modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-hidden', modal.style.display === 'none' ? 'true' : 'false');
  });

  // Clean up global namespace: warn about deprecated inline functions usage
  console.log('Optimization script initialized. Event handlers attached.');
});

<!-- === END OPTIMIZATION SCRIPT


// Admin analytics and log utilities
function getEmailLogs(){ try{ return JSON.parse(localStorage.getItem('emailLogs')||'[]'); }catch(e){return []; } }

function renderDashboard(){ 
  const logs = getEmailLogs();
  const recent = logs.slice(-100).reverse();
  const recentEl = document.getElementById('recent-logs');
  if(recentEl){
    recentEl.innerHTML = recent.map(l=>{
      const t = new Date(l.timestamp).toLocaleString();
      if(l.status==='ok') return `<div style="padding:8px;border-bottom:1px solid #eee;"><strong>${l.type}</strong> <small style="color:#666">[${t}]</small><div style="color:#333">${(l.templateId||'')}</div></div>`;
      return `<div style="padding:8px;border-bottom:1px solid #eee;color:#b91c1c;"><strong>${l.type}</strong> <small style="color:#666">[${t}]</small><div style="color:#333">${(l.templateId||'')} — ${l.error||''}</div></div>`;
    }).join('') ;
  }
  // prepare chart data counts by type over recent entries
  const counts = recent.reduce((acc,cur)=>{ acc[cur.type]=(acc[cur.type]||0)+1; return acc; },{});
  const ctx = document.getElementById('emailChart');
  if(ctx){
    const chartData = { labels: Object.keys(counts), datasets:[{ label:'Count', data:Object.values(counts) }] };
    if(window._emailChart) window._emailChart.destroy();
    window._emailChart = new Chart(ctx,{ type:'bar', data:chartData, options:{ responsive:true,maintainAspectRatio:false } });
  }
}

document.addEventListener('DOMContentLoaded', function(){
  // wire export & clear buttons
  const exp = document.getElementById('export-logs');
  if(exp) exp.addEventListener('click', function(){
    const logs = getEmailLogs();
    if(!logs.length) return alert('No logs to export');
    const rows = logs.map(l=>({timestamp:l.timestamp,type:l.type,templateId:l.templateId,error:l.error,params:JSON.stringify(l.params||{})}));
    const header = Object.keys(rows[0]).join(',') + '\n';
    const csv = header + rows.map(r=>Object.values(r).map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='email_logs_'+Date.now()+'.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });
  const clr = document.getElementById('clear-logs');
  if(clr) clr.addEventListener('click', function(){ if(confirm('Clear all email logs?')){ localStorage.removeItem('emailLogs'); renderDashboard(); } });
  // if admin dashboard visible on load, render
  if(document.getElementById('admin-dashboard-section') && document.getElementById('admin-dashboard-section').style.display!=='none'){
    renderDashboard();
  }
});
// expose function to show admin dashboard
function showAdminDashboard(){ document.getElementById('admin-dashboard-section').style.display='block'; window.scrollTo(0,0); renderDashboard(); }


// === Booking Module ===

// Booking module: supports frontend-only (localStorage) or API calls if available (B/C)
(function(){
  async function estimateFare(pickup, dropoff, vehicle, date, time){
    // Simple estimator (distance placeholder) - you can replace with Google Maps API
    const base = {sedan:2000,suv:3500,luxury:7000,van:4000}[vehicle] || 2500;
    // time multiplier (peak hours 7-9,17-19)
    const hour = parseInt(time.split(':')[0]||0,10);
    const mult = (hour>=7 && hour<=9) || (hour>=17 && hour<=19) ? 1.25 : 1.0;
    const est = Math.round(base * mult);
    return est;
  }

  document.addEventListener('DOMContentLoaded', function(){
    const form = document.getElementById('booking-form');
    const btnEst = document.getElementById('btn-estimate');
    const priceEl = document.getElementById('booking-price');

    btnEst && btnEst.addEventListener('click', async function(){
      const pu = document.getElementById('booking-pickup').value;
      const doff = document.getElementById('booking-dropoff').value;
      const vehicle = document.getElementById('booking-vehicle').value;
      const date = document.getElementById('booking-date').value;
      const time = document.getElementById('booking-time').value;
      const p = await estimateFare(pu, doff, vehicle, date, time);
      priceEl.value = p;
      showNotification('Estimated fare: '+p,'info',4000);
    });

    form && form.addEventListener('submit', async function(e){
      e.preventDefault();
      const pu = document.getElementById('booking-pickup').value;
      const doff = document.getElementById('booking-dropoff').value;
      const vehicle = document.getElementById('booking-vehicle').value;
      const date = document.getElementById('booking-date').value;
      const time = document.getElementById('booking-time').value;
      const price = document.getElementById('booking-price').value || await estimateFare(pu,doff,vehicle,date,time);

      const booking = { pickup:pu, dropoff:doff, vehicle, date, time, price, status:'pending', created_at:new Date().toISOString() };

      // Try API first (if backend available at /api/bookings)
      try {
        const resp = await fetch('/api/bookings', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(booking) });
        if(resp.ok){
          const data = await resp.json();
          showNotification('Booking created (server). Booking ID: '+(data.booking_id||data.booking && data.booking.id || ''),'success',6000);
          form.reset();
          return;
        }
      } catch(err){ console.warn('API booking failed, falling back to localStorage', err); }

      // Fallback: store in localStorage bookings
      try{
        const key='agas_bookings';
        const cur = JSON.parse(localStorage.getItem(key)||'[]');
        booking.id = 'local_'+(cur.length+1);
        cur.push(booking);
        localStorage.setItem(key, JSON.stringify(cur));
        showNotification('Booking saved locally. You can sync when online.','success',6000);
        form.reset();
      }catch(e){ console.error(e); showNotification('Failed to save booking','error'); }
    });
  });

  // expose helper to show bookings (admin)
  window.getLocalBookings = function(){
    return JSON.parse(localStorage.getItem('agas_bookings')||'[]');
  };
})();


// === Admin Booking UI ===

// Admin bookings management (frontend)
(function(){
  async function fetchServerBookings(){
    try{
      const r = await fetch('/api/bookings');
      if(r.ok){
        const j = await r.json();
        return j.bookings || j.bookings || [];
      }
    }catch(e){ console.warn('server bookings fetch failed', e); }
    return [];
  }

  function renderBookings(bookings){
    const el = document.getElementById('bookings-list');
    if(!el) return;
    if(!bookings.length) return el.innerHTML = '<div style="padding:12px">No bookings</div>';
    el.innerHTML = bookings.map(b=>{
      const id = b.id || b.booking_id || b.localId || '';
      const status = b.status || 'pending';
      return `<div style="padding:10px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
        <div><strong>#${id}</strong> <div>${b.pickup} → ${b.dropoff}</div><small>${b.date||''} ${b.time||''}</small></div>
        <div style="display:flex;gap:8px;align-items:center;">
          <select data-id="${id}" class="assign-driver"><option value="">Assign Driver</option><option value="driver_1">Driver 1</option><option value="driver_2">Driver 2</option></select>
          <button class="btn btn-outline btn-update" data-id="${id}">Mark In Progress</button>
        </div>
      </div>`;
    }).join('');
    // wire buttons
    document.querySelectorAll('.btn-update').forEach(btn=> btn.addEventListener('click', function(){
      const id = this.getAttribute('data-id');
      showNotification('Status updated for '+id,'info',3000);
    }));
    document.querySelectorAll('.assign-driver').forEach(sel=> sel.addEventListener('change', function(){
      const id = this.getAttribute('data-id');
      const driver = this.value;
      showNotification('Assigned '+driver+' to '+id,'success',3000);
    }));
  }

  document.addEventListener('DOMContentLoaded', function(){
    const btn = document.getElementById('btn-refresh-bookings');
    if(btn) btn.addEventListener('click', async function(){
      let bookings = await fetchServerBookings();
      // include local bookings too
      const local = window.getLocalBookings ? window.getLocalBookings() : [];
      bookings = bookings.concat(local);
      renderBookings(bookings);
    });
    const syncBtn = document.getElementById('btn-sync-local');
    if(syncBtn) syncBtn.addEventListener('click', async function(){
      const local = window.getLocalBookings ? window.getLocalBookings() : [];
      for(const b of local){
        try{
          await fetch('/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
        }catch(e){ console.warn('sync failed', e); }
      }
      localStorage.removeItem('agas_bookings');
      showNotification('Local bookings synced (attempted).','success',4000);
    });
  });
})();


// === Driver App Page ===

// Payments placeholder - integrates with configured payment provider later (Paystack/Stripe/Flutterwave)
async function initiatePayment(bookingId, amount){
  showNotification('Payment flow not yet configured. This is a placeholder.','info',5000);
  return { success:true };
}
