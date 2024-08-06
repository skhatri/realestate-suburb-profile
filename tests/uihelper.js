

let findElementText = async (parentElement, selector) => {
    let targetElement = await parentElement.locator(selector);
    let elementCount = await targetElement.count();
    if (elementCount > 0) {
        let firstElement = await targetElement.nth(0);
        let value = await firstElement.innerText();
        return value;
    }
    return undefined;
};

let findElementAttribute = async (parentElement, selector, linkName) => {
    let targetElement = await parentElement.locator(selector);
    let elementCount = await targetElement.count();
    if (elementCount > 0) {
        let firstElement = await targetElement.nth(0);
        let value = await firstElement.getAttribute(linkName);
        return value;
    }
    return undefined;
};

module.exports = {
    findElementText,
    findElementAttribute
}