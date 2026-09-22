import re

with open("frontend/src/components/BucketList/DestinationsTabLeaflet.jsx", "r") as f:
    content = f.read()

# Add import
import_stmt = "import SelectedItemDrawer from \"./SelectedItemDrawer\";\n"
content = content.replace("import { ArrowUpRight, Link as LinkIcon, Plus } from 'lucide-react';", "import { ArrowUpRight, Link as LinkIcon, Plus } from 'lucide-react';\n" + import_stmt)


# Remove the handlePromote and handleAddLink functions
# Also the newUrl state
handle_funcs_pattern = re.compile(
    r'  const handlePromote = async \(\) => \{.*?\};\n\n  const \[newUrl, setNewUrl\] = useState\(\'\'\);\n  const handleAddLink = async \(\) => \{.*?\};\n',
    re.DOTALL
)
content = handle_funcs_pattern.sub('', content)


# Find and replace the Drawer
drawer_pattern = re.compile(
    r'\{/\* Bottom Drawer for Selected Item \*/\}.*?</button>\n\s*</div>\n\s*</div>\n\s*</div>\n\s*\)\}',
    re.DOTALL
)

replacement = """{/* Bottom Drawer for Selected Item */}
      <SelectedItemDrawer
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        refresh={refresh}
      />"""

content = drawer_pattern.sub(replacement, content)


with open("frontend/src/components/BucketList/DestinationsTabLeaflet.jsx", "w") as f:
    f.write(content)
