//////////////////////////////////////////////
//
//        DATA STRUCTURES
//
/////////////////////////////////////////////
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
//          HELPERS
//
//////////////////////////////////////////////

const state = {
  weightKg: 20,
  weightUnit: 'kg',
  packagingSelection: {},
};

const weightInput = document.getElementById('weightKg');
const weightToggle = document.getElementById('weightToggle');
const weightUnitLabel = document.getElementById('weightUnit');
const clinicalWeightValue = document.getElementById('clinicalWeightValue');
const antibioticSelect = document.getElementById('antibioticName');
const doseValueInput = document.getElementById('doseValue');
const doseUnitSelect = document.getElementById('doseUnit');
const strengthMgInput = document.getElementById('strengthMg');
const strengthMlSelect = document.getElementById('strengthMl');
const frequencyInput = document.getElementById('frequencyInput');
const daysInput = document.getElementById('daysValue');
const dosingResults = document.getElementById('dosingResults');
const packagingDisplay = document.getElementById('packagingDisplay');
const printButton = document.getElementById('printButton');
const frequencyEnglish = document.getElementById('frequencyEnglish');
const strengthPreset = document.getElementById('strengthPreset');
const customStrengthFields = document.getElementById('customStrengthFields');
const extraAmoxicillinBlock = document.getElementById('extraAmoxicillinBlock');
const extraAmoxicillinToggle = document.getElementById('extraAmoxicillinToggle');
const extraAmoxicillinFields = document.getElementById('extraAmoxicillinFields');
const extraAmoxicillinDoseInput = document.getElementById('extraAmoxicillinDose');
const extraAmoxicillinUnitSelect = document.getElementById('extraAmoxicillinUnit');
const extraAmoxicillinStrengthMgInput = document.getElementById('extraAmoxicillinStrengthMg');
const extraAmoxicillinStrengthMlSelect = document.getElementById('extraAmoxicillinStrengthMl');
const azithromycinLoadingBlock = document.getElementById('azithromycinLoadingBlock');
const azithromycinLoadingToggle = document.getElementById('azithromycinLoadingToggle');
const azithromycinLoadingDoseInput = document.getElementById('azithromycinLoadingDose');

function formatNumber(value, digits = 1) {
  if (!Number.isFinite(value) || value < 0) return '--';
  return Number(value).toFixed(digits).replace(/\.0+$/, '');
}

function populateAntibiotics() {
  antibioticSelect.innerHTML = antibiotics
    .map((name) => `<option value="${name}">${name}</option>`)
    .join('');

  antibioticSelect.value = antibiotics[0];
  strengthMlSelect.value = '5';
  strengthMgInput.value = '';
  doseValueInput.value = '';
  frequencyInput.value = '';
  daysInput.value = '';
  extraAmoxicillinDoseInput.value = '';
  azithromycinLoadingDoseInput.value = '';
  azithromycinLoadingToggle.checked = false;
  updateStrengthPresetOptions();
}

function updateStrengthPresetOptions() {
  const config = getSelectedAntibioticConfig();
  const presetOptions = (config.strengths || []).map((strength) => (
    `<option value="${strength}">${strength} mg per ${strengthMlSelect.value || 5} mL</option>`
  ));

  presetOptions.push('<option value="custom">Custom</option>');
  strengthPreset.innerHTML = presetOptions.join('');

  const preferredDefault = Number(config.strengths?.[0]) || 0;
  if (preferredDefault > 0) {
    strengthPreset.value = String(preferredDefault);
    strengthMgInput.value = String(preferredDefault);
  } else {
    strengthPreset.value = 'custom';
  }
}

