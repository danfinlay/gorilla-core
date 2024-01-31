import './compartment-types.d.ts';

// The extensible type definition data
export interface IMethodDescriptor {
  methodName: string;
  [key: string]: any;
}

// The function used for interpreting a keyed value on the extensible type
type ISpecifier = (reqDesc: any, methodDesc: any) => boolean;
export type IRestrictedObject = {
  description: IMethodDescriptor,
  object: any,
}

type ITypeSystem = {
  registerPower: (power: IRestrictedObject) => Promise<boolean>,
  requestTypedPower: (powers: any[], reqType: IMethodDescriptor) => Promise<any>,
  getTypeFor: (power: any) => Promise<IMethodDescriptor | undefined>,
}


export async function createTypeSystem (opts = {}): Promise<ITypeSystem> {

  const powerToType: WeakMap<any, IMethodDescriptor> = new WeakMap();

  const specifiers: Map<string, ISpecifier> = new Map();

  // Initialize default "methodName" specifier:
  specifiers.set('methodName', (reqDesc, methodDesc) => {
    if (typeof reqDesc !== 'string' || typeof methodDesc !== 'string') {
      throw new Error('specifier for method name must be a string.');
    }
    return !!reqDesc && reqDesc === methodDesc;
  })

  async function requestTypedPower (
    restrictedObjects: any[],
    description: IMethodDescriptor,
  ): Promise<any[]> {

    let matchedObjects = [...restrictedObjects.values()]
    .filter((object: IRestrictedObject) => {
      let matched = true;

      Object.keys(description)
      .forEach((specifierKey) => {
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

  return {
    registerPower: async (power: IRestrictedObject) => {
      powerToType.set(power.object, power.description);
      return true;
    },
    requestTypedPower,
    getTypeFor: async (power: IRestrictedObject) => {
      return powerToType.get(power);
    }
  }
}
