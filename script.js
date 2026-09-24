const antibioticCatalog = {
  amoxicillin: {
    name: 'Amoxicillin',
    indications: [
      { name: 'Dummy acute otitis media', dose: 45, doseUnit: 'mg', strength: 400, frequency: 2, frequencyUnit: 'times/day', duration: 7 },
      { name: 'Dummy streptococcal pharyngitis', dose: 50, doseUnit: 'mg', strength: 250, frequency: 1, frequencyUnit: 'times/day', duration: 10 }
    ],
    dailyDoseMgPerKg: 40,
    frequency: 2,
    route: 'PO',
    interval: '12 hourly',
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
    dailyDoseMgPerKg: 45,
    frequency: 2,
    route: 'PO',
    interval: '12 hourly',
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
    dailyDoseMgPerKg: 10,
    frequency: 1,
    route: 'PO',
    interval: 'daily',
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
    const option = document.createElement('option');
    option.value = key;
    option.textContent = antibiotic.name;
    selectEl.appendChild(option);
  });
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return '0';
  return Number(value.toFixed(1)).toString();
}

function getWeightKg() {
  const enteredWeight = Number(weightInput.value) || 0;
  return state.weightUnit === 'lbs' ? enteredWeight / 2.20462 : enteredWeight;
}

function dailyDoseForAntibiotic(antibiotic, weightKg) {
  return antibiotic.dailyDoseMgPerKg * weightKg;
}

function perDoseAmount(antibiotic, weightKg) {
  return dailyDoseForAntibiotic(antibiotic, weightKg) / antibiotic.frequency;
}

function recommendedFormulation(antibiotic, weightKg) {
  const dosePerAdministration = perDoseAmount(antibiotic, weightKg);
  return antibiotic.formulation.map((option) => {
    const volumeOrCount = option.concentration > 0 ? dosePerAdministration / option.concentration : 0;
    return { option, volumeOrCount, difference: Math.abs(volumeOrCount - Math.round(volumeOrCount || 0)) };
  }).sort((a, b) => a.difference - b.difference)[0] || { option: antibiotic.formulation[0], volumeOrCount: 0 };
}

function getIndication(antibiotic, name) {
  return antibiotic.indications.find((indication) => indication.name === name) || antibiotic.indications[0];
}

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
  const label = document.createElement('label');
  label.innerHTML = `<span>${labelText}</span>`;
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.step = step;
  input.value = value;
  input.addEventListener('input', () => onInput(input.value));
  label.appendChild(input);
  return { label, input };
}

function buildDosePanel(selectedItem) {
  const panel = document.createElement('div');
  panel.className = 'dose-panel';
  const heading = document.createElement('h3');
  heading.textContent = 'Prescriber RX Dosing';
  panel.appendChild(heading);

  const updateTotal = () => { total.textContent = `${formatNumber(calculateTotalQuantity(selectedItem))} mg`; };
  const doseRow = document.createElement('div');
  doseRow.className = 'dose-input-row';
  const dose = createNumberInput('Dose', selectedItem.dose, '0.1', (value) => { selectedItem.dose = value; updateTotal(); });
  doseRow.appendChild(dose.label);

  const doseUnit = document.createElement('label');
  doseUnit.innerHTML = '<span>Unit</span>';
  const doseUnitSelect = document.createElement('select');
  doseUnitSelect.innerHTML = '<option value="mg">mg</option><option value="ml">mL</option>';
  doseUnitSelect.value = selectedItem.doseUnit;
  doseUnitSelect.addEventListener('change', () => {
    selectedItem.doseUnit = doseUnitSelect.value;
    strength.label.style.display = selectedItem.doseUnit === 'ml' ? '' : 'none';
    updateTotal();
  });
  doseUnit.appendChild(doseUnitSelect);
  doseRow.appendChild(doseUnit);
  panel.appendChild(doseRow);

  const strength = createNumberInput('Strength (mg/mL)', selectedItem.strength, '0.1', (value) => { selectedItem.strength = value; updateTotal(); });
  strength.label.style.display = selectedItem.doseUnit === 'ml' ? '' : 'none';
  panel.appendChild(strength.label);

  const frequencyRow = document.createElement('div');
  frequencyRow.className = 'dose-input-row';
  const frequency = createNumberInput('Frequency', selectedItem.frequency, '0.1', (value) => { selectedItem.frequency = value; updateTotal(); });
  frequencyRow.appendChild(frequency.label);
  const frequencyUnit = document.createElement('label');
  frequencyUnit.innerHTML = '<span>Schedule</span>';
  const frequencyUnitSelect = document.createElement('select');
  frequencyUnitSelect.innerHTML = '<option value="hours">q hours</option><option value="BID">BID</option><option value="TID">TID</option><option value="QID">QID</option><option value="times/day">times/day</option>';
  frequencyUnitSelect.value = selectedItem.frequencyUnit;
  frequencyUnitSelect.addEventListener('change', () => {
    selectedItem.frequencyUnit = frequencyUnitSelect.value;
    frequency.input.disabled = ['BID', 'TID', 'QID'].includes(selectedItem.frequencyUnit);
    updateTotal();
  });
  frequencyUnit.appendChild(frequencyUnitSelect);
  frequencyRow.appendChild(frequencyUnit);
  panel.appendChild(frequencyRow);
  frequency.input.disabled = ['BID', 'TID', 'QID'].includes(selectedItem.frequencyUnit);

  const duration = createNumberInput('Duration (days)', selectedItem.duration, '1', (value) => { selectedItem.duration = value; updateTotal(); });
  panel.appendChild(duration.label);

  const totalBox = document.createElement('div');
  totalBox.className = 'total-quantity';
  totalBox.innerHTML = '<span>Total quantity</span><strong></strong>';
  const total = totalBox.querySelector('strong');
  updateTotal();
  panel.appendChild(totalBox);
  return panel;
}

