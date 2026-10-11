const fallbackAntibioticCatalog = {
  amoxicillin: {
    key: 'amoxicillin',
    name: 'Amoxicillin',
    indications: [
      { name: 'Acute otitis media', dose: 45, doseUnit: 'mg', strength: 400, frequency: 2, frequencyUnit: 'times/day', duration: 7 },
      { name: 'Group A strep pharyngitis', dose: 50, doseUnit: 'mg', strength: 250, frequency: 1, frequencyUnit: 'times/day', duration: 10 }
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
    notes: 'Confirm local guidance, weight, and patient factors before prescribing.'
  },
  clavulanate: {
    key: 'clavulanate',
    name: 'Amoxicillin + Clavulanic acid',
    indications: [
      { name: 'Bacterial sinusitis', dose: 45, doseUnit: 'mg', strength: 400, frequency: 2, frequencyUnit: 'times/day', duration: 10 },
      { name: 'Bite wound prophylaxis', dose: 25, doseUnit: 'mg', strength: 250, frequency: 2, frequencyUnit: 'times/day', duration: 5 }
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
    notes: 'Check formulation strength and renal dosing before finalising therapy.'
  },
  azithromycin: {
    key: 'azithromycin',
    name: 'Azithromycin',
    indications: [
      { name: 'Atypical pneumonia', dose: 10, doseUnit: 'mg', strength: 200, frequency: 1, frequencyUnit: 'times/day', duration: 5 },
      { name: 'Pertussis exposure', dose: 10, doseUnit: 'mg', strength: 200, frequency: 1, frequencyUnit: 'times/day', duration: 5 }
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
    notes: 'Check for patient-specific contraindications and any local azithromycin guidance.'
  }
};

const state = { selected: [], weightUnit: 'kg', antibioticCatalog: {} };
const weightInput = document.getElementById('weightKg');
const weightUnit = document.getElementById('weightUnit');
const weightToggle = document.getElementById('weightToggle');
const ageInput = document.getElementById('patientAge');
const selectEl = document.getElementById('antibioticSelect');
const addBtn = document.getElementById('addAntibioticBtn');
const prescriptionList = document.getElementById('prescriptionList');
const printBtn = document.getElementById('printButton');
const notesEl = document.getElementById('clinicalNotes');
const signatureToggleBtn = document.getElementById('signatureToggleBtn');
const signaturePanel = document.getElementById('signaturePanel');
const signatureCanvas = document.getElementById('signatureCanvas');
const signatureClearBtn = document.getElementById('signatureClearBtn');
const signatureSaveBtn = document.getElementById('signatureSaveBtn');
const signatureContext = signatureCanvas.getContext('2d');

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'antibiotic';
}

function normalizeCatalog(catalogInput) {
  if (!catalogInput) return {};
  const source = Array.isArray(catalogInput) ? catalogInput : Object.values(catalogInput);
  return source.reduce((catalog, antibiotic) => {
    const key = antibiotic.key || slugify(antibiotic.name);
    catalog[key] = antibiotic;
    return catalog;
  }, {});
}

function setDefaultWeightDisplay() {
  weightUnit.textContent = state.weightUnit;
  weightToggle.textContent = state.weightUnit === 'kg' ? 'kg → lb' : 'lb → kg';
}

async function loadAntibioticCatalog() {
  try {
    const response = await fetch('./data/antibiotics.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    state.antibioticCatalog = normalizeCatalog(payload);
  } catch (error) {
    console.warn('Falling back to embedded antibiotic configuration.', error);
    state.antibioticCatalog = normalizeCatalog(fallbackAntibioticCatalog);
  }

  populateAntibioticOptions();
  renderPrescriptions();
}

function populateAntibioticOptions() {
  const entries = Object.entries(state.antibioticCatalog);
  selectEl.innerHTML = '';

  entries.forEach(([key, antibiotic]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = antibiotic.name;
    selectEl.appendChild(option);
  });

  if (entries.length > 0) {
    selectEl.value = entries[0][0];
  }
}

function formatNumber(value) {
  return Number.isFinite(value) ? Number(value.toFixed(1)).toString() : '0';
}

function getWeightKg() {
  const weight = Number(weightInput.value) || 0;
  return state.weightUnit === 'lbs' ? weight / 2.20462 : weight;
}

function dailyDoseForAntibiotic(antibiotic, weightKg) {
  return (Number(antibiotic.dailyDoseMgPerKg) || 0) * weightKg;
}

function perDoseAmount(antibiotic, weightKg) {
  return dailyDoseForAntibiotic(antibiotic, weightKg) / (Number(antibiotic.frequency) || 1);
}

function recommendedFormulation(antibiotic, weightKg) {
  const dosePerAdministration = perDoseAmount(antibiotic, weightKg);
  return antibiotic.formulation.map((option) => {
    const concentration = Number(option.concentration) || 0;
    const unitsPerDose = concentration > 0 ? dosePerAdministration / concentration : 0;
    return {
      ...option,
      recommendedVolume: unitsPerDose,
      label: option.label
    };
  });
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
  return frequency > 0 ? frequency : 0;
}

function calculateTotalQuantity(item) {
  const dose = Number(item.dose) || 0;
  const doseInMg = item.doseUnit === 'ml' ? dose * (Number(item.strength) || 0) : dose;
  const days = Number(item.duration) || 1;
  return doseInMg * getDosesPerDay(item) * days;
}

function createNumberInput(labelText, value, step, onInput) {
  const label = document.createElement('label');
  label.innerHTML = `<span>${labelText}</span>`;
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.step = step;
  input.value = value;
  input.addEventListener('input', (event) => onInput(Number(event.target.value)));
  label.appendChild(input);
  return { label, input };
}

function buildDosePanel(dosing, headingText) {
  const panel = document.createElement('section');
  panel.className = 'dose-panel';

  const heading = document.createElement('h3');
  heading.textContent = headingText;
  panel.appendChild(heading);

  const totalBox = document.createElement('div');
  totalBox.className = 'total-quantity';
  totalBox.innerHTML = '<span>Total quantity</span><strong></strong>';
  const total = totalBox.querySelector('strong');

  const updateTotal = () => {
    total.textContent = `${formatNumber(calculateTotalQuantity(dosing))} mg`;
  };

  const doseRow = document.createElement('div');
  doseRow.className = 'dose-input-row';
  const dose = createNumberInput('Dose', dosing.dose, '0.1', (value) => {
    dosing.dose = value;
    updateTotal();
  });
  doseRow.appendChild(dose.label);

  const doseUnit = document.createElement('label');
  doseUnit.innerHTML = '<span>Unit</span>';
  const doseUnitSelect = document.createElement('select');
  doseUnitSelect.innerHTML = '<option value="mg">mg</option><option value="ml">mL</option>';
  doseUnitSelect.value = dosing.doseUnit || 'mg';
  doseUnitSelect.addEventListener('change', () => {
    dosing.doseUnit = doseUnitSelect.value;
    strength.label.style.display = dosing.doseUnit === 'ml' ? '' : 'none';
    updateTotal();
  });
  doseUnit.appendChild(doseUnitSelect);
  doseRow.appendChild(doseUnit);

  const strength = createNumberInput('Strength (mg/mL)', dosing.strength, '0.1', (value) => {
    dosing.strength = value;
    updateTotal();
  });
  strength.label.style.display = dosing.doseUnit === 'ml' ? '' : 'none';

  const frequencyRow = document.createElement('div');
  frequencyRow.className = 'dose-input-row';
  const frequency = createNumberInput('Frequency', dosing.frequency, '0.1', (value) => {
    dosing.frequency = value;
    updateTotal();
  });
  frequencyRow.appendChild(frequency.label);

  const frequencyUnit = document.createElement('label');
  frequencyUnit.innerHTML = '<span>Schedule</span>';
  const frequencyUnitSelect = document.createElement('select');
  frequencyUnitSelect.innerHTML = '<option value="times/day">times/day</option><option value="hours">hours</option><option value="BID">BID</option><option value="TID">TID</option><option value="QID">QID</option>';
  frequencyUnitSelect.value = dosing.frequencyUnit || 'times/day';
  frequencyUnitSelect.addEventListener('change', () => {
    dosing.frequencyUnit = frequencyUnitSelect.value;
    frequency.input.disabled = ['BID', 'TID', 'QID'].includes(dosing.frequencyUnit);
    if (frequency.input.disabled) {
      frequency.input.value = '1';
      dosing.frequency = 1;
    }
    updateTotal();
  });
  frequency.input.disabled = ['BID', 'TID', 'QID'].includes(dosing.frequencyUnit);
  frequencyUnit.appendChild(frequencyUnitSelect);
  frequencyRow.appendChild(frequencyUnit);

  const duration = createNumberInput('Duration (days)', dosing.duration, '1', (value) => {
    dosing.duration = value;
    updateTotal();
  });

  panel.append(doseRow, strength.label, frequencyRow, duration.label, totalBox);
  updateTotal();
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
    if (selectedItem.indication === indication.name) option.selected = true;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    selectedItem.indication = select.value;
  });

  label.appendChild(select);
  return label;
}

function getDoseValidation(antibiotic, item, weightKg) {
  const weightInKg = Number(weightKg) || 0;
  const referenceDaily = dailyDoseForAntibiotic(antibiotic, weightInKg);
  const frequency = getDosesPerDay(item) || 1;
  const doseInMg = item.doseUnit === 'ml' ? (Number(item.dose) || 0) * (Number(item.strength) || 0) : (Number(item.dose) || 0);
  const actualDaily = doseInMg * frequency;

  if (referenceDaily <= 0) {
    return { label: 'Reference only', tone: 'safe' };
  }

  const ratio = actualDaily / referenceDaily;
  if (ratio >= 0.9 && ratio <= 1.1) {
    return { label: 'Within reference', tone: 'safe' };
  }
  if (ratio >= 0.75 && ratio <= 1.4) {
    return { label: 'Review dosing', tone: 'warning' };
  }
  return { label: 'Outside reference', tone: 'danger' };
}

function buildCard(selectedItem, antibiotic, weightKg) {
  const totalDaily = dailyDoseForAntibiotic(antibiotic, weightKg);
  const perDose = perDoseAmount(antibiotic, weightKg);
  const recommended = recommendedFormulation(antibiotic, weightKg);
  const validation = getDoseValidation(antibiotic, selectedItem.incoming, weightKg);

  const card = document.createElement('article');
  card.className = 'prescription-card';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-button';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => {
    state.selected = state.selected.filter((item) => item.id !== selectedItem.id);
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
    <span class="validation-badge ${validation.tone}">${validation.label}</span>
  `;

  const indication = buildIndicationSelect(antibiotic, selectedItem);
  const top = document.createElement('div');
  top.className = 'card-top';
  top.append(title, meta, indication);

  const dosePanels = document.createElement('div');
  dosePanels.className = 'dose-panels';
  dosePanels.append(
    buildDosePanel(selectedItem.incoming, 'Incoming prescriber dosing'),
    buildDosePanel(selectedItem.outgoing, 'Recommended target dosing')
  );

  const dosingInfo = document.createElement('div');
  dosingInfo.className = 'dose-info';
  dosingInfo.innerHTML = `
    <p><strong>Reference total daily dose:</strong> ${formatNumber(totalDaily)} mg/day</p>
    <p><strong>Reference per-dose amount:</strong> ${formatNumber(perDose)} mg/dose</p>
    <p><strong>Suggested formulation:</strong> ${recommended.map((option) => `${option.label} (~${formatNumber(option.recommendedVolume)} doses)`).join(', ')}</p>
  `;

  const note = document.createElement('p');
  note.className = 'card-note';
  note.textContent = antibiotic.notes;

  card.append(top, dosePanels, dosingInfo, note);
  return card;
}

function renderPrescriptions() {
  prescriptionList.innerHTML = '';

  if (state.selected.length === 0) {
    prescriptionList.innerHTML = '<div class="empty-state">No antibiotics added yet. Select a medication and add it to build a prescription.</div>';
    return;
  }

  const weightKg = getWeightKg();
  state.selected.forEach((item) => {
    const antibiotic = state.antibioticCatalog[item.key];
    if (!antibiotic) return;
    const card = buildCard(item, antibiotic, weightKg);
    prescriptionList.appendChild(card);
  });
}

function addSelectedAntibiotic() {
  const key = selectEl.value;
  if (!key || !state.antibioticCatalog[key]) return;
  if (state.selected.some((item) => item.key === key)) return;

  const antibiotic = state.antibioticCatalog[key];
  const indication = antibiotic.indications[0];
  const id = `${key}-${Date.now()}`;

  state.selected.push({
    id,
    key,
    indication: indication.name,
    incoming: {
      dose: indication.dose,
      doseUnit: indication.doseUnit,
      strength: indication.strength,
      frequency: indication.frequency,
      frequencyUnit: indication.frequencyUnit,
      duration: indication.duration
    },
    outgoing: {
      dose: Number((perDoseAmount(antibiotic, getWeightKg()) || 0).toFixed(1)),
      doseUnit: 'mg',
      strength: Number((antibiotic.formulation[0]?.concentration || 0).toFixed(1)),
      frequency: antibiotic.frequency,
      frequencyUnit: 'times/day',
      duration: 5
    }
  });

  renderPrescriptions();
}

function exportPrescriptionSummary() {
  const weightKgText = `${formatNumber(getWeightKg())} kg`;
  const notes = notesEl.value ? `\nClinical notes: ${notesEl.value}` : '';
  const lines = [
    'Pediatric Antibiotic Calculator',
    '==============================',
    `Weight: ${weightKgText}`,
    `Age: ${formatNumber(Number(ageInput.value) || 0)} years`,
    ...state.selected.map((item) => {
      const antibiotic = state.antibioticCatalog[item.key];
      return `${antibiotic.name}: ${item.indication}`;
    }),
    notes,
    '',
    'Generated from the browser-based calculator.'
  ];

  const text = lines.join('\n');
  const newWindow = window.open('', '_blank');
  newWindow.document.write(`<pre>${text}</pre>`);
  newWindow.document.close();
}

function toggleWeightUnit() {
  const currentWeight = Number(weightInput.value);
  if (Number.isFinite(currentWeight) && currentWeight > 0) {
    if (state.weightUnit === 'kg') {
      weightInput.value = formatNumber(currentWeight * 2.20462);
      state.weightUnit = 'lbs';
    } else {
      weightInput.value = formatNumber(currentWeight / 2.20462);
      state.weightUnit = 'kg';
    }
  } else {
    state.weightUnit = state.weightUnit === 'kg' ? 'lbs' : 'kg';
  }

  setDefaultWeightDisplay();
  renderPrescriptions();
}

function setupSignaturePad() {
  const STORAGE_KEY = `pediatric-antibiotic-calculator.signature.${btoa(navigator.userAgent || 'browser')}`;

  const fillCanvasBackground = () => {
    signatureContext.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    signatureContext.fillStyle = '#ffffff';
    signatureContext.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    signatureContext.strokeStyle = '#1f2a37';
    signatureContext.lineWidth = 2.5;
    signatureContext.lineCap = 'round';
    signatureContext.lineJoin = 'round';
  };

  let drawing = false;

  const beginDrawing = (event) => {
    drawing = true;
    const point = getCanvasPoint(event);
    signatureContext.beginPath();
    signatureContext.moveTo(point.x, point.y);
  };

  const draw = (event) => {
    if (!drawing) return;
    const point = getCanvasPoint(event);
    signatureContext.lineTo(point.x, point.y);
    signatureContext.stroke();
  };

  const endDrawing = () => {
    drawing = false;
    signatureContext.beginPath();
  };

  const getCanvasPoint = (event) => {
    const rect = signatureCanvas.getBoundingClientRect();
    const scaleX = signatureCanvas.width / rect.width;
    const scaleY = signatureCanvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };

  const clearSignature = () => {
    fillCanvasBackground();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Unable to clear stored browser signature.', error);
    }
  };

  const saveSignature = () => {
    const dataUrl = signatureCanvas.toDataURL('image/png');
    try {
      localStorage.setItem(STORAGE_KEY, dataUrl);
    } catch (error) {
      console.warn('Unable to save signature for this browser.', error);
    }
  };

  const loadSignature = () => {
    try {
      const savedSignature = localStorage.getItem(STORAGE_KEY);
      if (!savedSignature) return;
      const image = new Image();
      image.onload = () => {
        fillCanvasBackground();
        signatureContext.drawImage(image, 0, 0, signatureCanvas.width, signatureCanvas.height);
      };
      image.src = savedSignature;
    } catch (error) {
      console.warn('Unable to load saved signature from this browser.', error);
    }
  };

  fillCanvasBackground();
  loadSignature();

  signatureCanvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    beginDrawing(event);
  });
  signatureCanvas.addEventListener('pointermove', draw);
  signatureCanvas.addEventListener('pointerup', () => {
    endDrawing();
    saveSignature();
  });
  signatureCanvas.addEventListener('pointerleave', () => {
    endDrawing();
    saveSignature();
  });

  signatureClearBtn.addEventListener('click', clearSignature);
  signatureSaveBtn.addEventListener('click', saveSignature);

  signatureToggleBtn.addEventListener('click', () => {
    const isHidden = signaturePanel.classList.toggle('hidden');
    signatureToggleBtn.textContent = isHidden ? 'Reveal signature box' : 'Hide signature box';
    signatureToggleBtn.setAttribute('aria-expanded', String(!isHidden));
    if (!isHidden) {
      loadSignature();
    }
  });
}

weightInput.addEventListener('input', renderPrescriptions);
weightToggle.addEventListener('click', toggleWeightUnit);
addBtn.addEventListener('click', addSelectedAntibiotic);
printBtn.addEventListener('click', exportPrescriptionSummary);

setDefaultWeightDisplay();
setupSignaturePad();
loadAntibioticCatalog();
