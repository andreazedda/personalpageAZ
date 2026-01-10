import json
import re

# Read file
with open(r'C:\Users\Andre\OneDrive\Documents\GitHub\personalpageAZ\data\profile.json', encoding='utf-8-sig') as f:
    data = json.load(f)

# Add icons to various sections for better readability

# About section - boundary rules
if 'about' in data and 'boundary_rules' in data['about']:
    rules = data['about']['boundary_rules']
    icons = ['<i class="fa fa-cube"></i>', '<i class="fa fa-filter"></i>', '<i class="fa fa-pause-circle"></i>', '<i class="fa fa-refresh"></i>']
    for i, rule in enumerate(rules):
        if i < len(icons) and isinstance(rule, dict):
            if 'en' in rule and not rule['en'].startswith('<i'):
                rule['en'] = f"{icons[i]} {rule['en']}"
            if 'it' in rule and not rule['it'].startswith('<i'):
                rule['it'] = f"{icons[i]} {rule['it']}"

# Epistemic position - add icons to subsection labels
epistemic_icons = {
    'core_questions': '<i class="fa fa-question-circle"></i>',
    'how_i_think': '<i class="fa fa-cogs"></i>',
    'why_diverse_domains': '<i class="fa fa-random"></i>',
    'commitment': '<i class="fa fa-compass"></i>'
}

# Focus now items - add contextual icons
if 'focus_now' in data and 'items' in data['focus_now']:
    focus_icons = [
        '<i class="fa fa-link"></i>',  # Causality
        '<i class="fa fa-eye"></i>',   # Explainability
        '<i class="fa fa-repeat"></i>', # Reproducibility
        '<i class="fa fa-sitemap"></i>' # Cross-domain
    ]
    for i, item in enumerate(data['focus_now']['items']):
        if i < len(focus_icons) and isinstance(item, dict) and 'title' in item:
            if isinstance(item['title'], dict):
                if 'en' in item['title'] and not item['title']['en'].startswith('<i'):
                    item['title']['en'] = f"{focus_icons[i]} {item['title']['en']}"
                if 'it' in item['title'] and not item['title']['it'].startswith('<i'):
                    item['title']['it'] = f"{focus_icons[i]} {item['title']['it']}"

# Collaboration modes - add icons
if 'collaboration_modes' in data:
    collab_icons = [
        '<i class="fa fa-flask"></i>',      # R&D prototyping
        '<i class="fa fa-line-chart"></i>', # Decision intelligence
        '<i class="fa fa-heartbeat"></i>',  # Motion analytics
        '<i class="fa fa-code"></i>'        # Architecture/tech
    ]
    for i, mode in enumerate(data['collaboration_modes']):
        if i < len(collab_icons) and isinstance(mode, dict) and 'title' in mode:
            if isinstance(mode['title'], dict):
                if 'en' in mode['title'] and not mode['title']['en'].startswith('<i'):
                    mode['title']['en'] = f"{collab_icons[i]} {mode['title']['en']}"
                if 'it' in mode['title'] and not mode['title']['it'].startswith('<i'):
                    mode['title']['it'] = f"{collab_icons[i]} {mode['title']['it']}"

# Background entries - add year/timeline icons
if 'background' in data and isinstance(data['background'], list):
    for entry in data['background']:
        if isinstance(entry, dict):
            # Add calendar icon to period if not present
            if 'period' in entry and isinstance(entry['period'], str) and not entry['period'].startswith('<i'):
                entry['period'] = f"<i class='fa fa-calendar'></i> {entry['period']}"
            # Add building icon to organization
            if 'organization' in entry and isinstance(entry['organization'], dict):
                if 'en' in entry['organization'] and not entry['organization']['en'].startswith('<i'):
                    entry['organization']['en'] = f"<i class='fa fa-building-o'></i> {entry['organization']['en']}"
                if 'it' in entry['organization'] and not entry['organization']['it'].startswith('<i'):
                    entry['organization']['it'] = f"<i class='fa fa-building-o'></i> {entry['organization']['it']}"

