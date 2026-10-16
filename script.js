//////////////////////////////////////////////
//
//        DATA STRUCTURES
//
//////////////////////////////////////////////
//All strengths of abx listed are in (mg/5mL)
const antibioticCatalog = {
  Amoxicillin: {
    strengths: [125, 250],
    packSizes: {
      125: [100, 150],
      250: [100, 150],
    },
    typicalDose: { min: 40, max: 90 },
    maxDailyAmoxicillinMg: 1000,
    clavulanateRatio: 0,
    supportsExtraAmoxicillin: false,
    supportsLoadingDose: false,
  },
  'Amoxicillin-Clavulanate': {
    strengths: [125, 200, 250, 400],
    packSizes: {
      125: [100],
      200: [70],
      250: [100],
      400: [70],
    },
    typicalDose: { min: 45, max: 90 },
    maxDailyAmoxicillinMg: 3000,
    clavulanateRatio: 7,
    strengthToClavRatio: {
      125: 4,
      200: 7,
      250: 4,
      400: 7,
    },
    supportsExtraAmoxicillin: true,
    supportsLoadingDose: false,
  },
  Azithromycin: {
    strengths: [100, 200],
    packSizes: {
      100: [15],
      200: [15, 22.5, 37.5],
    },
    typicalDose: { min: 5, max: 10, loading: 10 },
    maxDailyAmoxicillinMg: null,
    clavulanateRatio: 0,
    supportsExtraAmoxicillin: false,
    supportsLoadingDose: true,
  },
};

const antibiotics = Object.keys(antibioticCatalog);

//////////////////////////////////////////////
//
//          DOM ELEMENTS (populated on init)
//
//////////////////////////////////////////////
let weightInput;
let weightToggle;
let weightUnitLabel;
let clinicalWeightValue;
let antibioticSelect;
let doseValueInput;
let doseUnitSelect;
let strengthMgInput;
let strengthMlSelect;
let frequencyInput;
let daysInput;
let dosingResults;
let packagingDisplay;
let printButton;
let frequencyEnglish;
let strengthPreset;
let customStrengthFields;
let extraAmoxicillinBlock;
let extraAmoxicillinToggle;
let extraAmoxicillinFields;
let extraAmoxicillinDoseInput;
let extraAmoxicillinUnitSelect;
let extraAmoxicillinStrengthMgInput;
let extraAmoxicillinStrengthMlSelect;
let azithromycinLoadingBlock;
let azithromycinLoadingToggle;
let azithromycinLoadingDoseInput;
let mgDoseTranslation;

const state = {
  weightKg: 20,
  weightUnit: 'kg',
  packagingSelection: {},
};

function formatNumber(value, digits = 1) {
  if (!Number.isFinite(value) || value < 0) return '--';
  return Number(value).toFixed(digits).replace(/\.0+$/, '');
}

function populateAntibiotics() {
  if (!antibioticSelect) return;

  try {
    antibioticSelect.innerHTML = antibiotics
      .map((name) => `<option value="${name}">${name}</option>`)
      .join('');

    antibioticSelect.value = antibiotics[0] || '';
    // default strength ml
    if (strengthMlSelect) strengthMlSelect.value = '5';

    if (strengthMgInput) strengthMgInput.value = '';
    if (doseValueInput) doseValueInput.value = '';
    if (frequencyInput) frequencyInput.value = '';
    if (daysInput) daysInput.value = '';
    if (extraAmoxicillinDoseInput) extraAmoxicillinDoseInput.value = '';
    if (azithromycinLoadingDoseInput) azithromycinLoadingDoseInput.value = '';
    if (azithromycinLoadingToggle) azithromycinLoadingToggle.checked = false;

    updateStrengthPresetOptions();
  } catch (err) {
    console.error('populateAntibiotics failed', err);
    // Fallback: create minimal options
    antibioticSelect.innerHTML = '<option value="Amoxicillin">Amoxicillin</option>';
    antibioticSelect.value = 'Amoxicillin';
  }
}

