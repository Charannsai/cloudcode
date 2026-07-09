const { withAppBuildGradle } = require('@expo/config-plugins');

const withExcludeSupport = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let buildGradle = config.modResults.contents;
      
      // Append the exclusion block at the end of build.gradle
      if (!buildGradle.includes("exclude group: 'com.android.support'")) {
        const excludeBlock = `
// Exclude legacy support library version of versionedparcelable to avoid class collisions with AndroidX
configurations.all {
    exclude group: 'com.android.support', module: 'versionedparcelable'
}
`;
        buildGradle = buildGradle + "\n" + excludeBlock;
        config.modResults.contents = buildGradle;
      }
    }
    return config;
  });
};

module.exports = withExcludeSupport;
