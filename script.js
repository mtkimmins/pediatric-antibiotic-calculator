/////////////////////////////////////////////////////
//DATA STRUCTURES
///////////////////////////////////////////////////
const indicationsData = {
  amoxicillin: [
    { name: 'high dose', 
      dose: 45, 
      doseUnit: 'mg', 
      strength: 400, 
      frequency: 2, 
      frequencyUnit: 'times/day', 
      duration: 7, 
      packagings: 
      [
        { strength: '125 mg/5 mL', 
          count: 1 
        }, 
        { strength: '250 mg/5 mL', 
          count: 1 }
        ] 
      },
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

const dosingData = {
  amoxicillin: [
    { name: 'normal dose',
      min_dose: 40,
      max_dose: 40,
      min_frequency: 3,
      max_frequency: 3,
    },
    { name: 'high dose',
      min_dose: 50,
      max_dose: 90,
      min_frequency: 2,
      max_frequency: 3,
    },
    { name: 'high dose (CAP)',
      min_dose: 90,
      max_dose: 90,
      min_frequency: 3,
      max_frequency: 3,
    },
    { name: 'pharyngitis',
      min_dose: 50,
      max_dose: 50,
      min_frequency: 1,
      max_frequency: 2,
    }
  ],
  clavulanate: [
    { name: 'normal dose',
      min_dose: 40,
      max_dose: 40,
      min_frequency: 3,
      max_frequency: 3,
    },
    { name: 'high dose',
      min_dose: 45,
      max_dose: 90,
      min_frequency: 2,
      max_frequency: 2,
    }
  ],
  azithromycin: [
    { name: 'normal dose',
      loading_dose: 10,
      loading_duration: 1,
      min_dose: 5,
      max_dose: 5,
      min_frequency: 1,
      max_frequency: 1
    }
  ]
}
// What are all the pack sizes?
const packagingData = {
  amoxicillin: [
    { name: '125 mg / 5 mL',
      strength: 25,
      strengthUnit: 'mg/mL',
      packSizes: [100,150],
    },
    { name: '250 mg / 5 mL',
      strength: 50,
      strengthUnit: 'mg/mL',
      packSizes: [100,150],
    },
  ],
  clavulanate: [
    { name: '4:1',
      strength: [25,50],
      strengthUnit: 'mg/mL',
      packSizes: [100,150],
    },
    { name: '7:1',
      strength: [40,80],
      strengthUnit: 'mg/mL',
      packSizes: [100,150],
    }
  ],
  azithromycin: [
    { name: '',
      strength: 1,
      strengthUnit: 'mg/mL',
      packSizes: [],
    },
  ],
}
// We must approach this from an indication-first perspective.
// Let us define our scope as all amoxicillin, amoxiclav, and azithro doses for certain indications
// Let us define our scope of indications as: sinusitis, CAP (5y+), pharyngitis, otitis media,
const indicationAssessmentFields = {
  sinusitis: {
    name: 'Sinusitis',
    fields: [
      { key: 'patientAge', label: 'Patient age', type: 'static-age' },
      { key: 'recentAbx', label: 'Recent antibiotics within last 3 months', type: 'checkbox' },
      { key: 'daycare', label: 'Daycare attendance', type: 'checkbox' },
    ],
  },
  cap: {
    name: 'Community Acquired Pneumonia',
    fields: [
      { key: 'patientAge', label: 'Patient age', type: 'static-age' },
    ],
  },
  pharyngitis: {
    name: 'Streptococcal Pharyngitis',
    fields: [],
  },
  otitis_media: {
    name: 'Otitis Media',
    fields: [
      { key: 'patientAge', label: 'Patient age', type: 'static-age' },
      { key: 'duration', label: 'Duration of symptoms', type: 'duration-code', placeholder: '24h or 2d', hint: '2d = 48 hours' },
      { key: 'immunocompromised', label: 'Immunocompromised', type: 'checkbox' },
      { key: 'cranialAnomalies', label: 'Craniofacial anomalies', type: 'checkbox' },
      { key: 'chronic', label: 'Chronic cardiac or pulmonary disease', type: 'checkbox' },
      { key: 'down', label: 'Down syndrome', type: 'checkbox' },
      { key: 'deaf', label: 'Hearing impairment (with or without hearing aids)', type: 'checkbox' },
    ],
  },
};

const antibioticCatalog = {
  amoxicillin: {
    name: 'Amoxicillin',
    indications: [
      { name: 'normal dose',
        min_dose: 40,
        max_dose: 90,
        doseUnit: 'mg/kg',
        min_frequency: 2,
        max_frequency: 3,
        min_duration: 1,
        max_duration: 1,
        notes: '',
      },
      { name: 'Sinusitis'},
      { name: 'Community Acquired Pneumonia'},
    ],
    formulation: [
      { label: '125 mg/5 mL', concentration: 25, unit: 'mg/mL' },
      { label: '250 mg/5 mL', concentration: 50, unit: 'mg/mL' },
      { label: '500 mg capsule', concentration: 500, unit: 'mg/capsule' },
      { label: '875 mg tablet', concentration: 875, unit: 'mg/tablet' }
    ],
  },
  clavulanate: {
    key: 'clavulanate',
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
    key: 'azithromycin',
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

//////////////////////////////////////////////////////
//STATE AND DOM ELEMENTS
//////////////////////////////////////////////////////
const state = { selected: [], weightUnit: 'kg', antibioticCatalog: {} };
const weightInput = document.getElementById('weightKg');
const weightUnit = document.getElementById('weightUnit');
const weightToggle = document.getElementById('weightToggle');
const ageInput = document.getElementById('patientAge');
const selectEl = document.getElementById('antibioticSelect');
const indicationSelectEl = document.getElementById('indicationSelect');
const addBtn = document.getElementById('addAntibioticBtn');
const prescriptionList = document.getElementById('prescriptionList');
const printBtn = document.getElementById('printButton');
const notesEl = document.getElementById('clinicalNotes');
const pharSignatureEl = document.getElementById('pharmacistSignature');
const lastUpdatedEl = document.getElementById('lastUpdatedDate');
const sigBtn = document.getElementById('signatureToggleBtn');
const signaturePanel = document.getElementById('signaturePanel');
const signatureCanvas = document.getElementById('signatureCanvas');
const signatureClearBtn = document.getElementById('signatureClearBtn');
const signatureSaveBtn = document.getElementById('signatureSaveBtn');

/////////////////////////////////////////////
//SETUP FUNCTIONS
/////////////////////////////////////////////
function getAllowedAntibiotics() {
  const indication = indicationSelectEl.value;
  const ageValue = Number(ageInput.value) || 0;

  const allowedByIndication = {
    sinusitis: ['amoxicillin', 'clavulanate'],
    cap: ['amoxicillin'],
    pharyngitis: ['amoxicillin'],
    otitis_media: ['amoxicillin', 'clavulanate'],
  };

  if (!indication) {
    return Object.keys(antibioticCatalog);
  }

  let allowed = allowedByIndication[indication] || [];

  if (indication === 'sinusitis') {
    const recentAbx = document.querySelector('input[name="recentAbx"]')?.checked;
    const daycare = document.querySelector('input[name="daycare"]')?.checked;
    if (recentAbx || daycare) {
      allowed = ['clavulanate'];
    }
  }

  if (indication === 'otitis_media') {
    const riskFlags = [
      document.querySelector('input[name="immunocompromised"]')?.checked,
      document.querySelector('input[name="cranialAnomalies"]')?.checked,
      document.querySelector('input[name="chronic"]')?.checked,
      document.querySelector('input[name="down"]')?.checked,
      document.querySelector('input[name="deaf"]')?.checked,
    ];

    const hasHighRisk = riskFlags.some(Boolean);
    if (hasHighRisk) {
      allowed = ['clavulanate'];
    } else if (ageValue >= 2) {
      allowed = ['amoxicillin'];
    }
  }

  return allowed.filter((key) => antibioticCatalog[key]);
}

function populateAntibioticOptions() {
  refreshAntibioticOptions();
}

function refreshAntibioticOptions() {
  const allowed = getAllowedAntibiotics();
  const currentValue = selectEl.value;

  selectEl.innerHTML = '';

  if (!allowed.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No antibiotics for this assessment';
    selectEl.appendChild(option);
    return;
  }

  allowed.forEach((key) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = antibioticCatalog[key].name;
    selectEl.appendChild(option);
  });

  if (allowed.includes(currentValue)) {
    selectEl.value = currentValue;
  } else {
    selectEl.value = allowed[0];
  }
}

function populateIndicationOptions() {
  indicationSelectEl.innerHTML = '<option value="">Select indication</option>';
  Object.entries(indicationAssessmentFields).forEach(([key, indication]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = indication.name;
    indicationSelectEl.appendChild(option);
  });
  indicationSelectEl.value = '';
}

// HIGHLIGHT SOME OF THE CHECKBOXES RED OR GREEN BASED ON THEIR IMPACT ON TX
function createAssessmentField(field) {
  const wrapper = document.createElement('div');
  wrapper.className = 'assessment-field';
  
  //CUSTOM INPUT FIELDS
  if (field.type === 'static-age') {
    const row = document.createElement('div');
    row.className = 'static-age-row';
    const label = document.createElement('span');
    label.textContent = field.label;
    const value = document.createElement('strong');
    value.className = 'static-age-value';
    value.textContent = `${formatNumber(Number(ageInput.value) || 0)} years`;
    row.appendChild(label);
    row.appendChild(value);
    wrapper.appendChild(row);
    return wrapper;
  }

  //HAVE THE INPUT FULLY HIGHLIGHT WHEN RESELECTED
  //CHANGE HINT = all durations will be changed into hours for calculation purposes
  //have input format when pressed tab or enter from focused box
  if (field.type === 'duration-code') {
    const label = document.createElement('label');
    label.className = 'field-block';
    const title = document.createElement('span');
    title.textContent = field.label;
    label.appendChild(title);

    const container = document.createElement('div');
    container.className = 'input-with-unit compact';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = field.placeholder || '24h';
    input.setAttribute('aria-label', field.label);

    function normalizeDurationCode(rawValue) {
      const trimmed = String(rawValue || '').trim().toLowerCase();
      if (!trimmed) return '';

      const match = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)\s*(h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks)?$/);
      if (!match) return trimmed;

      const value = Number(match[1]);
      const unit = match[2] || 'h';

      let hours = value;
      if (['d', 'day', 'days'].includes(unit)) hours = value * 24;
      if (['w', 'wk', 'wks', 'week', 'weeks'].includes(unit)) hours = value * 168;

      return `${formatNumber(hours)} hours`;
    }

    //if want to rewrite as user types, blur = input (input does not work, as it fires on every keystroke, which is not desired)
    input.addEventListener('blur', () => {
      const normalized = normalizeDurationCode(input.value);
      if (normalized && normalized !== input.value.trim().toLowerCase()) {
        input.value = normalized;
      }
    });

    const suffix = document.createElement('span');
    suffix.textContent = 'duration';
    container.appendChild(input);
    container.appendChild(suffix);
    label.appendChild(container);

    if (field.hint) {
      const help = document.createElement('small');
      help.className = 'field-help';
      help.textContent = field.hint;
      label.appendChild(help);
    }

    wrapper.appendChild(label);
    return wrapper;
  }

  if (field.type === 'checkbox') {
    const row = document.createElement('label');
    row.className = 'checkbox-row';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = field.key;
    row.appendChild(input);
    const text = document.createElement('span');
    text.textContent = field.label;
    row.appendChild(text);
    wrapper.appendChild(row);
    return wrapper;
  }

  const label = document.createElement('label');
  label.className = 'field-block';
  const text = document.createElement('span');
  text.textContent = field.label;
  label.appendChild(text);

  let control;
  if (field.type === 'textarea') {
    control = document.createElement('textarea');
    control.rows = 3;
    control.placeholder = field.placeholder || '';
  } else if (field.type === 'select') {
    control = document.createElement('select');
    field.options.forEach((optionValue) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue;
      control.appendChild(option);
    });
  } else {
    control = document.createElement('input');
    control.type = field.type === 'number' ? 'number' : 'text';
    control.placeholder = field.placeholder || '';
    if (field.min !== undefined) control.min = String(field.min);
    if (field.max !== undefined) control.max = String(field.max);
    if (field.step !== undefined) control.step = String(field.step);
    if (field.type === 'number' && field.suffix) {
      control.setAttribute('data-suffix', field.suffix);
    }
  }

  if (field.type !== 'textarea' && field.type !== 'select' && field.type !== 'checkbox' && field.suffix) {
    const bag = document.createElement('div');
    bag.className = 'input-with-unit compact';
    const input = control;
    bag.appendChild(input);
    const suffix = document.createElement('span');
    suffix.textContent = field.suffix;
    bag.appendChild(suffix);
    label.appendChild(bag);
  } else {
    label.appendChild(control);
  }

  wrapper.appendChild(label);
  return wrapper;
}