function updateCustomFieldVisibility() {
  const selected = antibioticSelect.value;
  const config = antibioticCatalog[selected];
  const showExtraAmoxicillin = Boolean(config?.supportsExtraAmoxicillin);
  const showLoadingDose = Boolean(config?.supportsLoadingDose);
  const isCustomStrength = String(strengthPreset.value) === 'custom';

  customStrengthFields.classList.toggle('hidden', !isCustomStrength);
  extraAmoxicillinBlock.classList.toggle('hidden', !showExtraAmoxicillin);
  azithromycinLoadingBlock.classList.toggle('hidden', !showLoadingDose);

  if (!showExtraAmoxicillin) {
    extraAmoxicillinToggle.checked = false;
    extraAmoxicillinFields.classList.add('hidden');
    extraAmoxicillinDoseInput.value = '';
    extraAmoxicillinStrengthMgInput.value = '';
  }

  if (!showLoadingDose) {
    azithromycinLoadingToggle.checked = false;
    azithromycinLoadingDoseInput.value = '';
  }
}

function getActiveWeightKg() {
  const weightValue = Number(weightInput.value);
  if (!Number.isFinite(weightValue) || weightValue <= 0) {
    return 0;
  }

  return state.weightUnit === 'kg' ? weightValue : weightValue * 0.453592;
}

function updateClinicalWeightDisplay() {
  const weightKg = getActiveWeightKg();
  const displayWeight = weightKg > 0 ? `${formatNumber(weightKg, 1)} kg` : '--.- kg';
  clinicalWeightValue.textContent = displayWeight;
}

function toggleWeightUnit() {
  const currentValue = Number(weightInput.value);

  if (!Number.isFinite(currentValue) || currentValue <= 0) {
    state.weightKg = 20;
    state.weightUnit = 'kg';
    weightInput.value = 20;
    weightUnitLabel.textContent = 'kg';
    updateClinicalWeightDisplay();
    renderDosingResults();
    return;
  }

  if (state.weightUnit === 'kg') {
    state.weightKg = currentValue;
    state.weightUnit = 'lb';
    weightInput.value = formatNumber(currentValue / 0.453592, 1);
  } else {
    state.weightKg = currentValue * 0.453592;
    state.weightUnit = 'kg';
    weightInput.value = formatNumber(state.weightKg, 1);
  }

  weightUnitLabel.textContent = state.weightUnit;
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
  const frequency = parseFrequency(frequencyInput.value);
  const englishText = frequency.english || 'Daily';
  if (frequencyEnglish) {
    frequencyEnglish.querySelector('div').textContent = englishText;
  }
}

function getSelectedAntibioticConfig() {
  const name = antibioticSelect.value || antibiotics[0];
  return antibioticCatalog[name];
}

