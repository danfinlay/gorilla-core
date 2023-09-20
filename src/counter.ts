
import { createKernel } from './kernel.ts'

let count = 0;
const counterFunc = async () => {
  count++;
  return count;
}
const kernel = createKernel({
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
  let counter = 0
  const setCounter = (count: number) => {
    counter = count
    element.innerHTML = `count is ${counter}`
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
