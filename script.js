<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pediatric Liquid Antibiotic Validator</title>
    <link rel="stylesheet" href="styles.css" />
  </head>

  <body>
    <div class="app-shell">
      <header class="topbar">
        <div class="topbar-header-row">
          <div class="topbar-heading">
            <p class="eyebrow">PharmAlta Clinical Tool</p>
            <h1>Pediatric Liquid Antibiotic Validator</h1>
          </div>
          <div class="print-button-wrap">
            <button id="printButton" class="secondary-button sticky-print-button" type="button">Print / Export</button>
          </div>
        </div>
        <p class="liability">
          UNDER CONSTRUCTION: DO NOT USE CLINICALLY YET.<br />
          Calculations use weight-based dosing commonly referenced for pediatric outpatient prescribing.<br />
          Always verify local guidelines before prescribing.<br />
          This tool is intended to convert community-prescribed doses back into weight-based dosing for easier clinical review.
        </p>
        <div class="resource-panel">
          <h3>Resources Consulted</h3>
          <div class="resource-links">
            <a href="https://www.bugsanddrugs.com" target="_blank" rel="noopener noreferrer">Bugs &amp; Drugs</a>
            <a href="https://pedmed.org" target="_blank" rel="noopener noreferrer">Ped Med</a>
          </div>
        </div>
      </header>

      <main class="layout">
        <section class="panel patient-panel">
          <h2>Patient details</h2>
          <div class="field-row">
            <label class="field-block" for="weightKg">
              <span>Weight</span>
              <div class="input-with-unit">
                <input id="weightKg" type="number" min="0" step="0.1" value="20" />
                <button id="weightToggle" class="unit-toggle" type="button" aria-label="Toggle weight unit" aria-pressed="false">
                  <span id="weightUnit">kg</span>
                </button>
              </div>
            </label>
          </div>

          <div class="clinical-weight-box" aria-live="polite">
            <span>Clinical weight used = </span>
            <strong id="clinicalWeightValue">20.0 kg</strong>
          </div>
        </section>

        <section class="panel dosing-panel">
          <h2>Dosing Validator</h2>
          <div id="prescriptionList" class="prescription-list">
            <label class="field-block">
              <span>Antibiotic</span>
              <select id="antibioticName"></select>
            </label>

            <div class="inline-fields strength-fields">
              <label class="field-block">
                <span>Strength profile</span>
                <select id="strengthPreset">
                  <option value="custom">Custom</option>
                </select>
              </label>
            </div>

            <div id="customStrengthFields" class="inline-fields strength-fields hidden">
              <label class="field-block">
                <span>Strength (mg)</span>
                <input id="strengthMg" type="number" min="1" step="0.1" placeholder="e.g. 250" />
              </label>

              <label class="field-block">
                <span>Volume (mL)</span>
                <select id="strengthMl">
                  <option value="1" selected>1 mL</option>
                  <option value="5">5 mL</option>
                </select>
              </label>
            </div>

            <div id="azithromycinLoadingBlock" class="field-block hidden">
              <label class="checkbox-row" for="azithromycinLoadingToggle">
                <input id="azithromycinLoadingToggle" type="checkbox" />
                <span>Include loading dose</span>
              </label>
              <div class="compact-fields">
                <input id="azithromycinLoadingDose" type="number" min="0" step="1" placeholder="Loading dose (mg)" />
                <span class="unit-caption">mg</span>
              </div>
            </div>

            <div class="inline-fields">
              <label class="field-block">
                <span>Dose</span>
                <input id="doseValue" type="number" min="0" step="0.1" placeholder="e.g. 5" />
              </label>

              <label class="field-block">
                <span>Unit</span>
                <select id="doseUnit">
                  <option value="mg">mg</option>
                  <option value="ml">mL</option>
                  <option value="doses">doses</option>
                </select>
              </label>
            </div>

            <div id="mgDoseTranslation" class="dose-translation" aria-live="polite">0 mg/dose</div>

            <div id="extraAmoxicillinBlock" class="field-block extra-amoxicillin-subpanel hidden">
              <label class="checkbox-row" for="extraAmoxicillinToggle">
                <input id="extraAmoxicillinToggle" type="checkbox" />
                <span>Add extra plain amoxicillin</span>
              </label>

              <div id="extraAmoxicillinFields" class="extra-amoxicillin-fields hidden">
                <div class="inline-fields">
                  <label class="field-block">
                    <span>Extra dose</span>
                    <input id="extraAmoxicillinDose" type="number" min="0" step="0.1" placeholder="e.g. 5" />
                  </label>

                  <label class="field-block">
                    <span>Unit</span>
                    <select id="extraAmoxicillinUnit">
                      <option value="mg">mg</option>
                      <option value="ml">mL</option>
                      <option value="doses">doses</option>
                    </select>
                  </label>
                </div>

                <div class="inline-fields strength-fields">
                  <label class="field-block">
                    <span>Extra strength (mg)</span>
                    <input id="extraAmoxicillinStrengthMg" type="number" min="1" step="0.1" placeholder="e.g. 250" />
                  </label>

                  <label class="field-block">
                    <span>Volume (mL)</span>
                    <select id="extraAmoxicillinStrengthMl">
                      <option value="1" selected>1 mL</option>
                      <option value="5">5 mL</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div class="frequency-subpanel field-block">
              <label class="field-block">
                <span>Frequency</span>
                <input id="frequencyInput" type="text" placeholder="q6h, q8h, BID, TID" />
              </label>

              <div id="frequencyEnglish" class="frequency-english" aria-live="polite">
                <span>Frequency</span>
                <div>Daily</div>
              </div>
            </div>

            <label class="field-block">
              <span>Days</span>
              <input id="daysValue" type="number" min="1" step="1" placeholder="e.g. 5" />
            </label>
          </div>
        </section>

        <section class="panel packaging-panel">
          <h2>Packaging Estimator</h2>
          <div id="packagingDisplay" class="packaging-display">
            Package recommendations will appear here once the regimen is calculated.
          </div>
        </section>
      </main>

      <section class="panel regimen-review-panel" aria-live="polite">
        <div id="dosingResults" class="results-panel"></div>
      </section>

      <footer class="page-footer">
        <div class="footer-content">
          <div class="footer-links">
            <a href="https://github.com/mtkimmins/pediatric-antibiotic-calculator" target="_blank" rel="noopener noreferrer">GitHub Repository</a>
          </div>
          <div class="footer-info">
            <p class="last-updated">Last updated: <span id="lastUpdatedDate">October 13, 2026</span></p>
          </div>
        </div>
      </footer>
    </div>

    <script src="script.js"></script>
  </body>
</html>
