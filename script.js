/////////////////////////////////////////
//    CONSTANTS
/////////////////////////////////////////
const weightUnitToggle = document.getElementById("weight-unit-toggle");
const weightInput = document.getElementById("weightKg");

const quantityUnitToggle = document.getElementById("quantity-unit-toggle");
const quantityInput = document.getElementById("quantity");
const quantityUnitsLabel = document.getElementById("quantity-units");

const frequencyInput = document.getElementById("frequency");

const drugData = "drugdata.json"
const drugSelect = document.getElementById("drugName");
const drugDataObject = fetch("drugdata.json");

const prescriptionBox = document.getElementById("prescription-box");
const rxContainer = document.getElementById("rx");

const plusAbx = document.getElementById("addNewRx");


/////////////////////////////////////////
//    EVENT LISTENERS
/////////////////////////////////////////

function toggleWeight() {//good
  let unit = weightUnitToggle.dataset.unit;

  if (unit === "kg") {
    unit = "lb";
  } else {
    unit = "kg";
  }

  weightUnitToggle.dataset.unit = unit;
  weightUnitToggle.textContent = unit;
};

function toggleQuantity() {//good
  let unit = quantityUnitToggle.dataset.unit;

  if (unit === "mg") {
    unit = "mL";
  } else {
    unit = "mg";
  }

  quantityUnitToggle.dataset.unit = unit;
  quantityUnitToggle.textContent = unit;
};

function translateFrequency() {

};

function addRx(){//good
  const newRx = generateNewRx();
};

/////////////////////////////////////////
//    HELPERS
/////////////////////////////////////////
function getWeightInKg() {//good
  const weight = Number(weightInput.value) || 0;
  const unit = weightUnitToggle.dataset.unit;

  if (unit === "lb") {
    return weight / 2.20462;
  }

  return weight;
}


/////////////////////////////////////////
//    POULATION/GENERATION SCRIPTS
/////////////////////////////////////////
async function populateDrugOptions(prescriptionContainer) {//good
  //load options from json
  const response = await fetch(drugData);
  const drugs = await response.json();
  //add each drug as an option
  Object.keys(drugs).forEach((drug_name) => {
    const option = document.createElement("option");
    option.value = drug_name;
    option.textContent = drug_name;
    prescriptionContainer.appendChild(option);
  });
};

async function populateDrugStrengths(rxContainer){
  //load options from json
  const response = await fetch(drugData);
  const drugs = await response.json();
  //select right prescription
  const abxName = rxContainer.
  //add each strength
  Object.keys(drugs.strengths).forEach((strength) => {
    const option = document.createElement("option");
    const label = String(strength) + "mg/5mL";
    option.value = label;
    option.textContent = label;

  });
};

function generateNewRx(){//good
  //clone the div (deep copy)
  const newRx = rxContainer.cloneNode(true);
  //change id to # children in `prescription-box`
  const PrescriptionBoxChildren = prescriptionBox.childElementCount;
  newRx.id = 'rx-' + String(PrescriptionBoxChildren);
  //append clone
  prescriptionBox.insertBefore(newRx,rxContainer);
  return newRx;
};


/////////////////////////////////////////
//    CALCULATION SCRIPTS
/////////////////////////////////////////
function consolidateDrugDoses(){
  //If there are multiple rxs that have an antibiotic (eg: amoxicillin), then combine it in the summary
  let doses = {};
  const prescriptions = prescriptionBox.children
  //check names of all rxContainers
  prescriptions.forEach(element => {
    //get dosing
    //get abx name
    const prescriptionAbx = prescriptions.getElementById("drugName");
    const abxName = prescriptionAbx.value;
    //do I have that recorded already?
    if (abxName in doses.keys){

    };
  });
};

function getMgKgDay(rxContainer){
  //get quantity
  const qtyElement = rxContainer.getElementById("quantity");
  const qty = getMg(rxContainer);
  //get frequency
  const freqElement = rxContainer.getElementById("frequency");
  const freq = freqElement.dataset.qh;
  //get duration
  const durElement = rxContainer.getElementById("duration");
  const dur = durElement.value;
  //calculate
  const mkd = (qty*(24/freq)/weightInput.value/dur);
  return mkd;

};

function getMg(rxContainer){
  let qty;
  let strength = 5;
  //identify parts
  const quantityElement = rxContainer.getElementById("quantity");
  const unitsElement = rxContainer.getElementById("quantity-unit-toggle");
  const strengthElement = rxContainer.getElementById("strength");
  //get mg or ml; if ml, then also get strength
  qty = quantity.value;
  if (unitsElement.dataset.unit === "mL"){
    strength = strengthElement.value;
  };
  //calculate
  const total = (strength/5)*qty;
  return total;
};




/////////////////////////////////////////
//     RUNTIME
/////////////////////////////////////////
//Tag all the event listeners
weightUnitToggle.addEventListener('click', toggleWeight);
quantityUnitToggle.addEventListener('click', toggleQuantity);
frequencyInput.addEventListener('input', translateFrequency);
plusAbx.addEventListener('click', addRx);

//Run setup functions
populateDrugOptions(drugSelect);