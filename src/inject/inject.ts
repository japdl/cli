/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-ignore
Element.prototype._attachShadow = Element.prototype.attachShadow;
Element.prototype.attachShadow = function () {
  //@ts-ignore
  const toReturn = this._attachShadow({ mode: "open" });
  setTimeout(() => {
    const allCanvas = toReturn.querySelector("div").querySelectorAll("canvas");
    //@ts-ignore
    allCanvas.forEach((canvas) => {
      try {
        canvas.getContext("2d").getImageData(0, 0, 0, 0);
      } catch (e) {
        document.body.appendChild(canvas);
      }
    });
  });
  return toReturn;
};
