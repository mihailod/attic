"use strict";

// apData.m and the pricing of apProductDetailViewController.m, ported: the products, the search, the panoramic
// canvas's formats, and the price, computed in 32-bit floats as the app did.

const products1 = ["Stickers", "Printable Beverage Cans", "Writing Pads", "Stationery",
    "Envelopes", "Books and Brochures", "Desk Pads", "Tickets",
    "Labels", "Leaflets", "Flyer", "Office Equipment", "Greeting and Invitation Cards",
    "Sticky Notes", "Calendars", "Wristbands", "Pens", "Magazines", "Folders", "Multimedia", "Posters",
    "Plastic Cards", "Postcards", "Product Packaging",
    "Promotional Items", "Sponsors Items", "Stamps and Accessories", "Bags", "Business Cards",
    "Greeting & Invitation Cards", "Rigid Foam Board", "Adhesive Film", "Private Label Drinks"];

const products2 = ["Beach Banner", "Fabric Banner", "Sticker", "Direct Print on Acryllic Glass", "Envelopes",
    "Desk Pads", "Tickets", "Direct Print on Glass", "Displays", "Flags",
    "Large Format Posters", "Large Format Stickers", "Slipcovers", "Slipcovers for Fences",
    "Customer Signs", "Panoramic Canvas", "Roll-on", "Magnetic Foil", "Posters Stafix", "Photo Album"];

const products3 = ["Desk and Floor Windows", "Folding Frame", "Poster Clamps", "L-Stand", "Menu Card Holder",
    "Prospect Bag", "Brochure Stand (plastic)", "Brochure Stand (metal)", "Table Tents",
    "Business Card Cases", "Business Card Holder", "Money Tray"];

const panoramicCanvasPrices = [80, 102, 142, 212, 249, 249, 269, 349, 349, 369, 469, 469];
const panoramicCanvasResolutions = ["762 x 381 px", "920 x 460 px", "1370 x 460 px", "1830 x 450 px",
    "1830 x 610 px", "1830 x 610 px", "1830 x 610 px", "1830 x 920 px",
    "1830 x 915 px", "1830 x 915 px", "2285 x 1150 px", "2300 x 1150 px"];
const panoramicCanvasFormats = ['20" x 10"', '24" x 12"', '36" x 12"', '48" x 12"', '48" x 16"', '3 panel splits 48" x 16"',
    '4 panel splits 48" x 16"', '48" x 24"', '3 panel splits 48" x 24"', '4 panel splits 48" x 24"', '60" x 30"', '3 panel splits 60" x 30"'];
const shippingPrices = [5, 25, 30];
const quantities = [250, 500, 1000, 1500, 2000, 2500, 5000, 7500, 10000, 20000, 50000];

// search: case-insensitive, through the three lists in turn
function search(text) {
    const t = text.toLowerCase();
    return [...products1, ...products2, ...products3].filter(s => s.toLowerCase().includes(t));
}

// the price, in floats: canvasPrice * (1 - discount) * quantity + shipping; fixed, in exact cents
const f = Math.fround;
function price(format, stepperValue, delivery, fixed = false) {
    const quantityValue = quantities[stepperValue - 1];
    const discountPercent = (stepperValue - 1) * 2;
    if (fixed) {
        const cents = panoramicCanvasPrices[format] * 100 * (100 - discountPercent) / 100 * quantityValue + shippingPrices[delivery] * 100;
        return { price: Math.round(cents) / 100, cents: Math.round(cents), discountPercent, quantityValue };
    }
    const discount = f(discountPercent / 100.00);                  // (float)discountPercent / 100.00, a double, kept in a float
    const finalPrice = f(f(f(f(panoramicCanvasPrices[format]) * f(1 - discount)) * f(quantityValue)) + f(shippingPrices[delivery]));
    return { price: finalPrice, discountPercent, quantityValue };
}

// the sum of the cart, added up in a float as the app did
function cartSum(items, fixed = false) {
    if (fixed) return items.reduce((s, it) => s + it.cents, 0) / 100;
    let sum = f(0);
    for (const it of items) sum = f(sum + it.price);
    return sum;
}

// NSNumberFormatter, currency style, EUR, with "," for decimals and "." for thousands: €76.804,99
function euro(v) {
    // rounded half to even, as NSNumberFormatter does; a float times 100 is exact in a double
    const x = v * 100, fl = Math.floor(x), fr = x - fl;
    const cents = fr > 0.5 || (fr === 0.5 && fl % 2 !== 0) ? fl + 1 : fl;
    const neg = cents < 0, a = Math.abs(cents);
    const whole = String(Math.floor(a / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (neg ? "-" : "") + "€" + whole + "," + String(a % 100).padStart(2, "0");
}

if (typeof module !== "undefined") module.exports = { products1, products2, products3, panoramicCanvasPrices, panoramicCanvasResolutions, panoramicCanvasFormats, shippingPrices, quantities, search, price, cartSum, euro };
