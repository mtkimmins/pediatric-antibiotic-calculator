const antibioticCatalog = {
  amoxicillin: {
    name: 'Amoxicillin',
    indications: [
      { name: 'Dummy acute otitis media', dose: 45, doseUnit: 'mg', strength: 400, frequency: 2, frequencyUnit: 'times/day', duration: 7 },
      { name: 'Dummy streptococcal pharyngitis', dose: 50, doseUnit: 'mg', strength: 250, frequency: 1, frequencyUnit: 'times/day', duration: 10 }
    ],
    dailyDoseMgPerKg: 40, frequency: 2, route: 'PO', interval: '12 hourly',
    formulation: [
      { label: '125 mg/5 mL', concentration: 25, unit: 'mg/mL' },
      { label: '250 mg/5 mL', concentration: 50, unit: 'mg/mL' },
      { label: '500 mg capsule', concentration: 500, unit: 'mg/capsule' },
      { label: '875 mg tablet', concentration: 875, unit: 'mg/tablet' }
    ],
    notes: 'Dummy indications and doses are placeholders for later clinical configuration.'
  },
  clavulanate: {
    name: 'Amoxicillin + Clavulanic acid',
    indications: [
      { name: 'Dummy bacterial sinusitis', dose: 45, doseUnit: 'mg', strength: 400, frequency: 2, frequencyUnit: 'times/day', duration: 10 },
      { name: 'Dummy bite wound prophylaxis', dose: 25, doseUnit: 'mg', strength: 250, frequency: 2, frequencyUnit: 'times/day', duration: 5 }
    ],
    dailyDoseMgPerKg: 45, frequency: 2, route: 'PO', interval: '12 hourly',
    formulation: [
      { label: '125/31 mg/5 mL', concentration: 25, unit: 'mg/mL' },
      { label: '250/62 mg/5 mL', concentration: 50, unit: 'mg/mL' },
      { label: '400/57 mg/5 mL', concentration: 80, unit: 'mg/mL' },
      { label: '875/125 mg tablet', concentration: 875, unit: 'mg/tablet' }
    ],
    notes: 'Dummy indications and doses are placeholders for later clinical configuration.'
  },
  azithromycin: {
    name: 'Azithromycin',
    indications: [
      { name: 'Dummy atypical pneumonia', dose: 10, doseUnit: 'mg', strength: 200, frequency: 1, frequencyUnit: 'times/day', duration: 5 },
      { name: 'Dummy pertussis exposure', dose: 10, doseUnit: 'mg', strength: 200, frequency: 1, frequencyUnit: 'times/day', duration: 5 }
    ],
    dailyDoseMgPerKg: 10, frequency: 1, route: 'PO', interval: 'daily',
    formulation: [
      { label: '200 mg/5 mL', concentration: 40, unit: 'mg/mL' },
      { label: '250 mg tablet', concentration: 250, unit: 'mg/tablet' },
      { label: '600 mg tablet', concentration: 600, unit: 'mg/tablet' }
    ],
    notes: 'Dummy indications and doses are placeholders for later clinical configuration.'
  }
};

const state = { selected: [], weightUnit: 'kg' };
const weightInput = document.getElementById('weightKg');
const weightUnit = document.getElementById('weightUnit');
const weightToggle = document.getElementById('weightToggle');
const ageInput = document.getElementById('patientAge');
const selectEl = document.getElementById('antibioticSelect');
const addBtn = document.getElementById('addAntibioticBtn');
const prescriptionList = document.getElementById('prescriptionList');
const printBtn = document.getElementById('printButton');
const notesEl = document.getElementById('clinicalNotes');

