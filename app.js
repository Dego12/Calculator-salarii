/* Simple Romania salary calculator (configurable).
   DISCLAIMER: Rates may change. Update config.json. */
async function loadConfig() {
  const res = await fetch('config.json');
  const cfg = await res.json();
  console.log(cfg)
  return cfg;
}

function fmt(n){ if(Number.isNaN(n)) return '—'; return new Intl.NumberFormat('ro-RO', {maximumFractionDigits:2}).format(n); }

function calcFromGross(gross, rates, personalDeduction=0){
  const CAS = gross * (rates.cas/100);
  const CASS = gross * (rates.cass/100);
  const base = Math.max(0, gross - CAS - CASS - personalDeduction);
  const tax = base * (rates.tax/100);
  const net = gross - CAS - CASS - tax;
  const cam = gross * (rates.employer/100);
  const employerCost = gross + cam;
  return {gross, CAS, CASS, base, tax, net, cam, employerCost};
}

// Find gross from desired net using iterative approximation
function calcGrossFromNet(targetNet, rates, personalDeduction=0){
  // initial guess
  let low = 0, high = targetNet * 5 + 10000; // broad upper bound
  for (let i=0;i<60;i++){
    const mid = (low + high)/2;
    const r = calcFromGross(mid, rates, personalDeduction);
    if (r.net < targetNet) low = mid; else high = mid;
  }
  return calcFromGross(high, rates, personalDeduction);
}

function populateYears(cfg){
  const sel = document.getElementById('year');
  sel.innerHTML = '';
  Object.keys(cfg.years).sort().forEach(y => {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    sel.appendChild(opt);
  });
  // default to latest
  sel.value = Object.keys(cfg.years).sort().slice(-1)[0];
  applyYear(cfg);
}

function applyYear(cfg){
  const y = document.getElementById('year').value;
  const rates = cfg.years[y];
  document.getElementById('configYear').textContent = `(config ${y})`;
  document.getElementById('cas').value = rates.cas;
  document.getElementById('cass').value = rates.cass;
  document.getElementById('tax').value = rates.tax;
  document.getElementById('employer').value = rates.employer;
}

function getRates(){
  return {
    cas: parseFloat(document.getElementById('cas').value || '0'),
    cass: parseFloat(document.getElementById('cass').value || '0'),
    tax: parseFloat(document.getElementById('tax').value || '0'),
    employer: parseFloat(document.getElementById('employer').value || '0')
  };
}

function render(res){
  document.getElementById('outGross').textContent = fmt(res.gross);
  document.getElementById('outCAS').textContent = fmt(res.CAS);
  document.getElementById('outCASS').textContent = fmt(res.CASS);
  document.getElementById('outBase').textContent = fmt(res.base);
  document.getElementById('outTax').textContent = fmt(res.tax);
  document.getElementById('outNet').textContent = fmt(res.net);
  document.getElementById('outCAM').textContent = fmt(res.cam);
  document.getElementById('outEmployerCost').textContent = fmt(res.employerCost);
}

async function main(){
  const cfg = await loadConfig();
  populateYears(cfg);

  document.getElementById('year').addEventListener('change', () => applyYear(cfg));
  document.getElementById('calcBtn').addEventListener('click', () => {
    const type = document.getElementById('calcType').value;
    const amount = parseFloat(document.getElementById('amount').value || '0');
    const personalDeduction = parseFloat(document.getElementById('personalDeduction').value || '0');
    const rates = getRates();

    if (amount <= 0){
      alert('Introduce o sumă validă.');
      return;
    }

    let res;
    if (type === 'gross_to_net'){
      res = calcFromGross(amount, rates, personalDeduction);
    } else {
      res = calcGrossFromNet(amount, rates, personalDeduction);
    }
    render(res);
  });

  document.getElementById('yearNow').textContent = new Date().getFullYear();
}

main();