//MUST DEPEND ON INDICATION (CAP, SINUSITIS)
function updateAgeStatusDisplays() {
  const ageValue = Number(ageInput.value) || 0;
  document.querySelectorAll('.static-age-row').forEach((row) => {
    const valueEl = row.querySelector('.static-age-value');
    if (!valueEl) return;
    const status = ageValue < 2 ? 'status-red' : ageValue < 5 ? 'status-yellow' : 'status-green';
    row.classList.remove('status-red', 'status-yellow', 'status-green');
    row.classList.add(status);
    valueEl.textContent = `${formatNumber(ageValue)} years`;
  });
}

function renderAssessmentFields() {
  const container = document.getElementById('assessmentFields');
  if (!container) return;

  const selectedIndication = indicationSelectEl.value;
  container.innerHTML = '';

  if (!selectedIndication) {
    return;
  }

  const indication = indicationAssessmentFields[selectedIndication];
  const fields = indication?.fields ?? [];
  if (!fields.length) {
    const help = document.createElement('p');
    help.className = 'field-help';
    help.textContent = 'No additional assessment prompts for this indication.';
    container.appendChild(help);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'assessment-fields-grid';
  fields.forEach((field) => grid.appendChild(createAssessmentField(field)));
  container.appendChild(grid);
  updateAgeStatusDisplays();
}

///////////////////////////////////////////////////
//HELPER FUNCTIONS
///////////////////////////////////////////////////
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
function exportPrescriptionSummary() {
  const lines = ['Pediatric Antibiotic Calculator', '==============================', `Weight: ${formatNumber(getWeightKg())} kg`, `Age: ${formatNumber(Number(ageInput.value))}`, '', 'Clinical notes:', notesEl.value, ''];
  state.selected.forEach((item) => { const antibiotic = antibioticCatalog[item.key]; lines.push(`${antibiotic.name}:`); lines.push(`  Indication: ${item.indication}`); lines.push(`  Dose: ${item.dose} ${item.doseUnit}`); lines.push(`  Frequency: ${item.frequency} ${item.frequencyUnit}`); lines.push(`  Duration: ${item.duration} days`); lines.push(''); });
  if (pharSignatureEl.value) { lines.push(`Pharmacist: ${pharSignatureEl.value}`); }
  window.print();
}
function addSelectedAntibiotic() {
  const key = selectEl.value; if (!key || state.selected.some((item) => item.key === key)) return;
  const indication = antibioticCatalog[key].indications[0];
  state.selected.push({ key, indication: indication.name, dose: indication.dose, doseUnit: indication.doseUnit, strength: indication.strength, frequency: indication.frequency, frequencyUnit: indication.frequencyUnit, duration: indication.duration });
  renderPrescriptions();
}
////////////////////////////////////////////
//UI BUILDING FUNCTIONS
////////////////////////////////////////////
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

///////////////////////////////////////////////////////////
//RENDERING CARD OPTIONS
////////////////////////////////////////////////////////////
function renderPrescriptions() {
  prescriptionList.innerHTML = '';
  if (state.selected.length === 0) { prescriptionList.innerHTML = '<div class="empty-state">No antibiotics added yet. Select a medication.</div>'; return; }
  const weightKg = getWeightKg(); state.selected.forEach((item) => { const antibiotic = antibioticCatalog[item.key]; const card = buildCard(item, antibiotic, weightKg); prescriptionList.appendChild(card); });
}

function renderAssessment() {
  prescriptionList.innerHTML = '';
  if (state.selected.length === 0) { 
    prescriptionList.innerHTML = '<div class="empty-state">What infection is being treated?</div>'; 
    return; 
  };
  const weightKg = getWeightKg(); 
  state.selected.forEach((item) => { 
    const antibiotic = antibioticCatalog[item.key]; 
    const card = buildCard(item, antibiotic, weightKg); 
    prescriptionList.appendChild(card); 
  });
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

/////////////////////////////////////////////////////////
//WEIGHT CALCULATION FUNCTIONS
/////////////////////////////////////////////////////////
function toggleWeightUnit() {
  const currentWeight = Number(weightInput.value);
  if (Number.isFinite(currentWeight) && currentWeight > 0) weightInput.value = formatNumber(state.weightUnit === 'kg' ? currentWeight * 2.20462 : currentWeight / 2.20462);
  state.weightUnit = state.weightUnit === 'kg' ? 'lbs' : 'kg'; weightUnit.textContent = state.weightUnit; renderPrescriptions();
}
function updateClinicalWeight() {
  const weightKg = getWeightKg(); 
  const weightLbs = weightKg * 2.20462; 
  const clinicalWeightEl = document.getElementById('clinicalWeightValue'); 
  clinicalWeightEl.textContent = `${formatNumber(weightKg)} kg`;
}

/////////////////////////////////////////////////////////////////////////
//SIGNATURE PAD FUNCTIONS
/////////////////////////////////////////////////////////////////////////
function setupSignatureCanvas() {
  const ctx = signatureCanvas.getContext('2d');
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);

  let isDrawing = false;
  let lastPoint = null;

  function getCanvasPoint(event) {
    const rect = signatureCanvas.getBoundingClientRect();
    const scaleX = signatureCanvas.width / rect.width;
    const scaleY = signatureCanvas.height / rect.height;
    const clientX = event.clientX ?? event.touches?.[0]?.clientX ?? 0;
    const clientY = event.clientY ?? event.touches?.[0]?.clientY ?? 0;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function startDrawing(event) {
    isDrawing = true;
    lastPoint = getCanvasPoint(event);
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(lastPoint.x, lastPoint.y);
    ctx.stroke();
    signatureCanvas.setPointerCapture?.(event.pointerId);
  }

  function draw(event) {
    if (!isDrawing) return;
    const point = getCanvasPoint(event);
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPoint = point;
  }

  function stopDrawing(event) {
    if (!isDrawing) return;
    isDrawing = false;
    lastPoint = null;
    ctx.beginPath();
    signatureCanvas.releasePointerCapture?.(event.pointerId);
  }

  signatureCanvas.addEventListener('pointerdown', startDrawing);
  signatureCanvas.addEventListener('pointermove', draw);
  signatureCanvas.addEventListener('pointerup', stopDrawing);
  signatureCanvas.addEventListener('pointerleave', stopDrawing);
  signatureCanvas.addEventListener('pointercancel', stopDrawing);

  signatureClearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  });

  signatureSaveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = signatureCanvas.toDataURL('image/png');
    link.download = 'signature.png';
    link.click();
  });
}