function updateStrengthPresetOptions() {
  const config = getSelectedAntibioticConfig();
  if (!strengthPreset) return;

  const strengths = config?.strengths || [];
  const presetOptions = strengths.map((strength) => (
    `<option value="${strength}">${strength} mg per ${strengthMlSelect ? strengthMlSelect.value : 5} mL</option>`
  ));

  presetOptions.push('<option value="custom">Custom</option>');
  strengthPreset.innerHTML = presetOptions.join('');

  // choose the highest available strength as default
  const preferredDefault = strengths.length ? Math.max(...strengths) : 0;
  if (preferredDefault > 0) {
    strengthPreset.value = String(preferredDefault);
    if (strengthMgInput) strengthMgInput.value = String(preferredDefault);
  } else {
    strengthPreset.value = 'custom';
  }
}

function updateCustomFieldVisibility() {
  const selected = antibioticSelect ? antibioticSelect.value : null;
  const config = selected ? antibioticCatalog[selected] : null;
  const showExtraAmoxicillin = Boolean(config?.supportsExtraAmoxicillin);
  const showLoadingDose = Boolean(config?.supportsLoadingDose);
  const isCustomStrength = strengthPreset ? String(strengthPreset.value) === 'custom' : false;

  if (customStrengthFields) customStrengthFields.classList.toggle('hidden', !isCustomStrength);
  if (extraAmoxicillinBlock) extraAmoxicillinBlock.classList.toggle('hidden', !showExtraAmoxicillin);
  if (azithromycinLoadingBlock) azithromycinLoadingBlock.classList.toggle('hidden', !showLoadingDose);

  if (!showExtraAmoxicillin && extraAmoxicillinToggle && extraAmoxicillinFields) {
    extraAmoxicillinToggle.checked = false;
    extraAmoxicillinFields.classList.add('hidden');
    extraAmoxicillinDoseInput.value = '';
    extraAmoxicillinStrengthMgInput.value = '';
  }

  if (!showLoadingDose && azithromycinLoadingToggle) {
    azithromycinLoadingToggle.checked = false;
    azithromycinLoadingDoseInput.value = '';
  }
}

function getActiveWeightKg() {
  const weightValue = Number(weightInput?.value);
  if (!Number.isFinite(weightValue) || weightValue <= 0) {
    return 0;
  }

  return state.weightUnit === 'kg' ? weightValue : weightValue * 0.453592;
}

function updateClinicalWeightDisplay() {
  const weightKg = getActiveWeightKg();
  const displayWeight = weightKg > 0 ? `${formatNumber(weightKg, 1)} kg` : '--.- kg';
  if (clinicalWeightValue) clinicalWeightValue.textContent = displayWeight;
}

function toggleWeightUnit() {
  const currentValue = Number(weightInput?.value);

  if (!Number.isFinite(currentValue) || currentValue <= 0) {
    state.weightKg = 20;
    state.weightUnit = 'kg';
    if (weightInput) weightInput.value = 20;
    if (weightUnitLabel) weightUnitLabel.textContent = 'kg';
    updateClinicalWeightDisplay();
    renderDosingResults();
    return;
  }

  if (state.weightUnit === 'kg') {
    state.weightKg = currentValue;
    state.weightUnit = 'lb';
    if (weightInput) weightInput.value = formatNumber(currentValue / 0.453592, 1);
  } else {
    state.weightKg = currentValue * 0.453592;
    state.weightUnit = 'kg';
    if (weightInput) weightInput.value = formatNumber(state.weightKg, 1);
  }

  if (weightUnitLabel) weightUnitLabel.textContent = state.weightUnit;
  updateClinicalWeightDisplay();
  renderDosingResults();
}

function parseFrequency(input) {
  const value = String(input || '').trim().toLowerCase();

  if (!value) {
    return { hours: 24, label: 'daily', dosesPerDay: 1, english: 'Daily' };
  }

  if (value.includes('qid') || value.includes('q6h')) {
    return { hours: 6, label: 'every 6 hours', dosesPerDay: 4, english: 'Every 6 hours' };
  }

  if (value.includes('tid') || value.includes('q8h')) {
    return { hours: 8, label: 'every 8 hours', dosesPerDay: 3, english: 'Every 8 hours' };
  }

  if (value.includes('bid') || value.includes('q12h')) {
    return { hours: 12, label: 'every 12 hours', dosesPerDay: 2, english: 'Every 12 hours' };
  }

  if (value.includes('daily') || value.includes('qd') || value.includes('q24h')) {
    return { hours: 24, label: 'daily', dosesPerDay: 1, english: 'Daily' };
  }

  const qMatch = value.match(/q(\d+)h/);
  if (qMatch) {
    const hours = Number(qMatch[1]);
    if (hours > 0) {
      return {
        hours,
        label: `every ${hours} hours`,
        dosesPerDay: Math.round(24 / hours),
        english: `Every ${hours} hours`,
      };
    }
  }

  const numericMatch = value.match(/(\d+)/);
  if (numericMatch) {
    const candidate = Number(numericMatch[1]);
    if (candidate > 0) {
      return { hours: candidate, label: `every ${candidate} hours`, dosesPerDay: Math.round(24 / candidate), english: `Every ${candidate} hours` };
    }
  }

  return { hours: 24, label: 'daily', dosesPerDay: 1, english: 'Daily' };
}

