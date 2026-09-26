// Configuration: Easy backend editing by separating indication data
const indicationsData = {
  amoxicillin: [
    { name: 'Acute otitis media', dose: 45, doseUnit: 'mg', strength: 400, frequency: 2, frequencyUnit: 'times/day', duration: 7, packagings: [{ strength: '125 mg/5 mL', count: 1 }, { strength: '250 mg/5 mL', count: 1 }] },
    { name: 'Streptococcal pharyngitis', dose: 50, doseUnit: 'mg', strength: 250, frequency: 1, frequencyUnit: 'times/day', duration: 10, packagings: [{ strength: '250 mg/5 mL', count: 1 }] }
  ],
  clavulanate: [
    { name: 'Bacterial sinusitis', dose: 45, doseUnit: 'mg', strength: 400, frequency: 2, frequencyUnit: 'times/day', duration: 10, packagings: [{ strength: '125/31 mg/5 mL', count: 1 }, { strength: '400/57 mg/5 mL', count: 2 }] },
    { name: 'Bite wound prophylaxis', dose: 25, doseUnit: 'mg', strength: 250, frequency: 2, frequencyUnit: 'times/day', duration: 5, packagings: [{ strength: '125/31 mg/5 mL', count: 1 }] }
  ],
  azithromycin: [
    { name: 'Atypical pneumonia', dose: 10, doseUnit: 'mg', strength: 200, frequency: 1, frequencyUnit: 'times/day', duration: 5, packagings: [{ strength: '200 mg/5 mL', count: 1 }] },
    { name: 'Pertussis exposure', dose: 10, doseUnit: 'mg', strength: 200, frequency: 1, frequencyUnit: 'times/day', duration: 5, packagings: [{ strength: '200 mg/5 mL', count: 1 }] }
  ]
};

