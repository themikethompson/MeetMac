const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`Notarizing ${appName} at ${appPath}...`);

  try {
    await notarize({
      appPath: appPath,
      keychainProfile: 'chatmac-notarization',
    });
    console.log('✅ Notarization complete!');
  } catch (error) {
    console.error('❌ Notarization failed:', error);
    throw error;
  }
};
