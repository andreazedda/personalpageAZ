import json

# Read file with UTF-8 BOM
with open(r'C:\Users\Andre\OneDrive\Documents\GitHub\personalpageAZ\data\profile.json', encoding='utf-8-sig') as f:
    data = json.load(f)

# Fix about section - add missing em-dashes
data['about']['paragraph']['en'] = "Problems are approached through structured reasoning: constraints made explicit, models tested against reality, clarity preferred over complexity. Work in causal inference and interpretable ML reflects this: systems that explain their logic, make assumptions testable, and respect limits of knowledge. Outside technical work, interests span philosophical inquiry, investing/personal finance (as applied decision theory under uncertainty), and hands-on building—repairing things, running a Chia miner, designing tools. Values: collaboration, intellectual honesty, understanding how things actually work."

data['about']['paragraph']['it'] = "I problemi vengono affrontati attraverso ragionamento strutturato: vincoli resi espliciti, modelli testati contro la realtà, chiarezza preferita alla complessità. Il lavoro in inferenza causale e ML interpretabile riflette questo: sistemi che spiegano la loro logica, rendono testabili le assunzioni e rispettano i limiti della conoscenza. Al di là del lavoro tecnico, interessi che spaziano dall'indagine filosofica agli investimenti/finanza personale (come teoria decisionale applicata sotto incertezza) alla costruzione pratica—riparare oggetti, gestire un miner di Chia, progettare strumenti. Valori: collaborazione, onestà intellettuale, capire come funzionano davvero le cose."

# Fix focus_now items with apostrophes
data['focus_now']['items'][1]['one_liner']['it'] = "L'interpretabilità come requisito epistemico, non decorazione opzionale. I modelli dovrebbero articolare la loro logica, esporre i loro driver e dichiarare i loro limiti. Senza questo, restano scatole nere."

data['focus_now']['items'][3]['one_liner']['it'] = "Domande strutturali ricorrenti nell'analisi dei biosegnali, nel forecasting aziendale e nelle decisioni di investimento. Stesso framework epistemico, substrato diverso. Obiettivo: ragionamento trasferibile, non specializzazione accumulata."

# Write file
with open(r'C:\Users\Andre\OneDrive\Documents\GitHub\personalpageAZ\data\profile.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Fixed formatting issues in profile.json")
