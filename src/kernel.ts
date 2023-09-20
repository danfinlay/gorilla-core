import "@endo/init";
import { Far } from '@endo/far';
import './compartment-types.d.ts';

type IKernelSetupOptions = {
  initialObjects?: IRestrictedObject[],
  prompt: (methodName: string, candidates: IRestrictedObject[], addressBook: WeakMap<IRestrictedObject, string>) => Promise<number>,
}

export interface IMethodDescriptor {
  methodName: string;
  [key: string]: any;
}

type ISpecifier = (reqDesc: any, methodDesc: any) => boolean;
export type IRestrictedObject = {
  description: IMethodDescriptor,
  object: any,
}

const restrictedObjects: Set<IRestrictedObject> = new Set();
const specifiers: Map<string, ISpecifier> = new Map();
specifiers.set('methodName', (reqDesc, methodDesc) => {
  if (typeof reqDesc !== 'string' || typeof methodDesc !== 'string') {
    throw new Error('specifier for method name must be a string.');
  }
  return !!reqDesc && reqDesc === methodDesc;
})

const namesToObjects: Map<string, any> = new Map();
const objectsToNames = new WeakMap();

export function registerObject (name: string, object: any) {
  namesToObjects.set(name, object);
  objectsToNames.set(object, name);
}

interface IBootstrap {
  request: (descriptor: IMethodDescriptor ) => Promise<any>;
  registerRestrictedObject: (object: IRestrictedObject) => void;
}


export function createKernel (options: IKernelSetupOptions) {
  const { initialObjects = [] } = options;
  if (!('prompt' in options)) {
    throw new Error('Must provide a prompt function to the gorilla core');
  }

  initialObjects.forEach((object) => {
    register(object.description.methodName, object);
  })

  const bootstrap: IBootstrap = {
    async request (descriptor: IMethodDescriptor): Promise<any> {
      const matchedObjects = getRestrictedObjectsForDescriptor(descriptor);

      const index = await options.prompt(descriptor.methodName, matchedObjects, objectsToNames);
      return matchedObjects[index].object;
    },

    async registerRestrictedObject (restricted: IRestrictedObject) {
      const approved = confirm(`Would you like to add a method to your wallet?: ${JSON.stringify(restricted.description)}`);
      if (!approved) {
        throw new Error('User rejected request');
      }

      let petName;
      let promptText = 'What would you like to name it?'
      while (!petName) {
        const petName = prompt(promptText);
        if (!petName || petName === '') {
          throw new Error('Must provide a name.');
        }

        // Check if it exists already:
        const existing = namesToObjects.get(petName);
        if (existing) {
          promptText = `That name is already taken. Are you sure?`
          const sure = confirm(promptText);
          if (sure) {
            register(petName, restricted);
          }
          promptText = `What would you like to name it?`
        }

        register(petName, restricted);
      }
    },
  }

  return Far('metamask-bootstrap', bootstrap);
}

function register (petName: string, object: IRestrictedObject) {
  restrictedObjects.add(object);
  objectsToNames.set(object, petName);
  namesToObjects.set(petName, object);
}

function getRestrictedObjectsForDescriptor (
  description: IMethodDescriptor
) {


  let matchedObjects = [...restrictedObjects.values()]
  .filter((object: IRestrictedObject) => {
    let matched = true;


    const selectedSpecifiers = Object.keys(description)
    .map((specifierKey) => {
      const specifier = specifiers.get(specifierKey);
      if (!specifier) {
        throw new Error(`Unable to provide specificity for descriptor ${specifierKey} with description ${JSON.stringify(description[specifierKey])}`);
      }

      if (specifierKey in object.description) {
        const specifierCompartment = new Compartment({
          specifier,
        }); 
        if (!specifierCompartment.evaluate(`
            specifier(
              ${JSON.stringify(description[specifierKey])},
              ${JSON.stringify(object.description[specifierKey])}
            )
            `
        )) {
          matched = false;
        }
      }
    });

    return matched;
  });

  return matchedObjects;
}
