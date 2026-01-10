import json

# Read file
with open(r'C:\Users\Andre\OneDrive\Documents\GitHub\personalpageAZ\data\profile.json', encoding='utf-8-sig') as f:
    data = json.load(f)

# Add icons to hero bullets if not already present
if 'hero' in data and 'bullets' in data['hero']:
    bullet_icons = [
        '<i class="fa fa-chain"></i>',      # Causality - link/chain
        '<i class="fa fa-lightbulb-o"></i>', # Explainability
        '<i class="fa fa-check-circle-o"></i>', # Reproducibility
        '<i class="fa fa-arrows-alt"></i>'   # Cross-domain
    ]
    
    for i, bullet in enumerate(data['hero']['bullets']):
        if i < len(bullet_icons) and isinstance(bullet, dict):
            if 'en' in bullet and not bullet['en'].startswith('<i'):
                bullet['en'] = f"{bullet_icons[i]} {bullet['en']}"
            if 'it' in bullet and not bullet['it'].startswith('<i'):
                bullet['it'] = f"{bullet_icons[i]} {bullet['it']}"

# Add icons to hero CTA buttons in i18n
if 'i18n' in data:
    for lang in ['en', 'it']:
        if lang in data['i18n']:
            i18n = data['i18n'][lang]
            
            # Hero kicker
            if 'hero.kicker' in i18n and not i18n['hero.kicker'].startswith('<i'):
                i18n['hero.kicker'] = f"<i class='fa fa-file-text-o'></i> {i18n['hero.kicker']}"
            
            # CTA buttons
            if 'hero.ctaProjects' in i18n and not i18n['hero.ctaProjects'].startswith('<i'):
                i18n['hero.ctaProjects'] = f"<i class='fa fa-folder-open-o'></i> {i18n['hero.ctaProjects']}"
            
            if 'hero.ctaEmail' in i18n and not i18n['hero.ctaEmail'].startswith('<i'):
                i18n['hero.ctaEmail'] = f"<i class='fa fa-envelope-o'></i> {i18n['hero.ctaEmail']}"
            
            # Hero facts labels
            if 'hero.factCurrent' in i18n and not i18n['hero.factCurrent'].startswith('<i'):
                i18n['hero.factCurrent'] = f"<i class='fa fa-briefcase'></i> {i18n['hero.factCurrent']}"
            
            if 'hero.factLocation' in i18n and not i18n['hero.factLocation'].startswith('<i'):
                i18n['hero.factLocation'] = f"<i class='fa fa-map-marker'></i> {i18n['hero.factLocation']}"
            
            if 'hero.factCollaboration' in i18n and not i18n['hero.factCollaboration'].startswith('<i'):
                i18n['hero.factCollaboration'] = f"<i class='fa fa-handshake-o'></i> {i18n['hero.factCollaboration']}"

# Add icons to epistemic position labels
if 'i18n' in data:
    for lang in ['en', 'it']:
        if lang in data['i18n']:
            i18n = data['i18n'][lang]
            
            epistemic_mappings = {
                'epistemic.questionsLabel': '<i class="fa fa-question-circle-o"></i>',
                'epistemic.methodLabel': '<i class="fa fa-cogs"></i>',
                'epistemic.domainsLabel': '<i class="fa fa-sitemap"></i>',
                'epistemic.commitmentLabel': '<i class="fa fa-compass"></i>',
            }
            
            for key, icon in epistemic_mappings.items():
                if key in i18n and isinstance(i18n[key], str) and not i18n[key].startswith('<i'):
                    i18n[key] = f"{icon} {i18n[key]}"

# Add navigation icons
if 'i18n' in data:
    for lang in ['en', 'it']:
        if lang in data['i18n']:
            i18n = data['i18n'][lang]
            
            nav_icons = {
                'nav.home': '<i class="fa fa-home"></i>',
                'nav.index': '<i class="fa fa-list"></i>',
                'nav.note': '<i class="fa fa-file-text"></i>',
                'nav.evidence': '<i class="fa fa-check-square"></i>',
                'nav.contact': '<i class="fa fa-envelope"></i>',
            }
            
            for key, icon in nav_icons.items():
                if key in i18n and isinstance(i18n[key], str) and not i18n[key].startswith('<i'):
                    i18n[key] = f"{icon} {i18n[key]}"

# Add section lead/description icons
if 'i18n' in data:
    for lang in ['en', 'it']:
        if lang in data['i18n']:
            i18n = data['i18n'][lang]
            
            # Add arrow or indicator to "lead" texts for visual flow
            lead_keys = ['focus.lead', 'epistemic.lead', 'note.lead', 'evidence.lead']
            for key in lead_keys:
                if key in i18n and isinstance(i18n[key], str) and not i18n[key].startswith('<i'):
                    i18n[key] = f"<i class='fa fa-angle-right'></i> {i18n[key]}"

# Write file
with open(r'C:\Users\Andre\OneDrive\Documents\GitHub\personalpageAZ\data\profile.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("✓ Added hero and navigation icons")
print("  - Hero bullets with contextual icons")
print("  - Hero CTA buttons with action icons")
print("  - Hero facts with category icons")
print("  - Epistemic section labels")
print("  - Navigation menu icons")
print("  - Section lead indicators")
