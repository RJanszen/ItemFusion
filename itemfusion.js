// Enable file input
var fs = require("fs");
var data = fs.readFileSync('item-fusion-data.txt');

// Enable user input
var readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);
var userItem;

var storeList = {};
var itemList = new Array;


function isNewEntry(entry, arrayList) {
	for (index of arrayList) {
		if (index.name === entry.name) return false;
	}
	return true;
}

function withCorrectFormat(string) {
	string = string.replace("*", "");
	string = string.trim();
    return string;
}

function store(storeName) {
	this.name = storeName;
}

function item(itemName, itemPrice, storeNumber, fusions) {
	this.name = itemName;
	this.price = itemPrice;
	this.store = storeNumber;
	if (fusions != undefined) this.fusions = fusions;
	else this.fusions = new Array;
}

function fusion(fusion, itemOne, itemTwo) {
	this.name = fusion;
	this.itemOne = itemOne;
	this.itemTwo = itemTwo;
}

function leaf(originItem, fusions, minPrice, minStore) {
	this.origin = originItem;
	this.fusions = fusions;
	this.minPrice = minPrice;
	this.minStore = minStore;
}

function findItem(itemName) {
	itemName = itemName.trim();
	for (var index in itemList) {
		index = index.trim();
		if (itemName.toLowerCase() == itemList[index].name.toLowerCase()) { // Find case insensitive matching name
			return itemList[index];
		}
	}
	itemList.push(new item(itemName, undefined, undefined, undefined)); // Component not known as purchasable or fusable
	return itemList[itemList.length - 1];
}

function addFuseToItemlist(fuse) {
	if (isNewEntry(fuse, itemList)) {
		var itemFound = new item(fuse.name, 11111, 6);
		itemList.push(itemFound);
	} else for (var itemX of itemList) {
		if (itemX.name === fuse.name) {
			itemX.fusions.push([findItem(fuse.itemOne), findItem(fuse.itemTwo)]);
		}
	}
}

function lineToStore(line, storeNumber) {
	var storeName = line.split(/\s[Items]/)[0];
	storeList[storeNumber] = storeName;
}

function lineToItem (line, storeNumber) {
	var itemInfo = line.split(/\s\~\s/);
	var itemFound = new item(withCorrectFormat(itemInfo[0]), itemInfo[1], storeNumber);
	if (isNewEntry(itemFound, itemList)) itemList.push(itemFound);
}

function lineToFuse (line) {
	var fuseInfo = line.split(/\s\+\s|\s\=/);
	var fuseFound = new fusion(withCorrectFormat(fuseInfo[2]), fuseInfo[0], fuseInfo[1]);
	addFuseToItemlist(fuseFound);
}

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

function readTextFile(data) {
	data = data.toString();
	organizeData(data.split("\r\n"));
	console.log("Itemlist succesfully imported: " + itemList.length + " entry items.");
}

function printTree(leaf, depth) {
	if (depth > 4) return;
	var insert = "";
	for (var i = 0; i < depth; i++) {
		insert += "-";
	}
	console.log(insert + leaf.origin.name + ": " + leaf.minPrice);
	for (var fusion of leaf.fusions) {
		for (var component of fusion) {
			printTree(component, depth + 1);
		}
	}
}

function printShoppingList(leaf) {
	if(typeof leaf.fusions != "undefined" && leaf.fusions != null && leaf.fusions.length > 0) {
		for (var fusion of leaf.fusions) {
			for (var component of fusion) {
				printShoppingList(component);
			}
		}
	} else {
		console.log(leaf.origin.name + "\t" + leaf.origin.price + "\t" + leaf.origin.store);
	}
}

function mergeArrayWithItem(array, item) {
	retArray = [item];
	for (var index of array) {
		retArray.push(index);
	}
	return retArray;
}

var iterations = [0,0,0,0,0,0];
function sumOfItteration(iterationArray) {
	var sum = 0;
	for (var index of iterationArray) {
		sum += index;
	}
	return sum;
}

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
			var leafOne = itterateToCheapest(fusion[0], subEntryList, subDepth);
			var leafTwo = itterateToCheapest(fusion[1], subEntryList, subDepth);
			if ((parseInt(leafOne.minPrice) + parseInt(leafTwo.minPrice)) < price) {
				price = parseInt(leafOne.minPrice) + parseInt(leafTwo.minPrice);
				fuseList[0] = [leafOne, leafTwo];
			} else {
				price = price;
			}
		}
	}
	return new leaf(item, fuseList, price, store);
}

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
			var leafOne = itterateToFastest(fusion[0], subEntryList, subDepth);
			var leafTwo = itterateToFastest(fusion[1], subEntryList, subDepth);

			if (Math.max(parseInt(leafOne.minStore), parseInt(leafTwo.minStore)) < parseInt(store)) {
				store = Math.max(parseInt(leafOne.minStore), parseInt(leafTwo.minStore));
				price = parseInt(leafOne.minPrice) + parseInt(leafTwo.minPrice);
				fuseList[0] = [leafOne, leafTwo];
			} else {
				store = store;
			}
		}
	}
	return new leaf(item, fuseList, price, store);
}

function requestResultOf(item, iterationMethod) {
	var result = iterationMethod(item, [], 0);
	printTree(result, 0);
	console.log("\nShopping list:\n" + "=".repeat(29) + "\nItem\t\tPrice\tStore");
	printShoppingList(result);
	console.log("\nTotal iterations: " + sumOfItteration(iterations));
}

function verifyPathRequest(answer) {
	if (answer.toLowerCase() === ("c").toLowerCase()) {
		requestResultOf(userItem, itterateToCheapest);
	} else if (answer.toLowerCase() === ("f").toLowerCase()) {
		requestResultOf(userItem, itterateToFastest);
	} else {
		console.log("Not a valid input.");
		promptUser("Cheapest or Fastest path? [c/f]", verifyPathRequest);
	}
}

function verifyItemRequest(answer) {
	
	try {
		userItem = findItem(answer);
		console.log("Item found!\nName:\t\t" + userItem.name + "\nPrice:\t\t" + userItem.price + "\nStore:\t\t" + userItem.store +"\n");
	} catch(err) {
		console.log("Not a valid item.");
		promptUser("Give item name:", verifyItemRequest);
	}
	promptUser("Cheapest or Fastest path? [c/f]", verifyPathRequest);
}

function promptUser(prompt, destination) {
	rl.question(prompt + "\n> ", destination);
}

readTextFile(data);
promptUser("Give item name:", verifyItemRequest);