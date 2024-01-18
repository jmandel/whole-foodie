export async function selectItem(recipeName, itemName, itemQuantity, candidate) {
    const examples = [{
        recipeName: "Stuffed Peppers",
        itemName: "Bell Pepper",
        itemQuantity: "4 each",
        candidate: "Red and Yellow Bell Pepper",
        answer: {thought: "need bell pepper, candidate is bell peppers, meets requirement", suitable: true, quantity: 4}
    },{
        recipeName: "Banana Bread",
        itemName: "Sugar",
        itemQuantity: "2 cup",
        candidate: "365 by Whole Foods Market, Cane Sugar, 64 Ounce\n",
        answer: {thought: "need sugar, candidate is sugar, meets requirement. 4lb>>2 cups", suitable: true, quantity: 1}
    },{
        recipeName: "Thai Curry",
        itemName: "Eggplant",
        itemQuantity: "2lb",
        candidate: "Striped Eggplant",
        answer: {thought: "need eggplant, candidate is eggplant, meets requirement. eggplant is about 1lb; need 2lb=2eggplant", suitable: true, quantity: 2}
    },{
        recipeName: "English Muffins",
        itemName: "Flour",
        itemQuantity: "4 cups",
        candidate: "Quinoa Flour",
        answer: {thought: "need wheat flour, candidate is quinoa flour", suitable: false, quantity: 0}
    },{
        recipeName: "Chicken Parm",
        itemName: "Chicken Breast Skinless Boneless",
        itemQuantity: "4 lbs",
        candidate: "Tyson Chicken Breast Skinless 6oz",
        answer: {thought: "need chicken breastm, candidate is chicken breast, meets requirement; 4lbs is 6oz*11", suitable: true, quantity: 11}
    }, ]
    
    const prompt = `The Shopping Bot listens to the user's requirements and then determines if a candidate grocery item could meet the stated requirements (sub-types are fine). If suitable, the Bot determines how much is needed to meet the user's requirements, because items may come in different forms. If unsuitable, the Bot explains why.  Response is JSON: {thought: string, suitable: boolean, quantity?: number}. ${
        examples.map(e => `\n---\nRecipe name: ${e.recipeName
        }\nRequired Item: ${e.itemName
        }\nRequired Quantity: ${e.itemQuantity
        }\nCandidate Item: ${e.candidate
        }\nResponse: ${JSON.stringify(e.answer)}`).join("")
        }\n---\nRecipe name: ${recipeName
        }\nRequired Item: ${itemName
        }\nRequired Quantity: ${itemQuantity
        }\nCandidate Item: ${candidate
        }\nResponse: `;
    console.log({
            model: "dolphin-phi",
            stream: false,
            format: "json",
            options: {
                temperature: 0.0
            },
            prompt
        })
    const q = await fetch("http://127.0.0.1:11434/api/generate", {
        method: "POST",
        body: JSON.stringify({
            model: "dolphin-phi",
            stream: false,
            format: "json",
            options: {
                temperature: 0.0
            },
            prompt
        }),
    })
    const rraw = await q.json().then(r => r.response)
    console.log(rraw)
    try {
        const r = JSON.parse(rraw)
        console.log(r)
        return r
    } catch (e) {
        console.log("Error parsing response", e, rraw)
        return {thought: "Error parsing response", suitable: false, quantity: 0}
    }
}

import {program} from "commander";

const args = program
    .version('0.0.1')
    .option('-r, --recipe <recipe>', 'Recipe name')
    .option('-i, --item <item>', 'Item name')
    .option('-q, --quantity <quantity>', 'Quantity')
    .option('-c, --candidate <candidate>', 'Candidate item name')
    .parse(process.argv).opts()

if (args.recipe && args.item && args.quantity && args.candidate)
    selectItem(args.recipe, args.item, args.quantity, args.candidate)