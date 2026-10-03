import os
import re

def resolve_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # regex to find conflict blocks
    pattern = re.compile(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> origin/Payal\n', re.DOTALL)
    
    # replace with just both blocks concatenated
    # For imports (usually at the top), we can just combine them.
    def repl(m):
        head_part = m.group(1)
        payal_part = m.group(2)
        return head_part + "\n" + payal_part + "\n"
        
    resolved = pattern.sub(repl, content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(resolved)
        
resolve_file('frontend/src/components/layout/Sidebar.jsx')
resolve_file('frontend/src/pages/teacher/Dashboard.jsx')
print("Resolved conflicts by keeping both.")
