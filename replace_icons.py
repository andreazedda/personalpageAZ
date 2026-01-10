import json
import re

# Mapping emoji -> Font Awesome icon classes
ICON_MAP = {
    '📑': '<i class="fa fa-list-alt"></i>',
    '📝': '<i class="fa fa-file-text-o"></i>',
    '✅': '<i class="fa fa-check-square-o"></i>',
    '🎯': '<i class="fa fa-bullseye"></i>',
    '🤝': '<i class="fa fa-handshake-o"></i>',
    '🔬': '<i class="fa fa-flask"></i>',
    '💼': '<i class="fa fa-briefcase"></i>',
    '🛠️': '<i class="fa fa-wrench"></i>',
    '🚀': '<i class="fa fa-rocket"></i>',
    '🌐': '<i class="fa fa-globe"></i>',
    '📍': '<i class="fa fa-map-marker"></i>',
    '🎓': '<i class="fa fa-graduation-cap"></i>',
    '📦': '<i class="fa fa-archive"></i>',
    '💡': '<i class="fa fa-lightbulb-o"></i>',
    '👥': '<i class="fa fa-users"></i>',
    '📚': '<i class="fa fa-book"></i>',
    '📖': '<i class="fa fa-book"></i>',
    '📧': '<i class="fa fa-envelope-o"></i>',
    '🧠': '<i class="fa fa-brain"></i>',
}

def replace_emoji_in_text(text):
    """Replace emoji with Font Awesome icons in text"""
    if not isinstance(text, str):
        return text
    
    result = text
    for emoji, icon in ICON_MAP.items():
        result = result.replace(emoji, icon)
    return result

def process_value(value):
    """Recursively process JSON values"""
    if isinstance(value, str):
        return replace_emoji_in_text(value)
    elif isinstance(value, dict):
        return {k: process_value(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [process_value(item) for item in value]
    else:
        return value

# Read file
with open(r'C:\Users\Andre\OneDrive\Documents\GitHub\personalpageAZ\data\profile.json', encoding='utf-8-sig') as f:
    data = json.load(f)

# Process entire data structure
data = process_value(data)

# Write file
with open(r'C:\Users\Andre\OneDrive\Documents\GitHub\personalpageAZ\data\profile.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("✓ Replaced all emoji with Font Awesome icons")
print(f"  Processed {len(ICON_MAP)} different icon types")
