import json

with open(r'd:\Work\Project\BountyFootball\BountyFootball\assets\scene\seven_screen.fire', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Find RoundFinalView node
target_id = None
for i, obj in enumerate(data):
    if isinstance(obj, dict) and obj.get('_name') == 'RoundFinalView':
        target_id = i
        print(f'Found RoundFinalView at ID={i}')
        break

if target_id is None:
    print('ERROR: RoundFinalView not found!')
    exit(1)

# Get all descendants recursively
def get_descendants(root_id):
    result = []
    children = data[root_id].get('_children', [])
    for c in children:
        if isinstance(c, dict):
            cid = c.get('__id__')
            if cid is not None and cid < len(data):
                result.append(cid)
                result.extend(get_descendants(cid))
    return result

total_nodes = 1 + len(get_descendants(target_id))
print(f'Total nodes under RoundFinalView: {total_nodes}')

# Build parent map for path tracing
parent_map = {}
for i, obj in enumerate(data):
    if isinstance(obj, dict):
        parent = obj.get('_parent', {})
        if isinstance(parent, dict):
            pid = parent.get('__id__')
            if pid is not None:
                parent_map[i] = pid

def get_path(node_id):
    parts = []
    cur = node_id
    while cur in parent_map:
        parts.append(data[cur].get('_name', ''))
        cur = parent_map[cur]
    parts.reverse()
    return 'Canvas/' + '/'.join(parts)

# Print full hierarchy
def print_tree(node_id, indent=0):
    node = data[node_id]
    name = node.get('_name', '')
    comps = node.get('_components', [])
    
    label_text = None
    for j, comp in enumerate(data):
        if isinstance(comp, dict) and comp.get('__type__') in ['cc.Label', 'cc.RichText']:
            nr = comp.get('node', {})
            if isinstance(nr, dict) and nr.get('__id__') == node_id:
                label_text = comp.get('_string', '')
                align = comp.get('_N$horizontalAlign', -1)
                path = get_path(node_id)
                print(f'{"  " * indent}ID={node_id} "{name}" [{comp["__type__"]}="{label_text[:150]}" HAlign={align}]')
                print(f'{"  " * indent}  PATH: {path}')
                return
    
    has_sprite = any(isinstance(c, dict) and c.get('__type__') == 'cc.Sprite' for c in comps)
    extra = ' [Sprite]' if has_sprite else ''
    print(f'{"  " * indent}ID={node_id} "{name}"{extra}')
    
    children = node.get('_children', [])
    for c in children:
        if isinstance(c, dict):
            cid = c.get('__id__')
            if cid is not None and cid < len(data):
                print_tree(cid, indent + 1)

print('\n=== RoundFinalView Full Hierarchy ===')
print_tree(target_id)

# Collect all translatable text nodes
print('\n=== Translatable Text Nodes ===')
text_paths = []
for nid in get_descendants(target_id):
    for j, comp in enumerate(data):
        if isinstance(comp, dict) and comp.get('__type__') in ['cc.Label', 'cc.RichText']:
            nr = comp.get('node', {})
            if isinstance(nr, dict) and nr.get('__id__') == nid:
                text = comp.get('_string', '')
                if text and text.strip():
                    path = get_path(nid)
                    ctype = comp['__type__']
                    print(f'  Name={data[nid].get("_name","")} Type={ctype}')
                    print(f'    Text="{text[:200]}"')
                    print(f'    Path="{path}"')
                    text_paths.append((data[nid].get('_name',''), ctype, text, path))
