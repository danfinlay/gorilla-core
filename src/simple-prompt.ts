import { IRestrictedObject } from './kernel';

export async function promptUser (methodName: string, candidates: IRestrictedObject[], addressBook: Map<IRestrictedObject, string>): Promise<number> {

  const message = `The current site is requesting a ${methodName} from you. Enter the number to select one of your available options:
  ${candidates.map((candidate, index) => { return `${index+1}: ${addressBook.get(candidate)}` }).join('\n')}`;

  const index = Number(prompt(message)) - 1;
  if (index === -1) {
    throw new Error('User rejected request');
  }

  return index
}