function buildIndicationSelect(antibiotic, selectedItem) {
  const label = document.createElement('label');
  label.className = 'indication-field';
  label.innerHTML = '<span>Indication</span>';
  const select = document.createElement('select');
  select.className = 'indication-select';
  antibiotic.indications.forEach((indication) => {
    const option = document.createElement('option');
    option.value = indication.name;
    option.textContent = indication.name;
    select.appendChild(option);
  });
  select.value = selectedItem.indication;
  select.addEventListener('change', () => {
    const indication = getIndication(antibiotic, select.value);
    if (indication) Object.assign(selectedItem, indication, { indication: indication.name });
    renderPrescriptions();
  });
  label.appendChild(select);
  return label;
}

function buildCard(selectedItem, antibiotic, weightKg) {
  const totalDaily = dailyDoseForAntibiotic(antibiotic, weightKg);
  const perDose = perDoseAmount(antibiotic, weightKg);
  const recommended = recommendedFormulation(antibiotic, weightKg);
  const card = document.createElement('article');
  card.className = 'prescription-card';
  const dosePanel = buildDosePanel(selectedItem);
  const content = document.createElement('div');
  content.className = 'prescription-content';
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-button';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => { state.selected = state.selected.filter((item) => item !== selectedItem); renderPrescriptions(); });
  const title = document.createElement('div');
  title.className = 'card-header';
  title.innerHTML = `<h3>${antibiotic.name}</h3>`;
  title.appendChild(removeBtn);
  const meta = document.createElement('div');
  meta.className = 'card-meta';
  meta.innerHTML = `<span>${antibiotic.route}</span><span>${antibiotic.interval}</span><span>${antibiotic.frequency}-times daily</span>`;
  const indication = buildIndicationSelect(antibiotic, selectedItem);
  const dosingInfo = document.createElement('div');
  dosingInfo.className = 'dose-info';
  dosingInfo.innerHTML = `<p><strong>Reference total daily dose:</strong> ${formatNumber(totalDaily)} mg/day</p><p><strong>Reference per dose:</strong> ${formatNumber(perDose)} mg</p><p><strong>Suggested formulation:</strong> ${recommended.option.label} (${formatNumber(recommended.volumeOrCount)} per dose)</p>`;
  const note = document.createElement('p');
  note.className = 'card-note';
  note.textContent = antibiotic.notes;
  content.append(title, meta, indication, dosingInfo, note);
  card.append(dosePanel, content);
  return card;
}

function renderPrescriptions() {
  prescriptionList.innerHTML = '';
  if (state.selected.length === 0) {
    prescriptionList.innerHTML = '<div class="empty-state">No antibiotics added yet. Select a medication to build the prescription.</div>';
    return;
  }
  state.selected.forEach((selectedItem) => {
    const antibiotic = antibioticCatalog[selectedItem.key];
    if (antibiotic) prescriptionList.appendChild(buildCard(selectedItem, antibiotic, getWeightKg()));
  });
}

function addSelectedAntibiotic() {
  const key = selectEl.value;
  if (!key || state.selected.some((item) => item.key === key)) return;
  const antibiotic = antibioticCatalog[key];
  const indication = antibiotic.indications[0];
  state.selected.push({ key, indication: indication.name, ...indication });
  renderPrescriptions();
}

function exportPrescriptionSummary() {
  const lines = ['Pediatric Antibiotic Calculator', '==============================', `Weight: ${formatNumber(getWeightKg())} kg`, `Age: ${formatNumber(Number(ageInput.value) || 0)} years`, notesEl.value ? `Notes: ${notesEl.value}` : ''];
  state.selected.forEach((item) => {
    const antibiotic = antibioticCatalog[item.key];
    lines.push(`- ${antibiotic.name} (${item.indication}): ${formatNumber(item.dose)} ${item.doseUnit}, ${item.frequencyUnit === 'hours' ? `q${formatNumber(item.frequency)}h` : item.frequencyUnit}, ${formatNumber(item.duration)} days; ${formatNumber(calculateTotalQuantity(item))} mg total`);
  });
  const blob = new Blob([lines.filter(Boolean).join('\n') + '\n'], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'pediatric-antibiotic-prescription.txt';
  link.click();
  URL.revokeObjectURL(url);
}

function toggleWeightUnit() {
  const currentWeight = Number(weightInput.value);
  if (Number.isFinite(currentWeight) && currentWeight > 0) weightInput.value = formatNumber(state.weightUnit === 'kg' ? currentWeight * 2.20462 : currentWeight / 2.20462);
  state.weightUnit = state.weightUnit === 'kg' ? 'lbs' : 'kg';
  weightUnit.textContent = state.weightUnit;
  weightToggle.textContent = state.weightUnit === 'kg' ? 'Switch to lbs' : 'Switch to kg';
  weightToggle.setAttribute('aria-label', `Switch weight to ${state.weightUnit === 'kg' ? 'pounds' : 'kilograms'}`);
  renderPrescriptions();
}

weightInput.addEventListener('input', renderPrescriptions);
weightToggle.addEventListener('click', toggleWeightUnit);
addBtn.addEventListener('click', addSelectedAntibiotic);
printBtn.addEventListener('click', () => { exportPrescriptionSummary(); window.print(); });
populateAntibioticOptions();
renderPrescriptions();
