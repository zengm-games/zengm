from jinja2 import Template
from jinja2.utils import concat

t = """{% block A %}Blah{% endblock %}
{% block B %}whatever {{ a }}{% endblock %}
{% block C %}you get the idea{% endblock %}
"""

template = Template(t)
context = template.new_context({'a': 'AAAAAAAA'})
A = concat(template.blocks['A'](context))
B = concat(template.blocks['B'](context))
C = concat(template.blocks['C'](context))

for key, blockfun in template.blocks.iteritems():
    print key, ':', concat(blockfun(context))

print A
print B
print C
