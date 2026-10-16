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

const state = {
  weightKg: 20,
  weightUnit: 'kg',
  packagingSelection: {},
};

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

function formatNumber(value, digits = 1) {
  if (!Number.isFinite(value) || value < 0) return '--';
  return Number(value).toFixed(digits).replace(/\.0+$/, '');
}

function getSelectedAntibioticConfig() {
  const name = antibioticSelect && antibioticSelect.value ? antibioticSelect.value : antibiotics[0];
  return antibioticCatalog[name];
}

function getStrengthMgPerMl() {
  const mg = Number(strengthMgInput && strengthMgInput.value);
  const ml = Number(strengthMlSelect && strengthMlSelect.value) || 1;
  if (!Number.isFinite(mg) || mg < 0 || !Number.isFinite(ml) || ml <= 0) return 0;
  return mg / ml;
}

function getDoseMgPerDose() {
  const dose = Number(doseValueInput && doseValueInput.value);
  const strength = getStrengthMgPerMl();
  const unit = doseUnitSelect ? doseUnitSelect.value : 'mg';

  if (!Number.isFinite(dose) || dose < 0) return 0;
  if (unit === 'mg') return dose;
  if (unit === 'ml') return dose * strength;
  if (unit === 'doses') return dose * strength * 5;
  return dose * strength;
}

function getActiveWeightKg() {
  const value = Number(weightInput && weightInput.value);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return state.weightUnit === 'kg' ? value : value * 0.453592;
}

function updateClinicalWeightDisplay() {
  const weightKg = getActiveWeightKg();
  if (clinicalWeightValue) {
    clinicalWeightValue.textContent = weightKg > 0 ? `${formatNumber(weightKg, 1)} kg` : '--.- kg';
  }
}

function parseFrequency(value) {
  const raw = String(value || '').trim().toLowerCase();

  if (!raw) return { hours: 24, label: 'daily', dosesPerDay: 1, english: 'Daily' };
  if (raw.includes('qid') || raw.includes('q6h')) {
    return { hours: 6, label: 'every 6 hours', dosesPerDay: 4, english: 'Every 6 hours' };
  }
  if (raw.includes('tid') || raw.includes('q8h')) {
    return { hours: 8, label: 'every 8 hours', dosesPerDay: 3, english: 'Every 8 hours' };
  }
  if (raw.includes('bid') || raw.includes('q12h')) {
    return { hours: 12, label: 'every 12 hours', dosesPerDay: 2, english: 'Every 12 hours' };
  }
  if (raw.includes('daily') || raw.includes('qd') || raw.includes('q24h')) {
    return { hours: 24, label: 'daily', dosesPerDay: 1, english: 'Daily' };
  }

  const qMatch = raw.match(/q(\d+)h/);
  if (qMatch) {
    const hours = Number(qMatch[1]);
    if (hours > 0) {
      return { hours, label: `every ${hours} hours`, dosesPerDay: Math.round(24 / hours), english: `Every ${hours} hours` };
    }
  }

  const numericMatch = raw.match(/(\d+)/);
  if (numericMatch) {
    const candidate = Number(numericMatch[1]);
    if (candidate > 0) {
      return { hours: candidate, label: `every ${candidate} hours`, dosesPerDay: Math.round(24 / candidate), english: `Every ${candidate} hours` };
    }
  }

  return { hours: 24, label: 'daily', dosesPerDay: 1, english: 'Daily' };
}

function updateFrequencyEnglish() {
  const frequency = parseFrequency(frequencyInput && frequencyInput.value);
  if (frequencyEnglish) {
    const div = frequencyEnglish.querySelector('div');
    if (div) div.textContent = frequency.english || 'Daily';
  }
}

