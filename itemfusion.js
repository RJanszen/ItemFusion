// Enable file input
var fs = require("fs");
var data = fs.readFileSync('item-fusion-data.txt');

// Enable user input
var readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);
var userItem;

// Imported data will be stored in:
var storeList = {};
var itemList = new Array;

// Check whether a new entry is 'really new'
function isNewEntry(entry, arrayList) {
	for (index of arrayList) {
		if (index.name === entry.name) return false;
	}
	return true;
}

// Remove '*' and spaces on outer bounds of a string
function withCorrectFormat(string) {
	string = string.replace("*", "");
	string = string.trim();
    return string;
}

// Store setter
function store(storeName) {
	this.name = storeName;
}

// Item constructor, an item has a name, price, storenumber, and potential fusions
function item(itemName, itemPrice, storeNumber, fusions) {
	this.name = itemName;
	this.price = itemPrice;
	this.store = storeNumber;
	if (fusions != undefined) this.fusions = fusions;
	else this.fusions = new Array;
}

// Fusion constructor, a fustion consists of two items (which in turn can have fusions as well)
function fusion(fusion, itemOne, itemTwo) {
	this.name = fusion;
	this.itemOne = itemOne;
	this.itemTwo = itemTwo;
}

// Leaf constructor, a leaf is one path of possible fusions with a minimum price or store level
function leaf(originItem, fusions, minPrice, minStore) {
	this.origin = originItem;
	this.fusions = fusions;
	this.minPrice = minPrice;
	this.minStore = minStore;
}

// Find an item object by giving a string
function findItem(itemName) {
	itemName = itemName.trim();
	for (var index in itemList) {
		index = index.trim();
		if (itemName.toLowerCase() == itemList[index].name.toLowerCase()) { // Find case insensitive matching name
			return itemList[index]; // return if match (code below not executed)
		}
	}
	itemList.push(new item(itemName, undefined, undefined, undefined)); // Component not known as purchasable or fusable, add it to our data object
	return itemList[itemList.length - 1]; // return last added item
}

// Add a fuse to an item
function addFuseToItemlist(fuse) {
	if (isNewEntry(fuse, itemList)) {
		var itemFound = new item(fuse.name, 11111, 6); // Add new entry
		itemList.push(itemFound);
	} else for (var itemX of itemList) {
		if (itemX.name === fuse.name) {
			itemX.fusions.push([findItem(fuse.itemOne), findItem(fuse.itemTwo)]); // Use existing item (and fusion items)
		}
	}
}


// Extract a 'readline' component to add a store's name and number to our data object
function lineToStore(line, storeNumber) {
	var storeName = line.split(/\s[Items]/)[0];
	storeList[storeNumber] = storeName;
}

// Extract a 'readline' component to get and add the correct item to our data object
function lineToItem (line, storeNumber) {
	var itemInfo = line.split(/\s\~\s/);
	var itemFound = new item(withCorrectFormat(itemInfo[0]), itemInfo[1], storeNumber);
	if (isNewEntry(itemFound, itemList)) itemList.push(itemFound);
}

// Exctract a 'readline' component to pass the correct fusion items to our 'add fuse' function
function lineToFuse (line) {
	var fuseInfo = line.split(/\s\+\s|\s\=/);
	var fuseFound = new fusion(withCorrectFormat(fuseInfo[2]), fuseInfo[0], fuseInfo[1]);
	addFuseToItemlist(fuseFound);
}

// Take 'read txt file' data and organize it
function organizeData(data) {
	// Input pattern matching
	var storePattern = RegExp("^\.+Store.Items");
	var costPattern = RegExp("^\\**(\\w.+\\w)\\s*~\\s*(\\d+)");
	var fusionPattern = RegExp("^(\\w.+\\w)\\s*\\+\\s*(\\w.+\\w)\\s*=\\s*([\\w\\s]+\\w).*");

	var storeNumber = 0;
	for (var line in data) {
		if (storePattern.test(data[line])) { // Found store occurence
			lineToStore(data[line], ++storeNumber);
		} else if (costPattern.test(data[line])) { // Found store items occurence
			lineToItem(data[line], storeNumber);
		} else if (fusionPattern.test(data[line])) { // Found fuse occurence
			lineToFuse(data[line]);
		}
	}
}

// Read the txt file and pass it to the organize function
function readTextFile(data) {
	data = data.toString();
	organizeData(data.split("\r\n"));
	console.log("Itemlist succesfully imported: " + itemList.length + " entry items.");
}

// The resulting tree print-function of a minimum price match or minimum store match
function printTree(leaf, depth) {
	if (depth > 4) return; // Iterations go 5-deep
	var insert = "";
	for (var i = 0; i < depth; i++) {
		insert += "-";
	}
	console.log(insert + leaf.origin.name + ": " + leaf.minPrice); // Insert item info
	for (var fusion of leaf.fusions) {
		for (var component of fusion) {
			printTree(component, depth + 1); // Iterate to next component on same line
		}
	}
}

// The resulting 'shopping list' of required items to buy, to obtain the requested item
function printShoppingList(leaf) {
	if(typeof leaf.fusions != "undefined" && leaf.fusions != null && leaf.fusions.length > 0) {
		for (var fusion of leaf.fusions) {
			for (var component of fusion) {
				printShoppingList(component); // Iterate to next component
			}
		}
	} else {
		console.log(leaf.origin.name + "\t" + leaf.origin.price + "\t" + leaf.origin.store); // Print item info
	}
}