function updateFrequencyEnglish() {
  const frequency = parseFrequency(frequencyInput?.value);
  const englishText = frequency.english || 'Daily';
  if (frequencyEnglish) {
    const div = frequencyEnglish.querySelector('div');
    if (div) div.textContent = englishText;
  }
}

function getSelectedAntibioticConfig() {
  const name = antibioticSelect && antibioticSelect.value ? antibioticSelect.value : antibiotics[0];
  return antibioticCatalog[name];
}

function getStrengthSelectionValue() {
  const value = Number(strengthMgInput?.value);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getDoseMgFromInputs(doseValue, unit, strengthMg, volumeMl) {
  const rawDose = Number(doseValue);
  const strength = Number(strengthMg) / (Number(volumeMl) || 1);

  if (!Number.isFinite(rawDose) || rawDose < 0) {
    return 0;
  }

  if (unit === 'mg') {
    return rawDose;
  }

  if (unit === 'ml') {
    return rawDose * strength;
  }

  if (unit === 'doses') {
    return rawDose * strength * 5;
  }

  return rawDose * strength;
}

function getExtraPlainAmoxicillinMgPerDose() {
  if (!antibioticSelect || antibioticSelect.value !== 'Amoxicillin-Clavulanate' || !extraAmoxicillinToggle || !extraAmoxicillinToggle.checked) {
    return 0;
  }

  return getDoseMgFromInputs(
    extraAmoxicillinDoseInput.value,
    extraAmoxicillinUnitSelect.value,
    extraAmoxicillinStrengthMgInput.value,
    extraAmoxicillinStrengthMlSelect.value,
  );
}

function getAzithromycinLoadingDoseMg() {
  if (!antibioticSelect || antibioticSelect.value !== 'Azithromycin' || !azithromycinLoadingToggle || !azithromycinLoadingToggle.checked) {
    return 0;
  }

  const value = Number(azithromycinLoadingDoseInput.value);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function getClavulanateRatio() {
  const config = getSelectedAntibioticConfig();
  const strengthValue = getStrengthSelectionValue();

  if (!config || config.clavulanateRatio === 0) {
    return 0;
  }

  if (config.strengthToClavRatio && config.strengthToClavRatio[strengthValue]) {
    return config.strengthToClavRatio[strengthValue];
  }

  return config.clavulanateRatio;
}

function getStrengthMgPerMl() {
  const mg = Number(strengthMgInput?.value);
  const ml = Number(strengthMlSelect?.value) || 1;

  if (!Number.isFinite(mg) || mg < 0 || !Number.isFinite(ml) || ml <= 0) {
    return 0;
  }

  return mg / ml;
}

function getDoseMgPerDose() {
  const rawDose = Number(doseValueInput?.value);
  const strength = getStrengthMgPerMl();
  const unit = doseUnitSelect ? doseUnitSelect.value : 'mg';

  if (!Number.isFinite(rawDose) || rawDose < 0) {
    return 0;
  }

  if (unit === 'mg') {
    return rawDose;
  }

  if (unit === 'ml') {
    return rawDose * strength;
  }

  if (unit === 'doses') {
    return rawDose * strength * 5;
  }

  return rawDose * strength;
}

function getAmoxicillinDoseComponentMg() {
  if (antibioticSelect && antibioticSelect.value === 'Amoxicillin-Clavulanate') {
    return getDoseMgPerDose() + getExtraPlainAmoxicillinMgPerDose();
  }
  return getDoseMgPerDose();
}

function updateMgDoseTranslation() {
  if (!mgDoseTranslation) return;
  const value = Number(doseValueInput?.value);
  if (!Number.isFinite(value) || value <= 0) {
    mgDoseTranslation.textContent = '0 mg/dose';
    return;
  }

  const doseMg = getDoseMgPerDose();
  mgDoseTranslation.textContent = `${formatNumber(doseMg, 1)} mg/dose`;
}

function calculateRegimen() {
  const weightKg = getActiveWeightKg();
  const config = getSelectedAntibioticConfig();
  const frequency = parseFrequency(frequencyInput?.value);
  const strength = getStrengthMgPerMl() || config.defaultStrength;
  const days = Number(daysInput?.value) || 1;
  const doseMgPerDose = getDoseMgPerDose();
  const extraAmoxicillinMgPerDose = getExtraPlainAmoxicillinMgPerDose();
  const azithromycinLoadingDoseMg = getAzithromycinLoadingDoseMg();
  const clavulanateRatio = getClavulanateRatio();

  const amoxicillinMgPerDose = antibioticSelect && antibioticSelect.value === 'Amoxicillin-Clavulanate'
    ? doseMgPerDose + extraAmoxicillinMgPerDose
    : doseMgPerDose;

  const totalDailyAmoxicillinMg = amoxicillinMgPerDose * frequency.dosesPerDay;
  const totalDailyClavulanateMg = antibioticSelect && antibioticSelect.value === 'Amoxicillin-Clavulanate'
    ? doseMgPerDose * clavulanateRatio * frequency.dosesPerDay
    : 0;

  const baseDailyMg = antibioticSelect && antibioticSelect.value === 'Azithromycin'
    ? doseMgPerDose * frequency.dosesPerDay
    : totalDailyAmoxicillinMg;

  const loadingDoseAdjustment = azithromycinLoadingDoseMg > 0 ? azithromycinLoadingDoseMg : 0;
  const totalDailyMg = antibioticSelect && antibioticSelect.value === 'Azithromycin'
    ? baseDailyMg
    : totalDailyAmoxicillinMg;
  const totalRegimenMg = (totalDailyMg * days) + loadingDoseAdjustment;
  const mgPerKgPerDay = weightKg > 0 ? totalDailyMg / weightKg : 0;
  const minDose = config.typicalDose.min;
  const maxDose = config.typicalDose.max;
  const withinRange = mgPerKgPerDay >= minDose && mgPerKgPerDay <= maxDose;

  const amoxicillinLimitMg = config.maxDailyAmoxicillinMg || null;
  const clavulanateLimitMgPerKg = antibioticSelect && antibioticSelect.value === 'Amoxicillin-Clavulanate' ? 10 : 0;
  const amoxicillinPerDoseLimitExceeded = antibioticSelect && antibioticSelect.value !== 'Azithromycin' && amoxicillinMgPerDose > 1000;
  const amoxicillinLimitExceeded = amoxicillinLimitMg !== null && totalDailyAmoxicillinMg > amoxicillinLimitMg;
  const clavulanateLimitExceeded = clavulanateLimitMgPerKg > 0 && weightKg > 0 && totalDailyClavulanateMg > (clavulanateLimitMgPerKg * weightKg);

  const amoxicillinCapDoseMg = amoxicillinPerDoseLimitExceeded ? 1000 : null;
  const amoxicillinCapDailyDoseMg = amoxicillinCapDoseMg ? amoxicillinCapDoseMg * frequency.dosesPerDay : null;
  const amoxicillinCapMgPerKgPerDay = weightKg > 0 && amoxicillinCapDailyDoseMg ? amoxicillinCapDailyDoseMg / weightKg : null;

  const loadingDoseMgPerKg = azithromycinLoadingDoseMg > 0 && weightKg > 0 ? azithromycinLoadingDoseMg / weightKg : 0;
  const maintenanceDailyDoseMgPerKg = weightKg > 0 ? (doseMgPerDose * frequency.dosesPerDay) / weightKg : 0;

  return {
    weightKg,
    config,
    configName: antibioticSelect ? antibioticSelect.value : null,
    frequency,
    strength,
    days,
    doseMgPerDose,
    extraAmoxicillinMgPerDose,
    azithromycinLoadingDoseMg,
    totalDailyAmoxicillinMg,
    totalDailyClavulanateMg,
    loadingDoseAdjustment,
    totalDailyMg,
    totalRegimenMg,
    mgPerKgPerDay,
    withinRange,
    amoxicillinLimitExceeded,
    amoxicillinPerDoseLimitExceeded,
    amoxicillinCapDoseMg,
    amoxicillinCapDailyDoseMg,
    amoxicillinCapMgPerKgPerDay,
    clavulanateLimitExceeded,
    loadingDoseMgPerKg,
    maintenanceDailyDoseMgPerKg,
    reference: `${formatNumber(minDose, 0)}-${formatNumber(maxDose, 0)} mg/kg/day`,
  };
}

function renderDosingResults() {
  const result = calculateRegimen();

  const warnings = [];
  if (result.amoxicillinPerDoseLimitExceeded) {
    warnings.push(`Amoxicillin exceeds 1000 mg/dose; the original prescription is too high. Maximum safe dose would be ${formatNumber(result.amoxicillinCapDoseMg, 1)} mg/dose.`);
  }
  if (result.amoxicillinLimitExceeded) {
    warnings.push('Total amoxicillin exceeds the 1000 mg/day maximum.');
  }
  if (result.clavulanateLimitExceeded) {
    warnings.push('Clavulanate exceeds 10 mg/kg/day for the current weight — higher risk for diarrhea.');
  }
  if (result.azithromycinLoadingDoseMg > 0) {
    warnings.push('Initial loading dose included for azithromycin.');
  }
  if (!result.withinRange && warnings.length === 0) {
    warnings.push('Outside the usual pediatric reference range; confirm with local guidelines.');
  }

  const statusClass = warnings.length > 0 ? 'status-warning' : result.withinRange ? 'status-success' : 'status-warning';
  const statusText = warnings.length > 0
    ? warnings.join(' ')
    : 'Within the typical pediatric outpatient reference range.';

  let supplementMarkup = '';
  if (antibioticSelect && antibioticSelect.value === 'Amoxicillin-Clavulanate') {
    supplementMarkup = `
      <p><strong>Amoxicillin:</strong> ${formatNumber(result.totalDailyAmoxicillinMg, 1)} mg/day (${formatNumber(result.totalDailyAmoxicillinMg / Math.max(result.weightKg, 1), 1)} mg/kg/day)</p>
      <p><strong>Clavulanate:</strong> ${formatNumber(result.totalDailyClavulanateMg, 1)} mg/day (${formatNumber(result.totalDailyClavulanateMg / Math.max(result.weightKg, 1), 1)} mg/kg/day)</p>
      <p><strong>Reference dose:</strong> ${result.reference}</p>
    `;
  }

  if (antibioticSelect && antibioticSelect.value === 'Azithromycin') {
    supplementMarkup = result.azithromycinLoadingDoseMg > 0
      ? `
        <p><strong>Loading dose:</strong> ${formatNumber(result.loadingDoseMgPerKg, 1)} mg/kg stat + ${formatNumber(result.maintenanceDailyDoseMgPerKg, 1)} mg/kg/day</p>
        <p><strong>Reference dose:</strong> ${result.reference}</p>
      `
      : `
        <p><strong>Reference dose:</strong> ${result.reference}</p>
      `;
  }

  if (result.amoxicillinPerDoseLimitExceeded) {
    supplementMarkup += `
      <div class="warning-callout">
        <strong>Maximum safe amoxicillin dose:</strong> ${formatNumber(result.amoxicillinCapDoseMg, 1)} mg/dose = ${formatNumber(result.amoxicillinCapMgPerKgPerDay, 1)} mg/kg/day at this frequenc[...]
      </div>
    `;
  }

  const dailyDoseLabel = (antibioticSelect && antibioticSelect.value === 'Azithromycin' && result.azithromycinLoadingDoseMg > 0)
    ? `${formatNumber(result.loadingDoseMgPerKg, 1)} mg/kg stat + ${formatNumber(result.maintenanceDailyDoseMgPerKg, 1)} mg/kg/day`
    : `${formatNumber(result.mgPerKgPerDay, 1)} mg/kg/day`;

  if (dosingResults) {
    dosingResults.className = `results-panel ${statusClass}`;
    dosingResults.innerHTML = `
      <h3>Regimen review</h3>
      <p><strong>Daily dose:</strong> ${dailyDoseLabel} <span class="reference-inline">(ref ${result.reference})</span></p>
      <p><strong>Total course dose:</strong> ${formatNumber(result.totalRegimenMg, 1)} mg</p>
      <p><strong>Reference range:</strong> ${result.reference}</p>
      ${supplementMarkup}
      <p class="summary-text">${statusText}</p>
    `;
  }

I stopped copying due to length. The getfile showed the full file earlier.