function getStrengthSelectionValue() {
  const value = Number(strengthMgInput && strengthMgInput.value);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getClavulanateRatio() {
  const config = getSelectedAntibioticConfig();
  const strengthValue = getStrengthSelectionValue();

  if (!config || config.clavulanateRatio === 0) return 0;
  if (config.strengthToClavRatio && config.strengthToClavRatio[strengthValue]) {
    return config.strengthToClavRatio[strengthValue];
  }
  return config.clavulanateRatio;
}

function getExtraPlainAmoxicillinMgPerDose() {
  if (!antibioticSelect || antibioticSelect.value !== 'Amoxicillin-Clavulanate' || !extraAmoxicillinToggle || !extraAmoxicillinToggle.checked) {
    return 0;
  }

  const dose = Number(extraAmoxicillinDoseInput && extraAmoxicillinDoseInput.value);
  const unit = extraAmoxicillinUnitSelect ? extraAmoxicillinUnitSelect.value : 'mg';
  const strength = Number(extraAmoxicillinStrengthMgInput && extraAmoxicillinStrengthMgInput.value);
  const volume = Number(extraAmoxicillinStrengthMlSelect && extraAmoxicillinStrengthMlSelect.value) || 1;

  if (!Number.isFinite(dose) || dose < 0) return 0;
  const strengthPerMl = strength / volume;
  if (unit === 'mg') return dose;
  if (unit === 'ml') return dose * strengthPerMl;
  if (unit === 'doses') return dose * strengthPerMl * 5;
  return dose * strengthPerMl;
}

function getAzithromycinLoadingDoseMg() {
  if (!antibioticSelect || antibioticSelect.value !== 'Azithromycin' || !azithromycinLoadingToggle || !azithromycinLoadingToggle.checked) {
    return 0;
  }

  const value = Number(azithromycinLoadingDoseInput && azithromycinLoadingDoseInput.value);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function updateMgDoseTranslation() {
  if (!mgDoseTranslation) return;
  const value = Number(doseValueInput && doseValueInput.value);
  if (!Number.isFinite(value) || value <= 0) {
    mgDoseTranslation.textContent = '0 mg/dose';
    return;
  }
  mgDoseTranslation.textContent = `${formatNumber(getDoseMgPerDose(), 1)} mg/dose`;
}

function calculateRegimen() {
  const weightKg = getActiveWeightKg();
  const config = getSelectedAntibioticConfig();
  const frequency = parseFrequency(frequencyInput && frequencyInput.value);
  const days = Number(daysInput && daysInput.value) || 1;
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

  const totalDailyMg = antibioticSelect && antibioticSelect.value === 'Azithromycin'
    ? baseDailyMg
    : totalDailyAmoxicillinMg;

  const loadingDoseAdjustment = azithromycinLoadingDoseMg > 0 ? azithromycinLoadingDoseMg : 0;
  const totalRegimenMg = (totalDailyMg * days) + loadingDoseAdjustment;
  const mgPerKgPerDay = weightKg > 0 ? totalDailyMg / weightKg : 0;
  const minDose = config.typicalDose.min;
  const maxDose = config.typicalDose.max;
  const withinRange = mgPerKgPerDay >= minDose && mgPerKgPerDay <= maxDose;

  const amoxicillinLimitMg = config.maxDailyAmoxicillinMg || null;
  const clavulanateLimitMgPerKg = antibioticSelect && antibioticSelect.value === 'Amoxicillin-Clavulanate' ? 10 : 0;
  const amoxicillinPerDoseLimitExceeded = antibioticSelect && antibioticSelect.value !== 'Azithromycin' && amoxicillinMgPerDose > 1000;
  const amoxicillinLimitExceeded = amoxicillinLimitMg !== null && totalDailyAmoxicillinMg > amoxicillinLimitMg;
  const clavulanateLimitExceeded = clavulanateLimitMgPerKg > 0 && weightKg > 0 && totalDailyClavulanateMg > clavulanateLimitMgPerKg * weightKg;

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
    days,
    doseMgPerDose,
    extraAmoxicillinMgPerDose,
    azithromycinLoadingDoseMg,
    totalDailyAmoxicillinMg,
    totalDailyClavulanateMg,
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
  const statusText = warnings.length > 0 ? warnings.join(' ') : 'Within the typical pediatric outpatient reference range.';

  let supplementMarkup = '';
  if (antibioticSelect && antibioticSelect.value === 'Amoxicillin-Clavulanate') {
    supplementMarkup = `
      <p><strong>Amoxicillin:</strong> ${formatNumber(result.totalDailyAmoxicillinMg, 1)} mg/day (${formatNumber(result.totalDailyAmoxicillinMg / Math.max(result.weightKg, 1), 1)} mg/kg/day)</p>
      <p><strong>Clavulanate:</strong> ${formatNumber(result.totalDailyClavulanateMg, 1)} mg/day (${formatNumber(result.totalDailyClavulanateMg / Math.max(result.weightKg, 1), 1)} mg/kg/day)</p>
    `;
  }

  if (result.amoxicillinPerDoseLimitExceeded) {
    supplementMarkup += `
      <div class="warning-callout">
        <strong>Maximum safe amoxicillin dose:</strong> ${formatNumber(result.amoxicillinCapDoseMg, 1)} mg/dose = ${formatNumber(result.amoxicillinCapMgPerKgPerDay, 1)} mg/kg/day at this frequency.
      </div>
    `;
  }

  let dailyDoseMarkup = '';
  if (antibioticSelect && antibioticSelect.value === 'Azithromycin' && result.azithromycinLoadingDoseMg > 0) {
    dailyDoseMarkup = `
      <p><strong>Loading dose:</strong> ${formatNumber(result.loadingDoseMgPerKg, 1)} mg/kg/day</p>
      <p><strong>Daily:</strong> ${formatNumber(result.maintenanceDailyDoseMgPerKg, 1)} mg/kg/day</p>
    `;
  } else if (antibioticSelect && antibioticSelect.value === 'Amoxicillin-Clavulanate') {
    dailyDoseMarkup = `<p><strong>Daily dose:</strong> ${formatNumber(result.mgPerKgPerDay, 1)} mg/kg/day</p>`;
  } else {
    dailyDoseMarkup = `<p><strong>Daily dose:</strong> ${formatNumber(result.mgPerKgPerDay, 1)} mg/kg/day</p>`;
  }

  if (dosingResults) {
    dosingResults.className = `results-panel ${statusClass}`;
    dosingResults.innerHTML = `
      <h3>Regimen review</h3>
      <div class="review-subpanel">
        ${dailyDoseMarkup}
        <p><strong>Reference dose:</strong> ${result.reference}</p>
      </div>
      <p><strong>Total course dose:</strong> ${formatNumber(result.totalRegimenMg, 1)} mg</p>
      ${supplementMarkup}
      <p class="summary-text">${statusText}</p>
    `;
  }

  renderPackaging(result);
  updateMgDoseTranslation();
}

function getNearestKnownStrength(config, strength) {
  const strengths = config.strengths || [strength];
  if (!strengths.length) return strength;
  return strengths.reduce((best, candidate) => {
    if (Math.abs(candidate - strength) < Math.abs(best - strength)) return candidate;
    return best;
  }, strengths[0]);
}

function getPackagingOptions(config, strength) {
  const nearestStrength = getNearestKnownStrength(config, strength);
  const volumeOptions = config.packSizes[nearestStrength] || [60, 100, 150, 200];
  return [...new Set(volumeOptions)].sort((a, b) => a - b);
}

function getDefaultPackagingCounts(sizes, requiredVolume, lockedSize = null, lockedCount = 0) {
  const sortedSizes = [...new Set(sizes)].sort((a, b) => b - a);
  const counts = {};
  sortedSizes.forEach((size) => { counts[size] = 0; });

  const fixedSize = lockedSize !== null ? Number(lockedSize) : null;
  const fixedCount = fixedSize !== null ? Math.max(0, Number(lockedCount) || 0) : 0;

  if (fixedSize !== null) counts[fixedSize] = fixedCount;

  const remainingAfterFixed = Math.max(0, requiredVolume - (fixedSize !== null ? fixedCount * fixedSize : 0));
  const fillSizes = sortedSizes.filter((size) => size !== fixedSize);

  if (remainingAfterFixed <= 0) {
    fillSizes.forEach((size) => { counts[size] = 0; });
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
        const candidate = { excess, bottleCount, counts: { ...activeCounts } };
        if (!bestMatch || candidate.excess < bestMatch.excess || (candidate.excess === bestMatch.excess && candidate.bottleCount < bestMatch.bottleCount)) {
          bestMatch = candidate;
        }
      }
      return;
    }

    const size = fillSizes[index];
    const maxAllowed = maxQtyPerSize[size];

    for (let quantity = 0; quantity <= maxAllowed; quantity += 1) {
      const nextVolume = totalVolume + size * quantity;
      const remainingAfterThis = suffixMax[index + 1] + nextVolume;
      if (remainingAfterThis < requiredVolume) continue;

      activeCounts[size] = quantity;
      search(index + 1, activeCounts, nextVolume, bottleCount + quantity);
      delete activeCounts[size];
    }
  }

  search(0, {}, 0, 0);

  if (bestMatch) {
    fillSizes.forEach((size) => { counts[size] = bestMatch.counts[size] || 0; });
  }

  return counts;
}

