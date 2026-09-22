import re

with open("frontend/src/components/BucketList/DestinationsTab.jsx", "r") as f:
    content = f.read()

# Fix the stray closing tags issue
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

with open("frontend/src/components/BucketList/DestinationsTab.jsx", "w") as f:
    f.write(content)
