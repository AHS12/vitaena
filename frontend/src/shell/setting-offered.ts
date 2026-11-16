import type {SettingSpec} from '../core/settings/settings-spec'
import {hasTray} from '../platform/window'
import {hasFeature} from './feature'

/** Whether a setting is offered here: some need a tray, or an optional feature. */
export const offered = (spec: SettingSpec): boolean => (!spec.needsTray || hasTray()) && (!spec.needsFeature || hasFeature(spec.needsFeature))
