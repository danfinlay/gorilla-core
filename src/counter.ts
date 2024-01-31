import { IBootstrap } from "./setup-kernel";

export async function setupCounter(element: HTMLButtonElement, kernel: IBootstrap) {
  const setCounter = (count: number) => {
    element.innerHTML = `count is ${count}`
  }

  const increment = await kernel.request({
    methodName: 'counter',
  });

  element.addEventListener('click', async () => {
    setCounter(await increment());
  })
  setCounter(1)
}