function toggleSignatureSection() {
  const isExpanded = sigBtn.getAttribute('aria-expanded') === 'true';
  const shouldShow = !isExpanded;
  sigBtn.setAttribute('aria-expanded', String(shouldShow));
  sigBtn.textContent = shouldShow ? 'Hide signature section' : 'Show signature section';
  signaturePanel.classList.toggle('hidden', !shouldShow);
}

function initializeSignatureSection() {
  sigBtn.setAttribute('aria-expanded', 'true');
  sigBtn.textContent = 'Hide signature section';
  signaturePanel.classList.remove('hidden');
}


/////////////////////////////////////////////////////////////////////////////////////////
// Main execution
/////////////////////////////////////////////////////////////////////////////////////////
//Initialize
populateAntibioticOptions(); 
populateIndicationOptions();
renderAssessmentFields();
refreshAntibioticOptions();
renderPrescriptions();
setupSignatureCanvas();
initializeSignatureSection();

// Adding event listeners for user interactions
weightInput.addEventListener('input', () => {
  updateClinicalWeight();
  updateAgeStatusDisplays();
  refreshAntibioticOptions();
});
ageInput.addEventListener('input', () => {
  updateAgeStatusDisplays();
  refreshAntibioticOptions();
});
weightToggle.addEventListener('click', toggleWeightUnit); 
selectEl.addEventListener('click', addSelectedAntibiotic); 
indicationSelectEl.addEventListener('change', () => {
  renderAssessmentFields();
  refreshAntibioticOptions();
});
document.getElementById('assessmentFields').addEventListener('change', refreshAntibioticOptions);
document.getElementById('assessmentFields').addEventListener('input', refreshAntibioticOptions);
printBtn.addEventListener('click', exportPrescriptionSummary);
sigBtn.addEventListener('click', toggleSignatureSection);
