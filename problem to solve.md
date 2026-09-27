# LIBRARY LOCATION AGENT INSTRUCTIONS

## 🎯 YOUR ROLE
You are an expert AI developer agent working on the "Smart Library Search System". Your current task is to implement a **Physical Location Mapper**. 

Currently, the system searches a database and returns book titles, authors, and Call Numbers. Your job is to modify the codebase so that when a book is retrieved, the system cross-references its Call Number with the physical library map (provided below) and outputs clear, step-by-step navigation instructions for the user.

## 📊 THE PHYSICAL LIBRARY MAP (PILLARS 1-13)
The library is organized by numbered pillars. Below is the exact mapping extracted from the library's physical signage. You must use this JSON object as your source of truth.

```json
{
  "library_map": {
    "1": {
      "pillar_number": "1",
      "subjects": [
        { "prefix": "D-F", "subject": "HISTORY AND INTERNATIONAL RELATIONS", "arrow": "Right" },
        { "prefix": "BF", "subject": "PHILOSOPHY", "arrow": "Left" }
      ]
    },
    "2": {
      "pillar_number": "2",
      "subjects": [
        { "prefix": "G", "subject": "Geography (General) Atlases. Globes. maps. Unlocalized maps." },
        { "prefix": "GA", "subject": "Mathematical Geography Cartography" },
        { "prefix": "GB", "subject": "Physical Geography" },
        { "prefix": "GC", "subject": "Oceanography" },
        { "prefix": "GE", "subject": "Environmental Sciences" },
        { "prefix": "GF", "subject": "Human Ecology. Anthropogeography" },
        { "prefix": "GN", "subject": "Anthropology" },
        { "prefix": "GR", "subject": "Folklore" },
        { "prefix": "GT", "subject": "Manners and customs (General)" },
        { "prefix": "GV", "subject": "Recreation. Leisure" },
        { "prefix": "H", "subject": "Social Sciences" },
        { "prefix": "HA", "subject": "Statistics" },
        { "prefix": "D-F", "subject": "HISTORY AND INTERNATIONAL RELATIONS" },
        { "prefix": "ECONOMICS", "subject": "ECONOMICS", "arrow": "Right" },
        { "prefix": "G-GN", "subject": "GEOGRAPHY AND PLANNING", "arrow": "Left" }
      ]
    },
    "3": {
      "pillar_number": "3",
      "subjects": [
        { "prefix": "HB", "subject": "Economic Theory Demography" },
        { "prefix": "HC", "subject": "Economic History and Conditions" },
        { "prefix": "HD", "subject": "Management and Economic History and Conditions" },
        { "prefix": "HD", "subject": "ESTATE MANAGEMENT", "arrow": "Right", "notes": "ETF 2006/2007" }
      ]
    },
    "4": {
      "pillar_number": "4",
      "subjects": [
        { "prefix": "HD", "subject": "Industries, Land Use: Labour" },
        { "prefix": "HE", "subject": "Transportation and communication." },
        { "prefix": "HF", "subject": "Commerce | MARKETING", "arrow": "Left" },
        { "prefix": "HF", "subject": "ACCOUNTING", "arrow": "Right" }
      ]
    },
    "5": {
      "pillar_number": "5",
      "subjects": [
        { "prefix": "HF", "subject": "Commerce" },
        { "prefix": "HG", "subject": "Finance" },
        { "prefix": "HJ", "subject": "Public Finance" },
        { "prefix": "HM", "subject": "Sociology General" },
        { "prefix": "BANKING AND FINANCE", "subject": "BANKING AND FINANCE", "arrow": "Left and Right", "notes": "ETF 2006/2007" },
        { "prefix": "HM", "subject": "SOCIOLOGY" }
      ]
    },
    "6": {
      "pillar_number": "6",
      "subjects": [
        { "prefix": "URBAN AND REGIONAL PLANNING", "subject": "URBAN AND REGIONAL PLANNING", "arrow": "Left" },
        { "prefix": "J – JZ", "subject": "POLITICAL SCIENCE" }
      ]
    },
    "7": {
      "pillar_number": "7",
      "subjects": [
        { "prefix": "N", "subject": "Visual Arts" },
        { "prefix": "NA", "subject": "Architecture" },
        { "prefix": "NB", "subject": "Sculpture" },
        { "prefix": "NC", "subject": "Drawing, Design, illustration" },
        { "prefix": "ND", "subject": "Painting" },
        { "prefix": "NK", "subject": "Decorative Arts" },
        { "prefix": "NX", "subject": "Arts in General." },
        { "prefix": "N", "subject": "FINE AND APPLIED ARTS" },
        { "prefix": "L", "subject": "Education" },
        { "prefix": "LA", "subject": "History of Education" },
        { "prefix": "LB", "subject": "Theory and Practice of Education" },
        { "prefix": "LC", "subject": "Special aspects Of education" },
        { "prefix": "LG", "subject": "Industrial Institutions; Asia, Africa, Oceania." },
        { "prefix": "M", "subject": "Music" },
        { "prefix": "ML", "subject": "Literature on music" },
        { "prefix": "MT", "subject": "Musical Instruction and Study" },
        { "prefix": "LB - LG", "subject": "EDUCATION", "arrow": "Right" },
        { "prefix": "LB", "subject": "EDUCATION MANAGEMENT & PLANNING", "arrow": "Right" },
        { "prefix": "LB", "subject": "EDUCATION SOCIAL STUDIES", "arrow": "Right" }
      ]
    },
    "8": {
      "pillar_number": "8",
      "subjects": [],
      "notes": "Silence zone. No eating, no drinking. No phone calls."
    },
    "9": {
      "pillar_number": "9",
      "subjects": [
        { "prefix": "Q", "subject": "Science (General)" },
        { "prefix": "QA", "subject": "Mathematics" },
        { "prefix": "OPTOMETRY", "subject": "OPTOMETRY", "arrow": "Right" },
        { "prefix": "R", "subject": "MEDCINE & SURGERY", "arrow": "Right" },
        { "prefix": "MEDICAL LABORATORY SCIENCE", "subject": "MEDICAL LABORATORY SCIENCE", "arrow": "Right" },
        { "prefix": "PHARMACY", "subject": "PHARMACY" },
        { "prefix": "MEDICINE & SURGERY", "subject": "MEDICINE & SURGERY", "arrow": "Right" }
      ]
    },
    "10": {
      "pillar_number": "10",
      "subjects": [
        { "prefix": "QC", "subject": "PHYSICS", "arrow": "Left" },
        { "prefix": "STATISTICS", "subject": "STATISTICS", "arrow": "Right", "notes": "ETF 2002" },
        { "prefix": "COMPUTER SCIENCE", "subject": "COMPUTER SCIENCE", "arrow": "Right" }
      ]
    },
    "11": {
      "pillar_number": "11",
      "subjects": [
        { "prefix": "QD", "subject": "Chemistry" },
        { "prefix": "QE", "subject": "Geology" },
        { "prefix": "QH", "subject": "Biology" },
        { "prefix": "QK", "subject": "Botany" },
        { "prefix": "QL", "subject": "Zoology" },
        { "prefix": "QM", "subject": "Human Anat" },
        { "prefix": "QP", "subject": "Physiol" },
        { "prefix": "CHEMISTRY", "subject": "CHEMISTRY", "arrow": "Right" },
        { "prefix": "BIOCHEMISTRY", "subject": "BIOCHEMISTRY", "arrow": "Right" },
        { "prefix": "GEOLOGY", "subject": "GEOLOGY", "arrow": "Right" },
        { "prefix": "BIOLOGICAL SCIENCES", "subject": "BIOLOGICAL SCIENCES", "arrow": "Right" },
        { "prefix": "QK", "subject": "PLANT SCIENCE AND BIOTECHNOLOGY", "arrow": "Left" },
        { "prefix": "QD", "subject": "CHEMISTRY", "arrow": "Right" },
        { "prefix": "QL", "subject": "ANIMAL & ENVIRONMENTAL BIOLOGY (ZOOLOGY)", "arrow": "Right" },
        { "prefix": "BIOCHEMISTRY", "subject": "BIOCHEMISTRY" },
        { "prefix": "ANATOMY", "subject": "ANATOMY", "arrow": "Left" }
      ]
    },
    "12": {
      "pillar_number": "12",
      "subjects": [
        { "prefix": "QR", "subject": "MICROBIOLOGY" },
        { "prefix": "ELECTRICAL ELECTRONIC ENGINEERING", "subject": "ELECTRICAL ELECTRONIC ENGINEERING", "arrow": "Left" },
        { "prefix": "MECHANICAL ENGINEERING", "subject": "MECHANICAL ENGINEERING", "arrow": "Left" },
        { "prefix": "CIVIL ENGINEERING", "subject": "CIVIL ENGINEERING", "arrow": "Left" },
        { "prefix": "MICROBIOLOGY", "subject": "MICROBIOLOGY", "arrow": "Right" },
        { "prefix": "BIOLOGY", "subject": "BIOLOGY", "arrow": "Right" },
        { "prefix": "BIOCHEMISTRY", "subject": "BIOCHEMISTRY", "arrow": "Right" },
        { "prefix": "PATHOLOGY", "subject": "PATHOLOGY", "arrow": "Right" },
        { "prefix": "ECOLOGY", "subject": "ECOLOGY", "arrow": "Right" },
        { "prefix": "VIROLOGY", "subject": "VIROLOGY", "arrow": "Right" },
        { "prefix": "BIOPHYSIOLOGY", "subject": "BIOPHYSIOLOGY", "arrow": "Right" },
        { "prefix": "ENTOMOLOGY", "subject": "ENTOMOLOGY", "arrow": "Right" },
        { "prefix": "CIVIL ENGINEERING", "subject": "CIVIL ENGINEERING", "arrow": "Left" },
        { "prefix": "BUILDING TECHNOLOGY", "subject": "BUILDING TECHNOLOGY", "arrow": "Left" },
        { "prefix": "SURVEYING AND GEOMATICS", "subject": "SURVEYING AND GEOMATICS", "arrow": "Right" },
        { "prefix": "MICROBIOLOGY", "subject": "MICROBIOLOGY", "arrow": "Right" }
      ]
    },
    "13": {
      "pillar_number": "13",
      "subjects": [
        { "prefix": "Z", "subject": "LIBRARY AND INFORMATION SCIENCE", "arrow": "Left" },
        { "prefix": "COMPUTER ENGINEERING", "subject": "COMPUTER ENGINEERING", "arrow": "Right" },
        { "prefix": "ELECTRICAL ELECTRONIC ENGINEERING", "subject": "ELECTRICAL ELECTRONIC ENGINEERING", "arrow": "Right" }
      ]
    }
  }
} 


🛠️ TASK 1: CODEBASE MODIFICATION INSTRUCTIONS
To implement this in the project folder, follow these exact steps:

Create a Data File: Create a new file named locationData.json in your src/data/ or config/ folder. Copy the JSON object above into this file.

Create a Location Mapper Service: Create a new utility file (e.g., src/services/locationMapper.js or location_mapper.py).

Write the Parsing Function: In the mapper file, write a function getPhysicalLocation(callNumber) that follows the logic in Task 2.

Update the Search API/UI: Modify the endpoint or component that returns book search results. It must call getPhysicalLocation() using the book's Call Number and append the result to the API response/UI.

🧠 TASK 2: THE PARSING LOGIC (ALGORITHM)
When a book is retrieved, it will have a Call Number (e.g., QD 453 .A23 or HF 5636 .A23). Implement this exact logic to determine the location:

Extract the Prefix: Use Regex to extract the alphabetical prefix from the Call Number.

Example: QD 453 .A23 -> Extract QD

Extract the Number: Extract the numerical part immediately following the prefix.

Example: QD 453 .A23 -> Extract 453

Match against locationData.json:

Look for the prefix in the JSON.

CRITICAL EDGE CASE (The "HF" Rule): The prefix HF exists on Pillar 4 and Pillar 5.

Rule: If the prefix is HF, check the number. If the number is between 1 and 3000, it belongs to Pillar 4 (Marketing/Accounting). If the number is 3001 or higher, it belongs to Pillar 5 (Banking/Finance).

Format the Output: Generate a clear, friendly instruction string.

Template: "📍 Location: Pillar [Pillar Number]. Look for the sign: [Prefix] - [Subject]. The books are on the [Arrow] side."

⚠️ TASK 3: RULES & CONSTRAINTS
Do Not Hallucinate: If a Call Number prefix does not exist in the JSON (e.g., XYZ), do not guess. Return: "Location not mapped. Please ask a librarian for assistance."

Exact Spelling: The JSON contains exact signage text, including typos (e.g., "MEDCINE" on Pillar 9). When outputting to the user, output the exact spelling so they can match it to the physical sign.

Directional Arrows: You MUST include the Left/Right arrows in your output. Without them, the user won't know which side of the pillar to search.

UI Integration: If possible, render the specific pillar image (from the provided image set) in the UI to serve as a visual anchor for the user.