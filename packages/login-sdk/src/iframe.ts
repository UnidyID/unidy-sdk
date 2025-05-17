export const MESSAGE_TYPE = 'unidy-iframe-resize';

export interface IframeUtility {
  emitSize: () => void;
}

export default function(url: string): IframeUtility {
  function publishHeight(): void {
    const bodyHeight = getBodyHeight();
    parent.postMessage({ type: MESSAGE_TYPE, height: bodyHeight }, url);
  }

  function getBodyHeight(): number {
    return document.body.offsetHeight + 16;
  }

  return {
    emitSize: (): void => {
      window.setInterval(publishHeight, 300);
    },
  };
}