// Take an array, and add an object to it
function mergeArrayWithItem(array, item) {
	retArray = [item];
	for (var index of array) {
		retArray.push(index);
	}
	return retArray;
}

// Count the total number of iterations on each depth array[0,1,..n]
var iterations = [0,0,0,0,0,0];
function sumOfItteration(iterationArray) {
	var sum = 0;
	for (var index of iterationArray) {
		sum += index;
	}
	return sum;
}

// Take an item, the entrylist of items, and the desired depth of the iteration, and find the CHEAPEST path (leaf)
function itterateToCheapest(item, entryList, depth) {
	var fuseList = [];
	var price = item.price;
	var store = item.store;
	var subEntryList = new Array;
	subEntryList = mergeArrayWithItem(entryList, item);
	var subDepth = 0 + depth;
	subDepth++;

	for (var fusion of item.fusions) {
		if (isNewEntry(fusion[0], subEntryList) && isNewEntry(fusion[1], subEntryList) && subDepth < 4) {
			iterations[subDepth]++;
			var leafOne = itterateToCheapest(fusion[0], subEntryList, subDepth); // Try first item of n-th fusion
			var leafTwo = itterateToCheapest(fusion[1], subEntryList, subDepth); // Try second item of n-th fusion
			if ((parseInt(leafOne.minPrice) + parseInt(leafTwo.minPrice)) < price) { // If leaf's eventual price is lower, accept it as best path
				price = parseInt(leafOne.minPrice) + parseInt(leafTwo.minPrice);
				fuseList[0] = [leafOne, leafTwo];
			} else {
				price = price; // Else, this.price remains the original item's price
			}
		}
	}
	return new leaf(item, fuseList, price, store); // Return the best leaf (and it's subleafs)
}

// Take an item, the entrylist of items, and the desired depth of the iteration, and find the FASTEST path (leaf)
function itterateToFastest(item, entryList, depth) {
	var fuseList = [];
	var price = item.price;
	var store = item.store;
	var subEntryList = new Array;
	subEntryList = mergeArrayWithItem(entryList, item);
	var subDepth = 0 + depth;
	subDepth++;

	for (var fusion of item.fusions) {
		if (isNewEntry(fusion[0], subEntryList) && isNewEntry(fusion[1], subEntryList) && subDepth < 4) {
			iterations[subDepth]++;
			var leafOne = itterateToFastest(fusion[0], subEntryList, subDepth); // Try first item of n-th fusion
			var leafTwo = itterateToFastest(fusion[1], subEntryList, subDepth); // Try second item of n-th fusion

			if (Math.max(parseInt(leafOne.minStore), parseInt(leafTwo.minStore)) < parseInt(store)) { // If leaf's eventual store is faster, accept it as best path
				store = Math.max(parseInt(leafOne.minStore), parseInt(leafTwo.minStore));
				price = parseInt(leafOne.minPrice) + parseInt(leafTwo.minPrice); // Also add the resulting price for completeness
				fuseList[0] = [leafOne, leafTwo];
			} else {
				store = store; // Else, this.store remains the original item's store
			}
		}
	}
	return new leaf(item, fuseList, price, store); // Return the best leaf (and it's subleafs)
}

// Console log function and calling of iteration and printing methods
function requestResultOf(item, iterationMethod) {
	var result = iterationMethod(item, [], 0);
	printTree(result, 0);
	console.log("\nShopping list:\n" + "=".repeat(29) + "\nItem\t\tPrice\tStore");
	printShoppingList(result);
	console.log("\nTotal iterations: " + sumOfItteration(iterations));
}

// Verify the input for 'cheapest or fastest' which must be either 'c'('C') or 'f'('F')
function verifyPathRequest(answer) {
	if (answer.toLowerCase() === ("c").toLowerCase()) {
		requestResultOf(userItem, itterateToCheapest); // Find cheapest
	} else if (answer.toLowerCase() === ("f").toLowerCase()) {
		requestResultOf(userItem, itterateToFastest); // Find fastest
	} else {
		console.log("Not a valid input.");
		promptUser("Cheapest or Fastest path? [c/f]", verifyPathRequest); // Invalid input, ask again
	}
}

// Verify the requested item
function verifyItemRequest(answer) {
	try {
		userItem = findItem(answer);
		console.log("Item found!\nName:\t\t" + userItem.name + "\nPrice:\t\t" + userItem.price + "\nStore:\t\t" + userItem.store +"\n"); // Correct item (it's an entry in the data object)
	} catch(err) {
		console.log("Not a valid item.");
		promptUser("Give item name:", verifyItemRequest); // Couldn't find the item in the entrylist
	}
	promptUser("Cheapest or Fastest path? [c/f]", verifyPathRequest); // Next question
}

// Prompt function, which takes the question and the destination function to take the input
function promptUser(prompt, destination) {
	rl.question(prompt + "\n> ", destination);
}

// Read the .txt file and prompt the first input question
readTextFile(data);
promptUser("Give item name:", verifyItemRequest);