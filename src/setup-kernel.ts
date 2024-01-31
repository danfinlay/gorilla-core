
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
    },
    {
      petName: 'no op',
      object: {
        object: async () => {},
        description: {
          methodName: 'noop',
        }
      }
    },
  ]
});

export type IBootstrap = {
  request: (descriptor: IMethodDescriptor ) => Promise<any>,
  registerRestrictedObject: (object: IRestrictedObject) => void,
}
const bootstrap = {
  request: kernel.request,
  registerRestrictedObject: kernel.registerRestrictedObject,
};

export default bootstrap;