# Education entries - add graduation/certificate icons
if 'education' in data and isinstance(data['education'], list):
    for entry in data['education']:
        if isinstance(entry, dict):
            # Add calendar icon to year
            if 'year' in entry and isinstance(entry['year'], str) and not entry['year'].startswith('<i'):
                entry['year'] = f"<i class='fa fa-calendar'></i> {entry['year']}"
            # Add university icon to institution
            if 'institution' in entry and isinstance(entry['institution'], str) and not entry['institution'].startswith('<i'):
                entry['institution'] = f"<i class='fa fa-university'></i> {entry['institution']}"

# Projects - add project type icons based on category
if 'projects' in data and 'categories' in data['projects']:
    for category in data['projects']['categories']:
        if isinstance(category, dict) and 'items' in category:
            for project in category['items']:
                if isinstance(project, dict) and 'label' in project:
                    # Determine icon based on project type/status
                    icon = '<i class="fa fa-cube"></i>'  # default
                    if 'type' in project:
                        if project['type'] == 'evidence_card':
                            icon = '<i class="fa fa-check-circle"></i>'
                        elif project['type'] == 'demo':
                            icon = '<i class="fa fa-desktop"></i>'
                        elif project['type'] == 'tool':
                            icon = '<i class="fa fa-wrench"></i>'
                    
                    if not project['label'].startswith('<i'):
                        project['label'] = f"{icon} {project['label']}"

# People - add person icon
if 'people' in data:
    for person in data['people']:
        if isinstance(person, dict) and 'name' in person and not person['name'].startswith('<i'):
            person['name'] = f"<i class='fa fa-user'></i> {person['name']}"

# Reading list - add book icons
if 'reading' in data and isinstance(data['reading'], list):
    for entry in data['reading']:
        if isinstance(entry, dict):
            if 'title' in entry and isinstance(entry['title'], str) and not entry['title'].startswith('<i'):
                entry['title'] = f"<i class='fa fa-book'></i> {entry['title']}"

# Add icons to i18n section titles/labels that don't have them yet
if 'i18n' in data:
    for lang in ['en', 'it']:
        if lang in data['i18n']:
            i18n = data['i18n'][lang]
            
            # Add icons to various labels
            icon_mappings = {
                'os.subtitle': '<i class="fa fa-cogs"></i>',
                'os.title': '<i class="fa fa-cogs"></i>',
                'capabilities.subtitle': '<i class="fa fa-briefcase"></i>',
                'capabilities.title': '<i class="fa fa-briefcase"></i>',
                'toolbox.subtitle': '<i class="fa fa-wrench"></i>',
                'toolbox.title': '<i class="fa fa-wrench"></i>',
                'background.subtitle': '<i class="fa fa-map-marker"></i>',
                'background.title': '<i class="fa fa-road"></i>',
                'projects.subtitle': '<i class="fa fa-cubes"></i>',
                'projects.title': '<i class="fa fa-cubes"></i>',
                'people.subtitle': '<i class="fa fa-users"></i>',
                'people.title': '<i class="fa fa-users"></i>',
                'about.subtitle': '<i class="fa fa-user"></i>',
                'about.title': '<i class="fa fa-user"></i>',
                'hero.pillarsLabel': '<i class="fa fa-th-list"></i>',
            }
            
            for key, icon in icon_mappings.items():
                if key in i18n and isinstance(i18n[key], str) and not i18n[key].startswith('<i'):
                    i18n[key] = f"{icon} {i18n[key]}"

# Write file
with open(r'C:\Users\Andre\OneDrive\Documents\GitHub\personalpageAZ\data\profile.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("✓ Added comprehensive icons throughout the document")
print("  - Boundary rules icons")
print("  - Focus items icons")
print("  - Collaboration modes icons")
print("  - Timeline icons (calendar)")
print("  - Organization icons (building)")
print("  - Education icons (university, calendar)")
print("  - Project type icons")
print("  - People icons (user)")
print("  - Reading icons (book)")
print("  - Section labels icons")
