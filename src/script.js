list = amoxicillin, clavulonic_acid, azithromycin

class PrescriptionField{
}

class DosingField{
}

class PackagingField{
}

//Have the + button in .html select for an antibiotic to add. It adds it to the PrescriptionField below (the container that holds all the selected antibiotics). Below each antibiotic in the PrescriptionField, have two side-by-side DosingFields, one for what the doctor put on the physical prescription the pharmacy receives, and the other with selectable menu based on indication. In these DosingFields, there will be a dosing per weight and all the subsequent calculations will populate based on the weight entered at the top of the .html. Then the doctor's DosingField will light up green if it is within the clinical range, or red if it is not. Below these DosingFields is a PackagingField that spans both Dosing Fields where the final dose calculated clinically is divided in pre-determined Canadian products that are hard-coded attributes (quantities, strengths), and consolidates the dose into the most compact and cheapest combination.
