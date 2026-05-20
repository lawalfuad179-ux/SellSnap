const fs = require('fs');

function buildTokens() {
  const colorData = JSON.parse(fs.readFileSync('color-tokens.json', 'utf8'));
  const typographyData = JSON.parse(fs.readFileSync('design-tokens.tokens.json', 'utf8'));

  let cssLight = ':root {\n';
  let cssDark = '.dark {\n';
  
  const resolveColor = (ref) => {
    let currentRef = ref;
    let count = 0;
    while (currentRef && typeof currentRef === 'string' && currentRef.startsWith('{') && currentRef.endsWith('}') && count < 10) {
      const path = currentRef.slice(1, -1).split('.');
      let currentVal = colorData;
      let found = true;
      for (const key of path) {
        if (currentVal[key] !== undefined) {
          currentVal = currentVal[key];
        } else {
          found = false;
          break;
        }
      }
      // If we couldn't resolve the full path (e.g. missing error palette), stop trying
      if (!found) {
        // We'll just return the original reference or some fallback
        return currentRef;
      }
      currentRef = currentVal;
      count++;
    }
    return currentRef;
  };

  const rolesInfo = colorData.color.role;
  for (const theme in rolesInfo) {
    const isLight = theme === 'light';
    let themeObjStr = '';
    
    for (const [roleName, value] of Object.entries(rolesInfo[theme])) {
      const cssVarName = `--color-${roleName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`;
      const resolvedValue = resolveColor(value);
      themeObjStr += `  ${cssVarName}: ${resolvedValue};\n`;
    }
    
    if (isLight) {
      cssLight += themeObjStr;
    } else {
      cssDark += themeObjStr;
    }
  }

  // Typography tokens
  if (typographyData.typography) {
    for (const [category, styles] of Object.entries(typographyData.typography)) {
      for (const [styleName, properties] of Object.entries(styles)) {
        const formattedStyleName = styleName.replace(/\s+/g, '-');
        for (const [propName, propData] of Object.entries(properties)) {
          const cssPropName = propName.replace(/([A-Z])/g, '-$1').toLowerCase();
          const cssVarName = `--font-${formattedStyleName}-${cssPropName}`;
          let value = propData.value;
          if (propData.type === 'dimension' && typeof value === 'number' && value !== 0) {
            value = value + 'px';
          }
          cssLight += `  ${cssVarName}: ${value};\n`;
        }
      }
    }
  }

  cssLight += '}\n';
  cssDark += '}\n';

  const finalCss = `/* Color & Typography Tokens */\n\n${cssLight}\n${cssDark}`;
  
  fs.writeFileSync('tokens.css', finalCss);
  console.log('CSS converted successfully to tokens.css');
}

buildTokens();
