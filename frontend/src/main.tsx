import React from 'react'
import {createRoot} from 'react-dom/client'
import './styles/app.css'
import {App} from './app/App'
import {startAddedFonts} from './cv/added-fonts'
import {startFontPacks} from './cv/downloaded-fonts'
import {addScriptFaces} from './cv/script-faces'
import {FEATURES} from './features'
import {connectShell} from './platform/shell'
import {registerFeatures} from './shell/feature'

registerFeatures(FEATURES)
addScriptFaces()

const container = document.getElementById('root')

// Inside the app, Go and the window are reached once the shell is connected, so
// nothing is drawn before then.
void connectShell().then(() => {
    startAddedFonts()
    startFontPacks()
    createRoot(container!).render(
        <React.StrictMode>
            <App/>
        </React.StrictMode>
    )
})
