/**
 * The optional features in this app. Each is a folder of its own here.
 *
 * To leave one out, delete its line and its folder, and its Go side too where it has
 * one: docs/removing-features.md has the steps for each.
 */

import {biodataType} from '../biodata/biodata'
import {BIODATA_FORMATS} from '../biodata/biodata-export'
import {cvType} from '../cv/cv'
import {CV_FORMATS} from '../cv/cv-export'
import {TOURS} from '../cv/tours'
import type {Feature} from '../shell/feature'
import {backup} from './backup'
import {exporting} from './export'
import {assistants} from './mcp'
import {report} from './report'
import {tour} from './tour'

export const FEATURES: readonly Feature[] = [
    exporting({[cvType.kind]: CV_FORMATS, [biodataType.kind]: BIODATA_FORMATS}),
    backup,
    report,
    tour(TOURS),
    assistants({[cvType.kind]: CV_FORMATS, [biodataType.kind]: BIODATA_FORMATS}),
]
