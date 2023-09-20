
import { createKernel } from './kernel.ts'
import { promptUser } from './simple-prompt.ts';

let count = 0;
const counterFunc = async () => {
  count++;
  return count;
}
const kernel = createKernel({
  prompt: promptUser,
  initialObjects: [
    {
      object: counterFunc,
      description: {
        methodName: 'counter',
      }
    }
  ]
});

export async function setupCounter(element: HTMLButtonElement) {
  const setCounter = (count: number) => {
    element.innerHTML = `count is ${count}`
  }

  const increment = await kernel.request({
    methodName: 'counter',
  });

  element.addEventListener('click', async () => {
    const count = await increment();
    setCounter(count);
  })
  setCounter(0)
}