const antibioticCatalog = {
  amoxicillin: {
    name: 'Amoxicillin',
    indications: indicationsData.amoxicillin,
    dailyDoseMgPerKg: 40, frequency: 2, route: 'PO', interval: '12 hourly',
    formulation: [
      { label: '125 mg/5 mL', concentration: 25, unit: 'mg/mL' },
      { label: '250 mg/5 mL', concentration: 50, unit: 'mg/mL' },
      { label: '500 mg capsule', concentration: 500, unit: 'mg/capsule' },
      { label: '875 mg tablet', concentration: 875, unit: 'mg/tablet' }
    ],
    notes: 'Adjust dosing based on indication and patient-specific factors.'
  },
  clavulanate: {
    name: 'Amoxicillin + Clavulanic acid',
    indications: indicationsData.clavulanate,
    dailyDoseMgPerKg: 45, frequency: 2, route: 'PO', interval: '12 hourly',
    formulation: [
      { label: '125/31 mg/5 mL', concentration: 25, unit: 'mg/mL' },
      { label: '250/62 mg/5 mL', concentration: 50, unit: 'mg/mL' },
      { label: '400/57 mg/5 mL', concentration: 80, unit: 'mg/mL' },
      { label: '875/125 mg tablet', concentration: 875, unit: 'mg/tablet' }
    ],
    notes: 'Available in 2 strength combinations. Verify strength/dosing per indication.'
  },
  azithromycin: {
    name: 'Azithromycin',
    indications: indicationsData.azithromycin,
    dailyDoseMgPerKg: 10, frequency: 1, route: 'PO', interval: 'daily',
    formulation: [
      { label: '200 mg/5 mL', concentration: 40, unit: 'mg/mL' },
      { label: '250 mg tablet', concentration: 250, unit: 'mg/tablet' },
      { label: '600 mg tablet', concentration: 600, unit: 'mg/tablet' }
    ],
    notes: 'Adjust dosing based on indication.'
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
const pharSignatureEl = document.getElementById('pharmacistSignature');
const lastUpdatedEl = document.getElementById('lastUpdatedDate');

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
    frequencies: rangeText(indications.map((item) => getDosesPerDay(item)), ' times/day'),
    durations: rangeText(indications.map((item) => item.duration), ' days')
  };
}
function buildPackagingPanel(indication) {
  const panel = document.createElement('section'); panel.className = 'packaging-panel';
  const heading = document.createElement('h3'); heading.textContent = 'Packaging options'; panel.appendChild(heading);
  if (!indication.packagings || indication.packagings.length === 0) {
    panel.innerHTML += '<p class="field-help">No packaging information available.</p>';
    return panel;
  }
  const packagingGrid = document.createElement('div'); packagingGrid.className = 'packaging-grid';
  indication.packagings.forEach((pkg) => {
    const icon = document.createElement('div'); icon.className = 'packaging-icon';
    icon.innerHTML = `<div class="strength-badge">${pkg.strength}</div><div class="pack-count">×${pkg.count}</div>`;
    packagingGrid.appendChild(icon);
  });
  panel.appendChild(packagingGrid);
  return panel;
}
function buildDosePanel(dosing, headingText, options = {}) {
  const panel = document.createElement('section'); panel.className = 'dose-panel';
  const heading = document.createElement('h3'); heading.textContent = headingText; panel.appendChild(heading);
  if (options.range) {
    const r = options.range;
    panel.innerHTML += `<div class="range-value"><span>Dose</span><strong>${r.doses}</strong></div><div class="range-value"><span>Frequency</span><strong>${r.frequencies}</strong></div><div class="range-value"><span>Duration</span><strong>${r.durations}</strong></div>`;
    return panel;
  }
  const totalBox = document.createElement('div'); totalBox.className = 'total-quantity'; totalBox.innerHTML = '<span>Total quantity</span><strong></strong>';
  const total = totalBox.querySelector('strong'); const updateTotal = () => { total.textContent = `${formatNumber(calculateTotalQuantity(dosing))} mg`; };
  const doseRow = document.createElement('div'); doseRow.className = 'dose-input-row';
  const dose = createNumberInput('Dose', dosing.dose, '0.1', (value) => { dosing.dose = value; updateTotal(); }); doseRow.appendChild(dose.label);
  const doseUnit = document.createElement('label'); doseUnit.innerHTML = '<span>Unit</span>'; const doseUnitSelect = document.createElement('select'); doseUnitSelect.innerHTML = '<option value="mg">mg</option><option value="ml">mL</option>';
  doseUnitSelect.addEventListener('change', () => { dosing.doseUnit = doseUnitSelect.value; strength.label.style.display = dosing.doseUnit === 'ml' ? '' : 'none'; updateTotal(); }); doseUnit.appendChild(doseUnitSelect);
  const strength = createNumberInput('Strength (mg/mL)', dosing.strength, '0.1', (value) => { dosing.strength = value; updateTotal(); }); strength.label.style.display = dosing.doseUnit === 'ml' ? '' : 'none';
  const frequencyRow = document.createElement('div'); frequencyRow.className = 'dose-input-row'; const frequency = createNumberInput('Frequency', dosing.frequency, '0.1', (value) => { dosing.frequency = value; updateTotal(); }); frequencyRow.appendChild(frequency.label);
  const frequencyUnit = document.createElement('label'); frequencyUnit.innerHTML = '<span>Schedule</span>'; const frequencyUnitSelect = document.createElement('select'); frequencyUnitSelect.innerHTML = '<option value="times/day">times/day</option><option value="hours">hours</option><option value="BID">BID</option><option value="TID">TID</option><option value="QID">QID</option>';
  frequencyUnitSelect.addEventListener('change', () => { dosing.frequencyUnit = frequencyUnitSelect.value; frequency.input.disabled = ['BID', 'TID', 'QID'].includes(dosing.frequencyUnit); updateTotal(); }); frequencyUnit.appendChild(frequencyUnitSelect); frequencyRow.appendChild(frequencyUnit);
  const duration = createNumberInput('Duration (days)', dosing.duration, '1', (value) => { dosing.duration = value; updateTotal(); }); panel.appendChild(doseRow); panel.appendChild(dose.label); panel.appendChild(doseUnit); panel.appendChild(strength.label); panel.appendChild(frequencyRow); panel.appendChild(duration.label); panel.appendChild(totalBox); updateTotal(); return panel;
}
function valuesWithinClinicalRange(item, antibiotic, weightKg) {
  const indications = antibiotic.indications;
  const inRange = (value, values) => value >= Math.min(...values) && value <= Math.max(...values);
  const unitOk = indications.some((x) => x.doseUnit === item.doseUnit);
  return inRange(Number(item.dose), indications.map((x) => Number(x.dose))) && unitOk && inRange(getDosesPerDay(item), indications.map(getDosesPerDay)) && inRange(Number(item.duration), indications.map((x) => Number(x.duration)));
}
function updateIncomingStatus(panel, item, antibiotic, weightKg) {
  const allInputs = valuesWithinClinicalRange(item, antibiotic, weightKg);
  const totalValues = antibiotic.indications.map(calculateTotalQuantity);
  const totalOk = calculateTotalQuantity(item) >= Math.min(...totalValues) && calculateTotalQuantity(item) <= Math.max(...totalValues);
  panel.classList.remove('status-green', 'status-yellow', 'status-red'); panel.classList.add(allInputs ? 'status-green' : totalOk ? 'status-yellow' : 'status-red');
}
function buildIndicationSelect(antibiotic, selectedItem) {
  const label = document.createElement('label'); label.className = 'indication-field'; label.innerHTML = '<span>Indication</span>';
  const select = document.createElement('select'); select.className = 'indication-select';
  antibiotic.indications.forEach((indication) => {
    const option = document.createElement('option'); option.value = indication.name; option.textContent = indication.name; select.appendChild(option);
  });
  select.value = selectedItem.indication;
  select.addEventListener('change', () => {
    selectedItem.indication = select.value;
    const indication = getIndication(antibiotic, select.value);
    Object.assign(selectedItem, { dose: indication.dose, doseUnit: indication.doseUnit, strength: indication.strength, frequency: indication.frequency, frequencyUnit: indication.frequencyUnit, duration: indication.duration });
    renderPrescriptions();
  });
  label.appendChild(select);
  return label;
}
function buildCard(selectedItem, antibiotic, weightKg) {
  const indication = getIndication(antibiotic, selectedItem.indication);
  const card = document.createElement('article'); card.className = 'prescription-card';
  const removeBtn = document.createElement('button'); removeBtn.type = 'button'; removeBtn.className = 'remove-button'; removeBtn.textContent = '×';
  removeBtn.addEventListener('click', () => { state.selected = state.selected.filter((item) => item !== selectedItem); renderPrescriptions(); });
  const title = document.createElement('div'); title.className = 'card-header'; title.innerHTML = `<h3>${antibiotic.name}</h3>`; title.appendChild(removeBtn);
  const meta = document.createElement('div'); meta.className = 'card-meta'; meta.innerHTML = `<span>${antibiotic.route || 'PO'}</span>`;
  const indicationSelect = buildIndicationSelect(antibiotic, selectedItem);
  const top = document.createElement('div'); top.className = 'card-top'; top.append(title, meta, indicationSelect);
  const dosePanels = document.createElement('div'); dosePanels.className = 'dose-panels';
  const prescribedDosing = buildDosePanel(selectedItem, 'Prescribed dosing'); dosePanels.appendChild(prescribedDosing);
  const referenceDosing = buildDosePanel(antibiotic, 'Reference dosing', { range: clinicalRange(antibiotic, weightKg) }); dosePanels.appendChild(referenceDosing);
  updateIncomingStatus(prescribedDosing, selectedItem, antibiotic, weightKg);
  const prescription = document.createElement('div'); prescription.className = 'prescription-content'; prescription.appendChild(dosePanels);
  const packagingPanel = buildPackagingPanel(indication); prescription.appendChild(packagingPanel);
  const dosingInfo = document.createElement('div'); dosingInfo.className = 'dose-info'; dosingInfo.innerHTML = `<p><strong>Reference total daily dose:</strong> ${formatNumber(dailyDoseForAntibiotic(antibiotic, weightKg))} mg</p><p class="antibiotic-note">${antibiotic.notes}</p>`;
  prescription.appendChild(dosingInfo); card.appendChild(top); card.appendChild(prescription); return card;
}
function renderPrescriptions() {
  prescriptionList.innerHTML = '';
  if (state.selected.length === 0) { prescriptionList.innerHTML = '<div class="empty-state">No antibiotics added yet. Select a medication and click Add.</div>'; return; }
  const weightKg = getWeightKg(); state.selected.forEach((item) => { const antibiotic = antibioticCatalog[item.key]; const card = buildCard(item, antibiotic, weightKg); prescriptionList.appendChild(card); });
}
function addSelectedAntibiotic() {
  const key = selectEl.value; if (!key || state.selected.some((item) => item.key === key)) return;
  const indication = antibioticCatalog[key].indications[0];
  state.selected.push({ key, indication: indication.name, dose: indication.dose, doseUnit: indication.doseUnit, strength: indication.strength, frequency: indication.frequency, frequencyUnit: indication.frequencyUnit, duration: indication.duration });
  renderPrescriptions();
}
function exportPrescriptionSummary() {
  const lines = ['Pediatric Antibiotic Calculator', '==============================', `Weight: ${formatNumber(getWeightKg())} kg`, `Age: ${formatNumber(Number(ageInput.value))}`, '', 'Clinical notes:', notesEl.value, ''];
  state.selected.forEach((item) => { const antibiotic = antibioticCatalog[item.key]; lines.push(`${antibiotic.name}:`); lines.push(`  Indication: ${item.indication}`); lines.push(`  Dose: ${item.dose} ${item.doseUnit}`); lines.push(`  Frequency: ${item.frequency} ${item.frequencyUnit}`); lines.push(`  Duration: ${item.duration} days`); lines.push(''); });
  if (pharSignatureEl.value) { lines.push(`Pharmacist: ${pharSignatureEl.value}`); }
  window.print();
}
function toggleWeightUnit() {
  const currentWeight = Number(weightInput.value);
  if (Number.isFinite(currentWeight) && currentWeight > 0) weightInput.value = formatNumber(state.weightUnit === 'kg' ? currentWeight * 2.20462 : currentWeight / 2.20462);
  state.weightUnit = state.weightUnit === 'kg' ? 'lbs' : 'kg'; weightUnit.textContent = state.weightUnit; renderPrescriptions();
}
populateAntibioticOptions(); weightInput.addEventListener('input', renderPrescriptions); weightToggle.addEventListener('click', toggleWeightUnit); addBtn.addEventListener('click', addSelectedAntibiotic); printBtn.addEventListener('click', exportPrescriptionSummary); renderPrescriptions();