import { Far } from '@endo/far';
import './compartment-types.d.ts';

interface IMethodDescriptor {
  methodName: string;
  [key: string]: any;
}

type ISpecifier = (reqDesc: any, methodDesc: any) => boolean;
type IRestrictedObject = {
  description: IMethodDescriptor,
  object: any,
}

const restrictedObjects: Set<IRestrictedObject> = new Set();
const specifiers: Map<string, ISpecifier> = new Map();
specifiers.set('methodName', (reqDesc, methodDesc) => {
  if (typeof reqDesc !== 'string' || typeof methodDesc !== 'string') {
    console.log('methodName specifier called with', reqDesc, methodDesc);
    throw new Error('specifier for method name must be a string.');
  }
  return !!reqDesc && reqDesc === methodDesc;
})

const namesToObjects: Map<string, any> = new Map();
const objectsToNames = new WeakMap();

export function registerObject (name: string, object: any) {
  console.log('registering object with name and object', name, object)
  namesToObjects.set(name, object);
  objectsToNames.set(object, name);
}

interface IBootstrap {
  request: (descriptor: IMethodDescriptor ) => Promise<any>;
  registerRestrictedObject: (object: IRestrictedObject) => void;
}

type IKernelSetupOptions = {
  initialObjects?: IRestrictedObject[],
}
export function createKernel (options: IKernelSetupOptions) {
  const { initialObjects = [] } = options;

  console.log('creating kernel with initial objects: ', initialObjects);
  initialObjects.forEach((object) => {
    console.log('iterating object', object);
    register(object.description.methodName, object);
  })

  const bootstrap: IBootstrap = {
    async request (descriptor: IMethodDescriptor): Promise<any> {
      const matchedObjects = getRestrictedObjectsForDescriptor(descriptor);

      console.log('matchedObjects are ', matchedObjects);
      const matchedNames = matchedObjects.map((object) => {
        return objectsToNames.get(object);
      });

      const message = `The current site is requesting a ${descriptor.methodName} from you. Enter the number to select one of your available options:
        ${matchedNames.map((name, index) => { return `${index+1}: ${name}` }).join('\n')}`;

      const index = Number(prompt(message)) - 1;
      if (index === -1) {
        throw new Error('User rejected request');
      }
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
  console.log('registering object with petName and object', petName, object)
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
