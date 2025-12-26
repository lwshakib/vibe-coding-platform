import { WebContainer } from "@webcontainer/api";

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export async function getWebContainerInstance() {
  if (webcontainerInstance) {
    return webcontainerInstance;
  }
  if (bootPromise) {
    return bootPromise;
  }
  bootPromise = WebContainer.boot().then((instance) => {
    webcontainerInstance = instance;
    return instance;
  });
  return bootPromise;
}