function populateAntibioticOptions() {
  Object.entries(antibioticCatalog).forEach(([key, antibiotic]) => {
    const option = document.createElement('option'); option.value = key; option.textContent = antibiotic.name; selectEl.appendChild(option);
  });
}
function formatNumber(value) { return Number.isFinite(value) ? Number(value.toFixed(1)).toString() : '0'; }
function getWeightKg() { const weight = Number(weightInput.value) || 0; return state.weightUnit === 'lbs' ? weight / 2.20462 : weight; }
function dailyDoseForAntibiotic(antibiotic, weightKg) { return antibiotic.dailyDoseMgPerKg * weightKg; }
function perDoseAmount(antibiotic, weightKg) { return dailyDoseForAntibiotic(antibiotic, weightKg) / antibiotic.frequency; }
function recommendedFormulation(antibiotic, weightKg) {
  const dosePerAdministration = perDoseAmount(antibiotic, weightKg);
  return antibiotic.formulation.map((option) => ({ ...option, volumeOrCount: dosePerAdministration / option.concentration }));
}
function getIndication(antibiotic, name) { return antibiotic.indications.find((indication) => indication.name === name) || antibiotic.indications[0]; }
function getDosesPerDay(item) {
  const frequency = Number(item.frequency) || 0;
  if (item.frequencyUnit === 'hours') return frequency > 0 ? 24 / frequency : 0;
  if (item.frequencyUnit === 'BID') return 2;
  if (item.frequencyUnit === 'TID') return 3;
  if (item.frequencyUnit === 'QID') return 4;
  return frequency;
}
function calculateTotalQuantity(item) {
  const dose = Number(item.dose) || 0;
  const doseInMg = item.doseUnit === 'ml' ? dose * (Number(item.strength) || 0) : dose;
  return doseInMg * getDosesPerDay(item) * (Number(item.duration) || 0);
}
function createNumberInput(labelText, value, step, onInput) {
  const label = document.createElement('label'); label.innerHTML = `<span>${labelText}</span>`;
  const input = document.createElement('input'); input.type = 'number'; input.min = '0'; input.step = step; input.value = value;
  input.addEventListener('input', () => onInput(Number(input.value) || 0)); label.appendChild(input); return { label, input };
}
function rangeText(values, suffix = '') {
  const numbers = values.map(Number).filter(Number.isFinite); if (!numbers.length) return '—';
  const min = Math.min(...numbers), max = Math.max(...numbers); return `${formatNumber(min)}${min === max ? '' : `–${formatNumber(max)}`}${suffix}`;
}
function clinicalRange(antibiotic, weightKg) {
  const indications = antibiotic.indications;
  return {
    doses: rangeText(indications.map((item) => item.dose), ` ${indications[0].doseUnit}`),
    units: [...new Set(indications.map((item) => item.doseUnit))].join(' / '),
    frequencies: rangeText(indications.map((item) => getDosesPerDay(item)), ' times/day'),
    durations: rangeText(indications.map((item) => item.duration), ' days'),
    totals: rangeText(indications.map((item) => calculateTotalQuantity(item)), ' mg')
  };
}
function buildDosePanel(dosing, headingText, options = {}) {
  const panel = document.createElement('section'); panel.className = 'dose-panel';
  const heading = document.createElement('h3'); heading.textContent = headingText; panel.appendChild(heading);
  if (options.range) {
    const r = options.range;
    panel.innerHTML += `<div class="range-value"><span>Dose</span><strong>${r.doses}</strong></div><div class="range-value"><span>Unit</span><strong>${r.units}</strong></div><div class="range-value"><span>Frequency</span><strong>${r.frequencies}</strong></div><div class="range-value"><span>Duration</span><strong>${r.durations}</strong></div><div class="total-quantity"><span>Total quantity range</span><strong>${r.totals}</strong></div>`;
    return panel;
  }
  const totalBox = document.createElement('div'); totalBox.className = 'total-quantity'; totalBox.innerHTML = '<span>Total quantity</span><strong></strong>';
  const total = totalBox.querySelector('strong'); const updateTotal = () => { total.textContent = `${formatNumber(calculateTotalQuantity(dosing))} mg`; };
  const doseRow = document.createElement('div'); doseRow.className = 'dose-input-row';
  const dose = createNumberInput('Dose', dosing.dose, '0.1', (value) => { dosing.dose = value; updateTotal(); }); doseRow.appendChild(dose.label);
  const doseUnit = document.createElement('label'); doseUnit.innerHTML = '<span>Unit</span>'; const doseUnitSelect = document.createElement('select'); doseUnitSelect.innerHTML = '<option value="mg">mg</option><option value="ml">mL</option>'; doseUnitSelect.value = dosing.doseUnit;
  doseUnitSelect.addEventListener('change', () => { dosing.doseUnit = doseUnitSelect.value; strength.label.style.display = dosing.doseUnit === 'ml' ? '' : 'none'; updateTotal(); }); doseUnit.appendChild(doseUnitSelect); doseRow.appendChild(doseUnit); panel.appendChild(doseRow);
  const strength = createNumberInput('Strength (mg/mL)', dosing.strength, '0.1', (value) => { dosing.strength = value; updateTotal(); }); strength.label.style.display = dosing.doseUnit === 'ml' ? '' : 'none'; panel.appendChild(strength.label);
  const frequencyRow = document.createElement('div'); frequencyRow.className = 'dose-input-row'; const frequency = createNumberInput('Frequency', dosing.frequency, '0.1', (value) => { dosing.frequency = value; updateTotal(); }); frequencyRow.appendChild(frequency.label);
  const frequencyUnit = document.createElement('label'); frequencyUnit.innerHTML = '<span>Schedule</span>'; const frequencyUnitSelect = document.createElement('select'); frequencyUnitSelect.innerHTML = '<option value="times/day">times/day</option><option value="hours">hours</option><option value="BID">BID</option><option value="TID">TID</option><option value="QID">QID</option>'; frequencyUnitSelect.value = dosing.frequencyUnit;
  frequencyUnitSelect.addEventListener('change', () => { dosing.frequencyUnit = frequencyUnitSelect.value; frequency.input.disabled = ['BID', 'TID', 'QID'].includes(dosing.frequencyUnit); updateTotal(); }); frequencyUnit.appendChild(frequencyUnitSelect); frequencyRow.appendChild(frequencyUnit); panel.appendChild(frequencyRow);
  const duration = createNumberInput('Duration (days)', dosing.duration, '1', (value) => { dosing.duration = value; updateTotal(); }); panel.appendChild(duration.label); panel.appendChild(totalBox); frequency.input.disabled = ['BID', 'TID', 'QID'].includes(dosing.frequencyUnit); updateTotal(); return panel;
}
function valuesWithinClinicalRange(item, antibiotic, weightKg) {
  const indications = antibiotic.indications;
  const inRange = (value, values) => value >= Math.min(...values) && value <= Math.max(...values);
  const unitOk = indications.some((x) => x.doseUnit === item.doseUnit);
  return inRange(Number(item.dose), indications.map((x) => Number(x.dose))) && unitOk && inRange(getDosesPerDay(item), indications.map(getDosesPerDay)) && inRange(Number(item.duration), indications.map((x) => Number(x.duration))) && inRange(calculateTotalQuantity(item), indications.map(calculateTotalQuantity));
}
function updateIncomingStatus(panel, item, antibiotic, weightKg) {
  const allInputs = valuesWithinClinicalRange(item, antibiotic, weightKg);
  const totalValues = antibiotic.indications.map(calculateTotalQuantity);
  const totalOk = calculateTotalQuantity(item) >= Math.min(...totalValues) && calculateTotalQuantity(item) <= Math.max(...totalValues);
  panel.classList.remove('status-green', 'status-yellow', 'status-red'); panel.classList.add(allInputs ? 'status-green' : totalOk ? 'status-yellow' : 'status-red');
}
function buildIndicationSelect(antibiotic, selectedItem) { const label = document.createElement('label'); label.className = 'indication-field'; label.innerHTML = '<span>Indication</span>'; const select = document.createElement('select'); select.className = 'indication-select'; antibiotic.indications.forEach((indication) => { const option = document.createElement('option'); option.value = indication.name; option.textContent = indication.name; select.appendChild(option); }); select.value = selectedItem.indication; select.addEventListener('change', () => { const indication = getIndication(antibiotic, select.value); selectedItem.indication = indication.name; Object.assign(selectedItem.incoming, indication); renderPrescriptions(); }); label.appendChild(select); return label; }
function buildCard(selectedItem, antibiotic, weightKg) {
  const card = document.createElement('article'); card.className = 'prescription-card'; const removeBtn = document.createElement('button'); removeBtn.type = 'button'; removeBtn.className = 'remove-button'; removeBtn.textContent = 'Remove'; removeBtn.addEventListener('click', () => { state.selected = state.selected.filter((item) => item !== selectedItem); renderPrescriptions(); });
  const title = document.createElement('div'); title.className = 'card-header'; title.innerHTML = `<h3>${antibiotic.name}</h3>`; title.appendChild(removeBtn); const meta = document.createElement('div'); meta.className = 'card-meta'; meta.innerHTML = `<span>${antibiotic.route}</span><span>${antibiotic.interval}</span>`;
  const indication = buildIndicationSelect(antibiotic, selectedItem); const top = document.createElement('div'); top.className = 'card-top'; top.append(title, meta, indication); const dosePanels = document.createElement('div'); dosePanels.className = 'dose-panels'; const incomingPanel = buildDosePanel(selectedItem.incoming, 'Incoming Prescriber Dosing'); dosePanels.append(incomingPanel, buildDosePanel(selectedItem.clinical, 'Clinical Dosing Range', { range: clinicalRange(antibiotic, weightKg) })); updateIncomingStatus(incomingPanel, selectedItem.incoming, antibiotic, weightKg);
  const dosingInfo = document.createElement('div'); dosingInfo.className = 'dose-info'; dosingInfo.innerHTML = `<p><strong>Reference total daily dose:</strong> ${formatNumber(dailyDoseForAntibiotic(antibiotic, weightKg))} mg/day</p><p><strong>Suggested per-dose amount:</strong> ${formatNumber(perDoseAmount(antibiotic, weightKg))} mg</p>`; const note = document.createElement('p'); note.className = 'card-note'; note.textContent = antibiotic.notes; card.append(top, dosePanels, dosingInfo, note); return card;
}
function renderPrescriptions() { prescriptionList.innerHTML = ''; if (state.selected.length === 0) { prescriptionList.innerHTML = '<div class="empty-state">No antibiotics added yet. Select a medication above to begin.</div>'; return; } state.selected.forEach((item) => prescriptionList.appendChild(buildCard(item, antibioticCatalog[item.key], getWeightKg()))); }
function addSelectedAntibiotic() { const key = selectEl.value; if (!key || state.selected.some((item) => item.key === key)) return; const indication = antibioticCatalog[key].indications[0]; state.selected.push({ key, indication: indication.name, incoming: { ...indication }, clinical: { ...indication } }); renderPrescriptions(); }
function exportPrescriptionSummary() { const lines = ['Pediatric Antibiotic Calculator', '==============================', `Weight: ${formatNumber(getWeightKg())} kg`, `Age: ${formatNumber(Number(ageInput.value) || 0)} years`, `Notes: ${notesEl.value || 'None'}`]; state.selected.forEach((item) => { const antibiotic = antibioticCatalog[item.key]; lines.push(`${antibiotic.name}: ${item.incoming.dose} ${item.incoming.doseUnit}, ${item.incoming.frequency} ${item.incoming.frequencyUnit}, ${item.incoming.duration} days, total ${formatNumber(calculateTotalQuantity(item.incoming))} mg`); }); const blob = new Blob([lines.join('\n')], { type: 'text/plain' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'pediatric-prescription.txt'; link.click(); URL.revokeObjectURL(link.href); }
function toggleWeightUnit() { const currentWeight = Number(weightInput.value); if (Number.isFinite(currentWeight) && currentWeight > 0) weightInput.value = formatNumber(state.weightUnit === 'kg' ? currentWeight * 2.20462 : currentWeight / 2.20462); state.weightUnit = state.weightUnit === 'kg' ? 'lbs' : 'kg'; weightUnit.textContent = state.weightUnit; renderPrescriptions(); }
populateAntibioticOptions(); weightInput.addEventListener('input', renderPrescriptions); weightToggle.addEventListener('click', toggleWeightUnit); addBtn.addEventListener('click', addSelectedAntibiotic); printBtn.addEventListener('click', exportPrescriptionSummary);
