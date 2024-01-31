
import { createKernel } from './kernel.ts'
import { promptUser } from './simple-prompt.ts';

let count = 1;
const counterFunc = async () => {
  count++;
  return count;
}
const doublerFunc = async () => {
  count *= 2;
  return count;
}
const kernel = createKernel({
  prompt: promptUser,
  initialObjects: [
    {
      petName: 'counter',
      object: {
        object: counterFunc,
        description: {
          methodName: 'counter',
        }
      }
    },
    {
      petName: 'doubler',
      object: {
        object: doublerFunc,
        description: {
          methodName: 'counter',
        }
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
    setCounter(await increment(count));
  })
  setCounter(count)
}
