/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-ignore
Element.prototype._attachShadow = Element.prototype.attachShadow;
Element.prototype.attachShadow = function () {
  //@ts-ignore
  const toReturn = this._attachShadow({ mode: "open" });
  setTimeout(() => {
    const allCanvas = toReturn.querySelector("div").querySelectorAll("canvas");
    const canvas = allCanvas[0];
    const img = document.createElement("img");
    img.setAttribute("width", canvas.width);
    img.setAttribute("height", canvas.height);
    document.appendChild(img);
  });
  return toReturn;
};
