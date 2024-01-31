import "@endo/init";
import { Far } from '@endo/far';
import './compartment-types.d.ts';
import { IRestrictedObject, IMethodDescriptor } from "./type-system.ts";

type IKernelSetupOptions = {
  initialObjects?: Array<{
    petName: string,
    object: IRestrictedObject,
  }>,
  prompt: (methodName: string, candidates: IRestrictedObject[], addressBook: IAddressBook) => Promise<any>,
}

const restrictedObjects: Set<IRestrictedObject> = new Set();

export type IAddressBook = {
  namesToObjects: Map<string, any>,
  objectsToNames: WeakMap<any, string>,
}
const namesToObjects: Map<string, any> = new Map();
const objectsToNames: WeakMap<any, string> = new WeakMap();
const addressBook: IAddressBook = {
  namesToObjects,
  objectsToNames,
}

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

  register('Method name type enforcer', {
    description: {
      methodName: 'Type enforcer',
      typeEnforcerName: 'methodName',
      localization: {
        en: `This essential kernel type allows applications to request services by a common name of the type of service it is.`
      }
    },
    object: (reqDesc: any, methodDesc: any) => {
      if (typeof reqDesc !== 'string' || typeof methodDesc !== 'string') {
        throw new Error('specifier for method name must be a string.');
      }
      return !!reqDesc && reqDesc === methodDesc;
    },
  })

  initialObjects.forEach((object) => {
    register(object.petName, object.object);
  })

  const bootstrap: IBootstrap = {
    async request (descriptor: IMethodDescriptor): Promise<any> {
      // Filter options for type matches:
      const matchedObjects = getRestrictedObjectsForDescriptor(descriptor);

      // Prompt the user:
      return await options.prompt(descriptor.methodName, matchedObjects, addressBook);
    },

    async registerRestrictedObject (restricted: IRestrictedObject) {
      const approved = confirm(`Would you like to add a method to your wallet?: ${JSON.stringify(restricted.object.description)}`);
      if (!approved) {
        throw new Error('User rejected request');
      }

      let petName;
      let promptText = 'What would you like to name it?'
      while (!petName) {
        petName = prompt(promptText);
        if (!petName || petName === '') {
          throw new Error('Must provide a name.');
        }

        // Check if it exists already:
        let existing = namesToObjects.get(petName);
        if (existing) {
          petName = prompt(`That name is already taken. Please choose another.`) || '';
          existing = namesToObjects.get(petName);
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

type ISpecifier = (reqDesc: any, methodDesc: any) => boolean;
function methodNameSpecifier (reqDesc: string, methodDesc: string): boolean {
  if (typeof reqDesc !== 'string' || typeof methodDesc !== 'string') {
    throw new Error('specifier for method name must be a string.');
  }
  return !!reqDesc && reqDesc === methodDesc;
}

/**
 * This function is used to filter the restricted objects for a given descriptor.
 * It first pulls out all the restrictedObject members whose `methodName` is `Type enforcer`,
 * It then uses any of the keys in the description to select the appropriate specifier,
 * and run all of the specifier's checks as a filter against all the restricted objects.
 */
function getRestrictedObjectsForDescriptor (
  description: IMethodDescriptor
) {

  const specifiers: IRestrictedObject[] = [...restrictedObjects.values()]
  .filter((object: IRestrictedObject) => {
    return object.description.methodName === 'Type enforcer';
  });

  let matchedObjects = [...restrictedObjects.values()]
  .filter((object: IRestrictedObject) => {
    let matched = true;

    Object.keys(description)
    .forEach((specifierKey) => {
      const specifier = specifiers.find((specifier) => {
        return specifier.description.typeEnforcerName === specifierKey;
      });
      if (!specifier) {
        throw new Error(`Unable to provide specificity for descriptor ${specifierKey} with description ${JSON.stringify(description[specifierKey])}`);
      }

      if (specifierKey in object.description) {
        if (!specifier.object(
          description[specifierKey],
          object.description[specifierKey]
        )) {
          matched = false;
        }
      }
    });

    return matched;
  });

  return matchedObjects;
}
