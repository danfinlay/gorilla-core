import './style.css'
import "@endo/init";

import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'
import bootstrap from './setup-kernel.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <img src="/gorilla.png"/>
    <h1>Gorilla Core</h1>
    <p>An extensible JavaScript kernel for building secure applications</p>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!, bootstrap)
