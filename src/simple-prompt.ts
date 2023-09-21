import { IRestrictedObject, IAddressBook } from './kernel';

export async function promptUser (methodName: string, candidates: IRestrictedObject[], addressBook: IAddressBook): Promise<number> {

  const message = `The current site is requesting a ${methodName} from you. Enter the name of one to grant it, or cancel to reject:
  ${candidates.map((candidate) => { return `${addressBook.objectsToNames.get(candidate)}` }).join('\n')}`;

  const chosenName = prompt(message);
  if (!chosenName) {
    throw new Error('User rejected request');
  }

  const chosen = addressBook.namesToObjects.get(chosenName);
  return chosen.object;
}