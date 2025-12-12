export type VisibilityKey = 'sidebar' | 'floatingMenu' | 'focusCard' | 'testToolCard'

const KEY_MAP: Record<VisibilityKey, string> = {
  sidebar: 'bht_ui_hide_sidebar',
  floatingMenu: 'bht_ui_hide_floating_menu',
  focusCard: 'bht_ui_hide_focus_card',
  testToolCard: 'bht_ui_hide_test_tool_card',
}

export const UI_VISIBILITY_EVENT = 'ui-visibility-change'
export const AUTH_TOKEN_EVENT = 'auth-token-changed'

export function getVisibility(key: VisibilityKey): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(KEY_MAP[key]) === 'true'
  } catch {
    return false
  }
}

export function setVisibility(key: VisibilityKey, value: boolean) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY_MAP[key], value ? 'true' : 'false')
  } catch {
    return
  }
  window.dispatchEvent(
    new CustomEvent(UI_VISIBILITY_EVENT, {
      detail: { key, value },
    })
  )
}
