// Keep 'light' and 'payload-theme' in sync with defaultTheme / themeLocalStorageKey in
// src/providers/Theme/shared.ts — this file must be static (no template interpolation) so it can
// be loaded as a real external script src, avoiding React 19's inline-<script>-in-JSX warning.
;(function () {
  function getImplicitPreference() {
    var mediaQuery = '(prefers-color-scheme: dark)'
    var mql = window.matchMedia(mediaQuery)
    var hasImplicitPreference = typeof mql.matches === 'boolean'

    if (hasImplicitPreference) {
      return mql.matches ? 'dark' : 'light'
    }

    return null
  }

  function themeIsValid(theme) {
    return theme === 'light' || theme === 'dark'
  }

  var themeToSet = 'light'
  var preference = window.localStorage.getItem('payload-theme')

  if (themeIsValid(preference)) {
    themeToSet = preference
  } else {
    var implicitPreference = getImplicitPreference()

    if (implicitPreference) {
      themeToSet = implicitPreference
    }
  }

  document.documentElement.setAttribute('data-theme', themeToSet)
})()
