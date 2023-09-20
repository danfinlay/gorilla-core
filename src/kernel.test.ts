// sum.test.js
import { expect, test } from 'vitest'
import { createKernel } from './kernel'

test('can count a few numbers', async () => {
  let count = 0;
  const counterFunc = async () => {
    count++;
    return count;
  }
  const kernel = createKernel({
    prompt: async () => 0,
    initialObjects: [
      {
        object: counterFunc,
        description: {
          methodName: 'counter',
        }
      }
    ]
  });

  const increment = await kernel.request({
    methodName: 'counter',
  });

  await increment();
  await increment();
  const res = await increment();

  expect(res).toBe(3)

})