function getStrengthSelectionValue() {
  const value = Number(strengthMgInput.value);
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
  if (antibioticSelect.value !== 'Amoxicillin-Clavulanate' || !extraAmoxicillinToggle.checked) {
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
  if (antibioticSelect.value !== 'Azithromycin' || !azithromycinLoadingToggle.checked) {
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
  const mg = Number(strengthMgInput.value);
  const ml = Number(strengthMlSelect.value) || 1;

  if (!Number.isFinite(mg) || mg < 0 || !Number.isFinite(ml) || ml <= 0) {
    return 0;
  }

  return mg / ml;
}

function getDoseMgPerDose() {
  const rawDose = Number(doseValueInput.value);
  const strength = getStrengthMgPerMl();
  const unit = doseUnitSelect.value;

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

function calculateRegimen() {
  const weightKg = getActiveWeightKg();
  const config = getSelectedAntibioticConfig();
  const frequency = parseFrequency(frequencyInput.value);
  const strength = getStrengthMgPerMl() || config.defaultStrength;
  const days = Number(daysInput.value) || 1;
  const doseMgPerDose = getDoseMgPerDose();
  const extraAmoxicillinMgPerDose = getExtraPlainAmoxicillinMgPerDose();
  const azithromycinLoadingDoseMg = getAzithromycinLoadingDoseMg();
  const clavulanateRatio = getClavulanateRatio();

  const amoxicillinMgPerDose = antibioticSelect.value === 'Amoxicillin-Clavulanate'
    ? doseMgPerDose + extraAmoxicillinMgPerDose
    : doseMgPerDose;

  const totalDailyAmoxicillinMg = amoxicillinMgPerDose * frequency.dosesPerDay;
  const totalDailyClavulanateMg = antibioticSelect.value === 'Amoxicillin-Clavulanate'
    ? doseMgPerDose * clavulanateRatio * frequency.dosesPerDay
    : 0;

  const baseDailyMg = antibioticSelect.value === 'Azithromycin'
    ? doseMgPerDose * frequency.dosesPerDay
    : totalDailyAmoxicillinMg;

  const loadingDoseAdjustment = azithromycinLoadingDoseMg > 0 ? azithromycinLoadingDoseMg : 0;
  const totalDailyMg = antibioticSelect.value === 'Azithromycin'
    ? baseDailyMg
    : totalDailyAmoxicillinMg;
  const totalRegimenMg = (totalDailyMg * days) + loadingDoseAdjustment;
  const mgPerKgPerDay = weightKg > 0 ? totalDailyMg / weightKg : 0;
  const minDose = config.typicalDose.min;
  const maxDose = config.typicalDose.max;
  const withinRange = mgPerKgPerDay >= minDose && mgPerKgPerDay <= maxDose;

  const amoxicillinLimitMg = config.maxDailyAmoxicillinMg || null;
  const clavulanateLimitMgPerKg = antibioticSelect.value === 'Amoxicillin-Clavulanate' ? 10 : 0;
  const amoxicillinLimitExceeded = amoxicillinLimitMg !== null && totalDailyAmoxicillinMg > amoxicillinLimitMg;
  const clavulanateLimitExceeded = clavulanateLimitMgPerKg > 0 && weightKg > 0 && totalDailyClavulanateMg > (clavulanateLimitMgPerKg * weightKg);

  return {
    weightKg,
    config,
    configName: antibioticSelect.value,
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
    clavulanateLimitExceeded,
    reference: `${formatNumber(minDose, 0)}-${formatNumber(maxDose, 0)} mg/kg/day`,
  };
}

function renderDosingResults() {
  const result = calculateRegimen();

  const warnings = [];
  if (result.amoxicillinLimitExceeded) {
    warnings.push(`Total amoxicillin exceeds the 1000 mg/day maximum.`);
  }
  if (result.clavulanateLimitExceeded) {
    warnings.push(`Clavulanate exceeds 10 mg/kg/day for the current weight.`);
  }
  if (result.azithromycinLoadingDoseMg > 0) {
    warnings.push(`Initial loading dose included for azithromycin.`);
  }
  if (!result.withinRange && warnings.length === 0) {
    warnings.push('Outside the usual pediatric reference range; confirm with local guidelines.');
  }

  const statusClass = warnings.length > 0 ? 'status-warning' : result.withinRange ? 'status-success' : 'status-warning';
  const statusText = warnings.length > 0
    ? warnings.join(' ')
    : 'Within the typical pediatric outpatient reference range.';

  let supplementMarkup = '';
  if (antibioticSelect.value === 'Amoxicillin-Clavulanate') {
    supplementMarkup = `
      <p><strong>Amoxicillin total:</strong> ${formatNumber(result.totalDailyAmoxicillinMg, 1)} mg/day (${formatNumber(result.totalDailyAmoxicillinMg / Math.max(result.weightKg, 1), 1)} mg/kg/day)</p>
      <p><strong>Clavulanate total:</strong> ${formatNumber(result.totalDailyClavulanateMg, 1)} mg/day (${formatNumber(result.totalDailyClavulanateMg / Math.max(result.weightKg, 1), 1)} mg/kg/day)</p>
      <p><strong>Amoxicillin limit:</strong> 1000 mg/day max</p>
      <p><strong>Clavulanate limit:</strong> 10 mg/kg/day max</p>
    `;
  }

  if (antibioticSelect.value === 'Azithromycin') {
    supplementMarkup = `
      <p><strong>Loading dose:</strong> ${formatNumber(result.azithromycinLoadingDoseMg, 1)} mg</p>
      <p><strong>Daily equivalent:</strong> ${formatNumber(result.mgPerKgPerDay, 1)} mg/kg/day</p>
    `;
  }

  dosingResults.className = `results-panel ${statusClass}`;
  dosingResults.innerHTML = `
    <h3>Regimen review</h3>
    <p><strong>Daily dose:</strong> ${formatNumber(result.mgPerKgPerDay, 1)} mg/kg/day</p>
    <p><strong>Total course dose:</strong> ${formatNumber(result.totalRegimenMg, 1)} mg</p>
    <p><strong>Per dose:</strong> ${formatNumber(result.doseMgPerDose, 1)} mg</p>
    <p><strong>Reference range:</strong> ${result.reference}</p>
    ${supplementMarkup}
    <p class="summary-text">${statusText}</p>
  `;

  renderPackaging(result);
}

function getNearestKnownStrength(config, strength) {
  const strengths = config.strengths || [strength];
  if (!strengths.length) {
    return strength;
  }

  const closest = strengths.reduce((best, candidate) => {
    if (Math.abs(candidate - strength) < Math.abs(best - strength)) {
      return candidate;
    }
    return best;
  }, strengths[0]);

  return closest;
}

function getPackagingOptions(config, strength) {
  const nearestStrength = getNearestKnownStrength(config, strength);
  const volumeOptions = config.packSizes[nearestStrength] || [60, 100, 150, 200];
  return [...new Set(volumeOptions)].sort((a, b) => a - b);
}

function getDefaultPackagingCounts(sizes, requiredVolume, lockedSize = null, lockedCount = 0) {
  const sortedSizes = [...new Set(sizes)].sort((a, b) => b - a);
  const counts = {};

  sortedSizes.forEach((size) => {
    counts[size] = 0;
  });

  const fixedSize = lockedSize !== null ? Number(lockedSize) : null;
  const fixedCount = fixedSize !== null ? Math.max(0, Number(lockedCount) || 0) : 0;

  if (fixedSize !== null) {
    counts[fixedSize] = fixedCount;
  }

  const remainingAfterFixed = Math.max(0, requiredVolume - (fixedSize !== null ? fixedCount * fixedSize : 0));
  const fillSizes = sortedSizes.filter((size) => size !== fixedSize);

  if (remainingAfterFixed <= 0) {
    fillSizes.forEach((size) => {
      counts[size] = 0;
    });
    return counts;
  }

  const maxQtyPerSize = fillSizes.reduce((map, size) => {
    map[size] = Math.max(0, Math.ceil(remainingAfterFixed / size) + 1);
    return map;
  }, {});

  const suffixMax = new Array(fillSizes.length + 1).fill(0);
  for (let index = fillSizes.length - 1; index >= 0; index -= 1) {
    suffixMax[index] = suffixMax[index + 1] + maxQtyPerSize[fillSizes[index]] * fillSizes[index];
  }

  let bestMatch = null;

  function search(index, activeCounts, totalVolume, bottleCount) {
    if (index >= fillSizes.length) {
      if (totalVolume >= requiredVolume) {
        const excess = totalVolume - requiredVolume;
        const candidate = {
          excess,
          bottleCount,
          counts: { ...activeCounts },
        };

        if (!bestMatch || candidate.excess < bestMatch.excess || (candidate.excess === bestMatch.excess && candidate.bottleCount < bestMatch.bottleCount)) {
          bestMatch = candidate;
        }
      }
      return;
    }

    const size = fillSizes[index];
    const remainingMinPossible = suffixMax[index + 1] + (size * Math.max(0, Math.ceil((requiredVolume - totalVolume) / size)));
    const maxAllowed = maxQtyPerSize[size];

    for (let quantity = 0; quantity <= maxAllowed; quantity += 1) {
      const nextVolume = totalVolume + size * quantity;
      const remainingAfterThis = suffixMax[index + 1] + nextVolume;
      if (remainingAfterThis < requiredVolume) {
        continue;
      }

      activeCounts[size] = quantity;
      search(index + 1, activeCounts, nextVolume, bottleCount + quantity);
      delete activeCounts[size];
    }
  }

  search(0, {}, 0, 0);

  if (bestMatch) {
    fillSizes.forEach((size) => {
      counts[size] = bestMatch.counts[size] || 0;
    });
  }

  return counts;
}

function getLargestSingleBottleSize(availableVolumes, requiredVolume) {
  const sizes = [...new Set(availableVolumes)].sort((a, b) => a - b);

  if (!Number.isFinite(requiredVolume) || requiredVolume <= 0) {
    return null;
  }

  return sizes.find((size) => size >= requiredVolume) || null;
}

function normalizePackagingCounts(key, sizes, requiredVolume) {
  const currentCounts = state.packagingSelection[key] || {};
  const normalizedCounts = {};

  sizes.forEach((size) => {
    normalizedCounts[size] = Math.max(0, Number(currentCounts[size]) || 0);
  });

  const selectedVolume = sizes.reduce((sum, size) => sum + (normalizedCounts[size] || 0) * size, 0);
  if (selectedVolume < requiredVolume) {
    state.packagingSelection[key] = getDefaultPackagingCounts(sizes, requiredVolume);
    return;
  }

  state.packagingSelection[key] = normalizedCounts;
}

function updatePackagingSelection(key, sizes, requiredVolume, changedSize, delta) {
  const largestSingleBottleSize = getLargestSingleBottleSize(sizes, requiredVolume);
  if (largestSingleBottleSize !== null && changedSize > largestSingleBottleSize) {
    return;
  }

  const currentCounts = state.packagingSelection[key] || {};
  const lockedCount = Math.max(0, (currentCounts[changedSize] || 0) + delta);
  const minimizedCounts = getDefaultPackagingCounts(sizes, requiredVolume, changedSize, lockedCount);

  state.packagingSelection[key] = minimizedCounts;

  const result = calculateRegimen();
  renderPackaging(result);
}

function renderPackaging(result) {
  const strength = result.strength;
  const availableVolumes = getPackagingOptions(result.config, strength);
  const totalVolumeNeeded = result.totalRegimenMg / strength;
  const key = `${result.configName || antibioticSelect.value}::${strength}`;
  const largestSingleBottleSize = getLargestSingleBottleSize(availableVolumes, totalVolumeNeeded);

  if (!state.packagingSelection[key]) {
    state.packagingSelection[key] = getDefaultPackagingCounts(availableVolumes, totalVolumeNeeded);
  }

  normalizePackagingCounts(key, availableVolumes, totalVolumeNeeded);

  const currentCounts = { ...state.packagingSelection[key] };
  availableVolumes.forEach((size) => {
    if (largestSingleBottleSize !== null && size > largestSingleBottleSize) {
      currentCounts[size] = 0;
    }
  });
  state.packagingSelection[key] = currentCounts;

  const selectedVolume = availableVolumes.reduce((sum, size) => sum + (currentCounts[size] || 0) * size, 0);

  packagingDisplay.innerHTML = `
    <p><strong>Strength:</strong> ${formatNumber(strength, 2)} mg/mL</p>
    <p><strong>Total volume for course:</strong> ${formatNumber(totalVolumeNeeded, 1)} mL</p>
    <div class="bottle-pack-list">
      ${availableVolumes
        .map((size) => {
          const quantity = currentCounts[size] || 0;
          const isDisabled = largestSingleBottleSize !== null && size > largestSingleBottleSize;
          return `
            <div class="bottle-pack-row ${isDisabled ? 'is-disabled' : ''}">
              <div class="bottle-icon" aria-hidden="true">🧴</div>
              <div class="bottle-pack-meta">
                <span>${size} mL</span>
              </div>
              <div class="bottle-count-control" aria-label="${size} mL bottle quantity">
                <button class="bottle-button decrease" type="button" data-size="${size}" data-delta="-1" ${isDisabled ? 'disabled' : ''} aria-disabled="${isDisabled}" aria-label="Decrease ${size} mL bottles">−</button>
                <span class="bottle-count">${quantity}</span>
                <button class="bottle-button increase" type="button" data-size="${size}" data-delta="1" ${isDisabled ? 'disabled' : ''} aria-disabled="${isDisabled}" aria-label="Increase ${size} mL bottles">+</button>
              </div>
            </div>
          `;
        })
        .join('')}
    </div>
    <p class="status-note">Selected coverage: ${formatNumber(selectedVolume, 1)} mL (${selectedVolume >= totalVolumeNeeded ? 'sufficient' : 'still short'})</p>
  `;

  packagingDisplay.querySelectorAll('.bottle-button').forEach((button) => {
    button.addEventListener('click', (event) => {
      const size = Number(event.currentTarget.dataset.size);
      const delta = Number(event.currentTarget.dataset.delta);
      updatePackagingSelection(key, availableVolumes, totalVolumeNeeded, size, delta);
    });
  });
}

function handleWeightInput() {
  const value = Number(weightInput.value);
  if (Number.isFinite(value) && value > 0) {
    state.weightKg = state.weightUnit === 'kg' ? value : value * 0.453592;
  }
  updateClinicalWeightDisplay();
  renderDosingResults();
}

function selectAllOnFocus(event) {
  const target = event.currentTarget;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    window.setTimeout(() => {
      target.select();
    }, 0);
  }
}

function attachEvents() {
  weightInput.addEventListener('input', handleWeightInput);
  weightInput.addEventListener('focus', selectAllOnFocus);
  weightToggle.addEventListener('click', toggleWeightUnit);
  antibioticSelect.addEventListener('change', () => {
    updateStrengthPresetOptions();
    updateCustomFieldVisibility();
    updateFrequencyEnglish();
    renderDosingResults();
  });
  doseValueInput.addEventListener('input', renderDosingResults);
  doseValueInput.addEventListener('focus', selectAllOnFocus);
  doseUnitSelect.addEventListener('change', renderDosingResults);
  strengthPreset.addEventListener('change', () => {
    const selected = Number(strengthPreset.value);
    const isCustom = String(strengthPreset.value) === 'custom';
    updateCustomFieldVisibility();

    if (!isCustom && Number.isFinite(selected) && selected > 0) {
      strengthMgInput.value = String(selected);
      strengthMlSelect.value = '5';
    } else if (isCustom) {
      strengthMgInput.value = strengthMgInput.value || '';
    }

    renderDosingResults();
  });
  strengthMgInput.addEventListener('input', () => {
    if (strengthPreset.value !== 'custom') {
      strengthPreset.value = 'custom';
      updateCustomFieldVisibility();
    }
    renderDosingResults();
  });
  strengthMgInput.addEventListener('focus', selectAllOnFocus);
  strengthMlSelect.addEventListener('change', () => {
    if (strengthPreset.value !== 'custom') {
      strengthPreset.value = 'custom';
      updateCustomFieldVisibility();
    }
    renderDosingResults();
  });
  extraAmoxicillinToggle.addEventListener('change', () => {
    extraAmoxicillinFields.classList.toggle('hidden', !extraAmoxicillinToggle.checked);
    renderDosingResults();
  });
  extraAmoxicillinDoseInput.addEventListener('input', renderDosingResults);
  extraAmoxicillinUnitSelect.addEventListener('change', renderDosingResults);
  extraAmoxicillinStrengthMgInput.addEventListener('input', renderDosingResults);
  extraAmoxicillinStrengthMlSelect.addEventListener('change', renderDosingResults);
  azithromycinLoadingToggle.addEventListener('change', renderDosingResults);
  azithromycinLoadingDoseInput.addEventListener('input', renderDosingResults);
  frequencyInput.addEventListener('input', () => {
    updateFrequencyEnglish();
    renderDosingResults();
  });
  frequencyInput.addEventListener('focus', selectAllOnFocus);
  daysInput.addEventListener('input', renderDosingResults);
  daysInput.addEventListener('focus', selectAllOnFocus);
  printButton.addEventListener('click', () => window.print());
}

function init() {
  populateAntibiotics();
  attachEvents();
  updateCustomFieldVisibility();
  updateFrequencyEnglish();
  weightInput.value = '';
  state.weightKg = 0;
  state.weightUnit = 'kg';
  weightUnitLabel.textContent = 'kg';
  updateClinicalWeightDisplay();
  renderDosingResults();
}

init();