function getLargestSingleBottleSize(availableVolumes, requiredVolume) {
  const sizes = [...new Set(availableVolumes)].sort((a, b) => a - b);
  if (!Number.isFinite(requiredVolume) || requiredVolume <= 0) return null;
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
  if (largestSingleBottleSize !== null && changedSize > largestSingleBottleSize) return;

  const currentCounts = state.packagingSelection[key] || {};
  const lockedCount = Math.max(0, (currentCounts[changedSize] || 0) + delta);
  state.packagingSelection[key] = getDefaultPackagingCounts(sizes, requiredVolume, changedSize, lockedCount);

  renderPackaging(calculateRegimen());
}

function renderPackaging(result) {
  const strength = getStrengthMgPerMl() || result.config.defaultStrength || 1;
  const availableVolumes = getPackagingOptions(result.config, strength);
  const totalVolumeNeeded = result.totalRegimenMg / strength || 0;
  const key = `${result.configName || (antibioticSelect ? antibioticSelect.value : '')}::${strength}`;
  const largestSingleBottleSize = getLargestSingleBottleSize(availableVolumes, totalVolumeNeeded);

  if (!state.packagingSelection[key]) {
    state.packagingSelection[key] = getDefaultPackagingCounts(availableVolumes, totalVolumeNeeded);
  }

  normalizePackagingCounts(key, availableVolumes, totalVolumeNeeded);

  const currentCounts = { ...state.packagingSelection[key] };
  availableVolumes.forEach((size) => {
    if (largestSingleBottleSize !== null && size > largestSingleBottleSize) currentCounts[size] = 0;
  });
  state.packagingSelection[key] = currentCounts;

  const selectedVolume = availableVolumes.reduce((sum, size) => sum + (currentCounts[size] || 0) * size, 0);

  if (packagingDisplay) {
    packagingDisplay.innerHTML = `
      <p><strong>Strength:</strong> ${formatNumber(strength, 2)} mg/mL</p>
      <p><strong>Total volume for course:</strong> ${formatNumber(totalVolumeNeeded, 1)} mL</p>
      <div class="bottle-pack-list">
        ${availableVolumes.map((size) => {
          const quantity = currentCounts[size] || 0;
          const isDisabled = largestSingleBottleSize !== null && size > largestSingleBottleSize;
          return `
            <div class="bottle-pack-row ${isDisabled ? 'is-disabled' : ''}">
              <div class="bottle-icon" aria-hidden="true">🧴</div>
              <div class="bottle-pack-meta"><span>${size} mL</span></div>
              <div class="bottle-count-control" aria-label="${size} mL bottle quantity">
                <button class="bottle-button decrease" type="button" data-size="${size}" data-delta="-1" ${isDisabled ? 'disabled' : ''} aria-disabled="${isDisabled}" aria-label="Decrease ${size} mL">-</button>
                <span class="bottle-count">${quantity}</span>
                <button class="bottle-button increase" type="button" data-size="${size}" data-delta="1" ${isDisabled ? 'disabled' : ''} aria-disabled="${isDisabled}" aria-label="Increase ${size} mL">+</button>
              </div>
            </div>
          `;
        }).join('')}
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
}

function populateAntibiotics() {
  if (!antibioticSelect) return;

  antibioticSelect.innerHTML = antibiotics.map((name) => `<option value="${name}">${name}</option>`).join('');
  antibioticSelect.value = antibiotics[0] || '';

  if (strengthMlSelect) strengthMlSelect.value = '5';
  if (strengthMgInput) strengthMgInput.value = '';
  if (doseValueInput) doseValueInput.value = '';
  if (frequencyInput) frequencyInput.value = '';
  if (daysInput) daysInput.value = '';
  if (extraAmoxicillinDoseInput) extraAmoxicillinDoseInput.value = '';
  if (azithromycinLoadingDoseInput) azithromycinLoadingDoseInput.value = '';
  if (azithromycinLoadingToggle) azithromycinLoadingToggle.checked = false;

  updateStrengthPresetOptions();
}

function updateStrengthPresetOptions() {
  const config = getSelectedAntibioticConfig();
  if (!strengthPreset) return;

  const strengths = config?.strengths || [];
  const options = strengths.map((strength) => `<option value="${strength}">${strength} mg per ${strengthMlSelect ? strengthMlSelect.value : 5} mL</option>`);
  options.push('<option value="custom">Custom</option>');
  strengthPreset.innerHTML = options.join('');

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
  const showExtraAmoxicillin = Boolean(config && config.supportsExtraAmoxicillin);
  const showLoadingDose = Boolean(config && config.supportsLoadingDose);
  const isCustomStrength = strengthPreset ? String(strengthPreset.value) === 'custom' : false;

  if (customStrengthFields) customStrengthFields.classList.toggle('hidden', !isCustomStrength);
  if (extraAmoxicillinBlock) extraAmoxicillinBlock.classList.toggle('hidden', !showExtraAmoxicillin);
  if (azithromycinLoadingBlock) azithromycinLoadingBlock.classList.toggle('hidden', !showLoadingDose);

  if (!showExtraAmoxicillin && extraAmoxicillinToggle && extraAmoxicillinFields) {
    extraAmoxicillinToggle.checked = false;
    extraAmoxicillinFields.classList.add('hidden');
    if (extraAmoxicillinDoseInput) extraAmoxicillinDoseInput.value = '';
    if (extraAmoxicillinStrengthMgInput) extraAmoxicillinStrengthMgInput.value = '';
  }

  if (!showLoadingDose && azithromycinLoadingToggle) {
    azithromycinLoadingToggle.checked = false;
    if (azithromycinLoadingDoseInput) azithromycinLoadingDoseInput.value = '';
  }
}

function toggleWeightUnit() {
  const currentValue = Number(weightInput && weightInput.value);

  if (!Number.isFinite(currentValue) || currentValue <= 0) {
    state.weightUnit = 'kg';
    if (weightInput) weightInput.value = '20';
    if (weightUnitLabel) weightUnitLabel.textContent = 'kg';
    updateClinicalWeightDisplay();
    renderDosingResults();
    return;
  }

  if (state.weightUnit === 'kg') {
    state.weightUnit = 'lb';
    if (weightInput) weightInput.value = formatNumber(currentValue / 0.453592, 1);
  } else {
    state.weightUnit = 'kg';
    if (weightInput) weightInput.value = formatNumber(currentValue * 0.453592, 1);
  }

  if (weightUnitLabel) weightUnitLabel.textContent = state.weightUnit;
  updateClinicalWeightDisplay();
  renderDosingResults();
}

function handleWeightInput() {
  const value = Number(weightInput && weightInput.value);
  if (Number.isFinite(value) && value > 0) {
    state.weightKg = state.weightUnit === 'kg' ? value : value * 0.453592;
  }
  updateClinicalWeightDisplay();
  renderDosingResults();
}

function selectAllOnFocus(event) {
  const target = event.currentTarget;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    setTimeout(() => target.select(), 0);
  }
}

function attachEvents() {
  if (weightInput) {
    weightInput.addEventListener('input', handleWeightInput);
    weightInput.addEventListener('focus', selectAllOnFocus);
  }
  if (weightToggle) weightToggle.addEventListener('click', toggleWeightUnit);

  if (antibioticSelect) {
    antibioticSelect.addEventListener('change', () => {
      updateStrengthPresetOptions();
      updateCustomFieldVisibility();
      updateFrequencyEnglish();
      renderDosingResults();
    });
  }

  if (doseValueInput) {
    doseValueInput.addEventListener('input', () => {
      updateMgDoseTranslation();
      renderDosingResults();
    });
    doseValueInput.addEventListener('focus', selectAllOnFocus);
  }

  if (doseUnitSelect) {
    doseUnitSelect.addEventListener('change', () => {
      updateMgDoseTranslation();
      renderDosingResults();
    });
  }

  if (strengthPreset) {
    strengthPreset.addEventListener('change', () => {
      const selected = Number(strengthPreset.value);
      const isCustom = String(strengthPreset.value) === 'custom';
      updateCustomFieldVisibility();

      if (!isCustom && Number.isFinite(selected) && selected > 0) {
        if (strengthMgInput) strengthMgInput.value = String(selected);
        if (strengthMlSelect) strengthMlSelect.value = '5';
      } else if (isCustom && strengthMgInput) {
        strengthMgInput.value = strengthMgInput.value || '';
      }

      renderDosingResults();
    });
  }

  if (strengthMgInput) {
    strengthMgInput.addEventListener('input', () => {
      if (strengthPreset && strengthPreset.value !== 'custom') {
        strengthPreset.value = 'custom';
        updateCustomFieldVisibility();
      }
      renderDosingResults();
    });
    strengthMgInput.addEventListener('focus', selectAllOnFocus);
  }

  if (strengthMlSelect) {
    strengthMlSelect.addEventListener('change', () => {
      if (strengthPreset && strengthPreset.value !== 'custom') {
        strengthPreset.value = 'custom';
        updateCustomFieldVisibility();
      }
      renderDosingResults();
    });
  }

  if (extraAmoxicillinToggle) {
    extraAmoxicillinToggle.addEventListener('change', () => {
      if (extraAmoxicillinFields) {
        extraAmoxicillinFields.classList.toggle('hidden', !extraAmoxicillinToggle.checked);
      }
      renderDosingResults();
    });
  }

  if (extraAmoxicillinDoseInput) extraAmoxicillinDoseInput.addEventListener('input', renderDosingResults);
  if (extraAmoxicillinUnitSelect) extraAmoxicillinUnitSelect.addEventListener('change', renderDosingResults);
  if (extraAmoxicillinStrengthMgInput) extraAmoxicillinStrengthMgInput.addEventListener('input', renderDosingResults);
  if (extraAmoxicillinStrengthMlSelect) extraAmoxicillinStrengthMlSelect.addEventListener('change', renderDosingResults);
  if (azithromycinLoadingToggle) azithromycinLoadingToggle.addEventListener('change', renderDosingResults);
  if (azithromycinLoadingDoseInput) azithromycinLoadingDoseInput.addEventListener('input', renderDosingResults);

  if (frequencyInput) {
    frequencyInput.addEventListener('input', () => {
      updateFrequencyEnglish();
      renderDosingResults();
    });
    frequencyInput.addEventListener('focus', selectAllOnFocus);
  }

  if (daysInput) {
    daysInput.addEventListener('input', renderDosingResults);
    daysInput.addEventListener('focus', selectAllOnFocus);
  }

  if (printButton) printButton.addEventListener('click', () => window.print());
}

function init() {
  weightInput = document.getElementById('weightKg');
  weightToggle = document.getElementById('weightToggle');
  weightUnitLabel = document.getElementById('weightUnit');
  clinicalWeightValue = document.getElementById('clinicalWeightValue');
  antibioticSelect = document.getElementById('antibioticName');
  doseValueInput = document.getElementById('doseValue');
  doseUnitSelect = document.getElementById('doseUnit');
  strengthMgInput = document.getElementById('strengthMg');
  strengthMlSelect = document.getElementById('strengthMl');
  frequencyInput = document.getElementById('frequencyInput');
  daysInput = document.getElementById('daysValue');
  dosingResults = document.getElementById('dosingResults');
  packagingDisplay = document.getElementById('packagingDisplay');
  printButton = document.getElementById('printButton');
  frequencyEnglish = document.getElementById('frequencyEnglish');
  strengthPreset = document.getElementById('strengthPreset');
  customStrengthFields = document.getElementById('customStrengthFields');
  extraAmoxicillinBlock = document.getElementById('extraAmoxicillinBlock');
  extraAmoxicillinToggle = document.getElementById('extraAmoxicillinToggle');
  extraAmoxicillinFields = document.getElementById('extraAmoxicillinFields');
  extraAmoxicillinDoseInput = document.getElementById('extraAmoxicillinDose');
  extraAmoxicillinUnitSelect = document.getElementById('extraAmoxicillinUnit');
  extraAmoxicillinStrengthMgInput = document.getElementById('extraAmoxicillinStrengthMg');
  extraAmoxicillinStrengthMlSelect = document.getElementById('extraAmoxicillinStrengthMl');
  azithromycinLoadingBlock = document.getElementById('azithromycinLoadingBlock');
  azithromycinLoadingToggle = document.getElementById('azithromycinLoadingToggle');
  azithromycinLoadingDoseInput = document.getElementById('azithromycinLoadingDose');
  mgDoseTranslation = document.getElementById('mgDoseTranslation');

  populateAntibiotics();
  attachEvents();
  updateCustomFieldVisibility();
  updateFrequencyEnglish();
  updateMgDoseTranslation();

  if (weightInput) weightInput.value = '20';
  state.weightUnit = 'kg';
  if (weightUnitLabel) weightUnitLabel.textContent = 'kg';
  updateClinicalWeightDisplay();
  renderDosingResults();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
