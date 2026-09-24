const antibioticCatalog = {
  amoxicillin: {
    name: 'Amoxicillin',
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
    notes: 'Commonly used for mild-to-moderate respiratory and ENT infections.'
  },
  clavulanate: {
    name: 'Amoxicillin + Clavulanic acid',
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
    notes: 'Ensure the clavulanate component is appropriate for the indication and dose is adjusted for age.'
  },
  azithromycin: {
    name: 'Azithromycin',
    dailyDoseMgPerKg: 10,
    frequency: 1,
    route: 'PO',
    interval: 'daily',
    formulation: [
      { label: '200 mg/5 mL', concentration: 40, unit: 'mg/mL' },
      { label: '250 mg tablet', concentration: 250, unit: 'mg/tablet' },
      { label: '600 mg tablet', concentration: 600, unit: 'mg/tablet' }
    ],
    notes: 'Often used for community-acquired pneumonia and selected respiratory pathogens.'
  }
};

const state = {
  selected: [],
  weightUnit: 'kg'
};

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
  const bestMatch = antibiotic.formulation
    .map((option) => {
      const volumeOrCount = option.concentration > 0 ? dosePerAdministration / option.concentration : 0;
      return {
        option,
        volumeOrCount,
        difference: Math.abs(volumeOrCount - Math.round(volumeOrCount || 0))
      };
    })
    .sort((a, b) => a.difference - b.difference)[0];

  return bestMatch || antibiotic.formulation[0];
}

function buildCard(antibioticKey, antibiotic, weightKg) {
  const totalDaily = dailyDoseForAntibiotic(antibiotic, weightKg);
  const perDose = perDoseAmount(antibiotic, weightKg);
  const recommended = recommendedFormulation(antibiotic, weightKg);

  const card = document.createElement('article');
  card.className = 'prescription-card';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-button';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => {
    state.selected = state.selected.filter((item) => item.key !== antibioticKey);
    renderPrescriptions();
  });

  const title = document.createElement('div');
  title.className = 'card-header';
  title.innerHTML = `<h3>${antibiotic.name}</h3>`;
  title.appendChild(removeBtn);

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  meta.innerHTML = `
    <span>${antibiotic.route}</span>
    <span>${antibiotic.interval}</span>
    <span>${antibiotic.frequency}-times daily</span>
  `;

  const dosingInfo = document.createElement('div');
  dosingInfo.className = 'dose-info';
  dosingInfo.innerHTML = `
    <p><strong>Total daily dose:</strong> ${formatNumber(totalDaily)} mg/day</p>
    <p><strong>Per dose:</strong> ${formatNumber(perDose)} mg</p>
    <p><strong>Suggested formulation:</strong> ${recommended.option.label}</p>
    <p><strong>Practical approximation:</strong> ${formatNumber(recommended.volumeOrCount)} unit(s) of ${recommended.option.label}</p>
  `;

  const note = document.createElement('p');
  note.className = 'card-note';
  note.textContent = antibiotic.notes;

  card.append(title, meta, dosingInfo, note);
  return card;
}

function renderPrescriptions() {
  const weightKg = getWeightKg();
  prescriptionList.innerHTML = '';

  if (state.selected.length === 0) {
    prescriptionList.innerHTML = '<div class="empty-state">No antibiotics added yet. Select a medication to build the prescription.</div>';
    return;
  }

  state.selected.forEach(({ key }) => {
    const antibiotic = antibioticCatalog[key];
    if (!antibiotic) return;
    prescriptionList.appendChild(buildCard(key, antibiotic, weightKg));
  });
}

function addSelectedAntibiotic() {
  const key = selectEl.value;
  if (!key || state.selected.some((item) => item.key === key)) {
    return;
  }

  state.selected.push({ key });
  renderPrescriptions();
}

function exportPrescriptionSummary() {
  const weightKg = getWeightKg();
  const ageYears = Number(ageInput.value) || 0;
  const notes = notesEl.value.trim();

  const lines = [
    'Pediatric Antibiotic Calculator',
    '==============================',
    `Weight: ${formatNumber(weightKg)} kg`,
    `Age: ${formatNumber(ageYears)} years`,
    notes ? `Notes: ${notes}` : null,
    '',
    'Selected antibiotics:'
  ];

  state.selected.forEach(({ key }) => {
    const antibiotic = antibioticCatalog[key];
    const totalDaily = dailyDoseForAntibiotic(antibiotic, weightKg);
    const perDose = perDoseAmount(antibiotic, weightKg);
    lines.push(`- ${antibiotic.name}: ${formatNumber(totalDaily)} mg/day total; ${formatNumber(perDose)} mg per dose`);
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
  if (Number.isFinite(currentWeight) && currentWeight > 0) {
    weightInput.value = state.weightUnit === 'kg'
      ? formatNumber(currentWeight * 2.20462)
      : formatNumber(currentWeight / 2.20462);
  }

  state.weightUnit = state.weightUnit === 'kg' ? 'lbs' : 'kg';
  weightUnit.textContent = state.weightUnit;
  weightToggle.textContent = state.weightUnit === 'kg' ? 'Switch to lbs' : 'Switch to kg';
  weightToggle.setAttribute('aria-label', `Switch weight to ${state.weightUnit === 'kg' ? 'pounds' : 'kilograms'}`);
  renderPrescriptions();
}

weightInput.addEventListener('input', renderPrescriptions);
ageInput.addEventListener('input', renderPrescriptions);
weightToggle.addEventListener('click', toggleWeightUnit);
addBtn.addEventListener('click', addSelectedAntibiotic);
printBtn.addEventListener('click', () => {
  exportPrescriptionSummary();
  window.print();
});

populateAntibioticOptions();
renderPrescriptions();
