const { withAppBuildGradle } = require('@expo/config-plugins');

const withExcludeSupport = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let buildGradle = config.modResults.contents;
      
      // Append the global com.android.support exclusion block at the end of build.gradle
      if (!buildGradle.includes("exclude group: 'com.android.support'")) {
        const excludeBlock = `
// Exclude all legacy android support library groups to prevent duplicate class conflicts with AndroidX
configurations.all {
    exclude group: 'com.android.support'
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
