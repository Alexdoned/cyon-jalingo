import json
from django import template

register = template.Library()

@register.filter(name='tojson', is_safe=True)
def tojson(value):
    """Serialize a Python value to a JSON-safe string for use in HTML attributes."""
    return json.dumps(value)
