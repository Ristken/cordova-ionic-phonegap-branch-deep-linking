// update the xcode preferences to allow associated domains
(function () {
  // properties
  'use strict'
  var path = require('path')
  var compare = require('node-version-compare')
  var IOS_DEPLOYMENT_TARGET = '8.0'
  var COMMENT_KEY = /_comment$/

  // entry
  module.exports = {
    enableAssociatedDomains: enableAssociatedDomains
  }

  // methods
  function enableAssociatedDomains (preferences) {
    var entitlementsFile = path.join(preferences.projectRoot, 'platforms', 'ios', preferences.bundleName, 'Resources', preferences.bundleName + '.entitlements')
    var projectFile = preferences.projectPlatform.parseProjectFile(path.join(preferences.projectRoot, 'platforms', 'ios'))

    activateAssociativeDomains(projectFile.xcode, entitlementsFile)
    addPbxReference(projectFile.xcode, entitlementsFile)
    projectFile.write()
  }

  function activateAssociativeDomains (xcodeProject, entitlementsFile) {
    var configurations = removeComments(xcodeProject.pbxXCBuildConfigurationSection())
    var config
    var buildSettings
    var deploymentTargetIsUpdated

    for (config in configurations) {
      buildSettings = configurations[config].buildSettings
      buildSettings.CODE_SIGN_ENTITLEMENTS = '"' + entitlementsFile + '"'

      // if deployment target is less then the required one - increase it
      if (buildSettings.IPHONEOS_DEPLOYMENT_TARGET) {
        var buildDeploymentTarget = buildSettings.IPHONEOS_DEPLOYMENT_TARGET.toString()
        if (compare(buildDeploymentTarget, IOS_DEPLOYMENT_TARGET) === -1) {
          buildSettings.IPHONEOS_DEPLOYMENT_TARGET = IOS_DEPLOYMENT_TARGET
          deploymentTargetIsUpdated = true
        }
      } else {
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET = IOS_DEPLOYMENT_TARGET
        deploymentTargetIsUpdated = true
      }
    }

    if (deploymentTargetIsUpdated) {
      console.warn('IOS project now has deployment target set as: ' + IOS_DEPLOYMENT_TARGET)
    }

    console.warn('IOS project Code Sign Entitlements now set to: ' + entitlementsFile)
  }

  function addPbxReference (xcodeProject, entitlementsFile) {
    var fileReferenceSection = removeComments(xcodeProject.pbxFileReferenceSection())

    if (isPbxReferenceAlreadySet(fileReferenceSection, entitlementsFile)) {
      console.warn('Entitlements file is in reference section.')
      return
    }

    console.warn('Entitlements file is not in references section, adding it')
    xcodeProject.addResourceFile(path.basename(entitlementsFile))
  }

  function isPbxReferenceAlreadySet (fileReferenceSection, entitlementsFile) {
    var isAlreadyInReferencesSection = false
    var uuid
    var fileRefEntry

    for (uuid in fileReferenceSection) {
      fileRefEntry = fileReferenceSection[uuid]
      if (fileRefEntry.path && fileRefEntry.path.indexOf(entitlementsFile) > -1) {
        isAlreadyInReferencesSection = true
        break
      }
    }

    return isAlreadyInReferencesSection
  }

  function removeComments (obj) {
    var keys = Object.keys(obj)
    var newObj = {}

    for (var i = 0, len = keys.length; i < len; i++) {
      if (!COMMENT_KEY.test(keys[i])) {
        newObj[keys[i]] = obj[keys[i]]
      }
    }

    return newObj
  }
})()