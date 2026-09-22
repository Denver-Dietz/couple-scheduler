import re

with open("frontend/src/components/BucketList/DestinationsTab.jsx", "r") as f:
    content = f.read()

# Add import
import_stmt = "import SelectedItemDrawer from \"./SelectedItemDrawer\";\n"
content = content.replace("import maplibregl from 'maplibre-gl';", "import maplibregl from 'maplibre-gl';\n" + import_stmt)

# Remove the handlePromote and handleAddLink functions
# Also the newUrl state
handle_funcs_pattern = re.compile(
    r'  const handlePromote = async \(\) => \{.*?\};\n\n  const \[newUrl, setNewUrl\] = useState\(\'\'\);\n  const handleAddLink = async \(\) => \{.*?\};\n',
    re.DOTALL
)
content = handle_funcs_pattern.sub('', content)

# Find and replace the Drawer
drawer_pattern = re.compile(
    r'\{/\* Bottom Drawer for Selected Item \*/\}.*?\{selectedItem && \(\n.*?<div className="card glass-panel animate-fade-in".*?</div>\n\s*\)\}',
    re.DOTALL
)

replacement = """{/* Bottom Drawer for Selected Item */}
      <SelectedItemDrawer
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        refresh={refresh}
      />"""

content = drawer_pattern.sub(replacement, content)

with open("frontend/src/components/BucketList/DestinationsTab.jsx", "w") as f:
    f.write(content)
