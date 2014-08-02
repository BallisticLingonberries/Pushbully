var deleteCounter = 0;

main();

function main() {
	if (injectButtons()) {
		injectBoxes();
	}
}

function injectButtons() {
	log("Checking if we should inject");

	var pushDiv = document.querySelector('div[class="pushframe"]');

	if (pushDiv === null) {
		log("No push frame found - we should not inject");

		return false;
	}

	log("Push frame found - beginning to inject");
	
	var divButtons = document.createElement('div');	
		divButtons.className = "pushbully-button-box";
	
		pushDiv.insertAdjacentElement('afterEnd', divButtons);
	log("Button box injected");

	var btnClassName = "button btn hover-red pushbully-button";

	var btnDeleteAll = document.createElement('button');
		btnDeleteAll.innerHTML = 'Delete All Pushes';
		btnDeleteAll.className = btnClassName + " delete-all-button";
		
		divButtons.appendChild(btnDeleteAll);

		btnDeleteAll.addEventListener('click', deleteAll_Click, false);
	log("Delete All Button injected");

	var btnSelectAll = document.createElement('button');
		btnSelectAll.innerHTML = 'Select 50';
		btnSelectAll.className = btnClassName + " select-all-button";

		btnDeleteAll.insertAdjacentElement('beforeBegin', btnSelectAll);

		btnSelectAll.addEventListener('click', selectAll_Click, false);
	log("Select All Button injected");

	var btnDeleteSelected = document.createElement('button');
		btnDeleteSelected.innerHTML = 'Delete Selected';
		btnDeleteSelected.className = btnClassName + " delete-selected-button";

		btnSelectAll.insertAdjacentElement('beforeBegin', btnDeleteSelected);

		btnDeleteSelected.addEventListener('click', deleteSelected_Click, false);
	log("Delete Selected Button injected");
	
	var btnRefreshBoxes = document.createElement('button');
		btnRefreshBoxes.innerHTML = 'Refresh Boxes';
		btnRefreshBoxes.className = btnClassName + " refresh-boxes-button";
		
		btnDeleteAll.insertAdjacentElement('afterEnd',btnRefreshBoxes);
		
		btnRefreshBoxes.addEventListener('click', refreshBoxes_Click, false);
	log("Refresh Boxes Button injected");

	return true;
}

function refreshBoxes_Click(){
	log("Refresh boxes button clicked");
	
	injectBoxes();
}

function injectBoxes() {
	log("Injecting checkboxes");
	
	deleteCheckboxes();

	var chkBox = document.createElement('div');
	chkBox.innerHTML = '<div class="square pushbully-chk-box"><i class="push-check"></i></div>';
	chkBox.className = "checkbox pushbully-chk";

	chkBox.checked = false;

	var pushes = getAllPushes();

	if (!pushes.length) { 
		log("No pushes on which to inject checkboxes"); 
		
		return;
	}
	
	for (i = 0; i < pushes.length; i++) {
		var newChkBox = pushes[i].getElementsByClassName("push-close pointer")[0].insertAdjacentElement("afterEnd", chkBox.cloneNode(true));

		newChkBox.addEventListener('click', chkBox_Click, false);
	}

	log("Checkboxes injected");
}

function deleteAll_Click() {
	log("Delete all button clicked");

	deleteCounter = 0;

	deleteAll(true);
}

function selectAll_Click() {
	log("Select all button clicked");

	if (this.innerHTML === "Select 50") { //Select "all"
		selectAll(this, true);
	} else { //Deselect all
		selectAll(this, false);
	}
}

function chkBox_Click() {
	checkABox(this,!this.checked);
	
	log("Checkbox toggled " + (this.checked ? "on" : "off"));
}

function deleteSelected_Click() {
	log("Delete Selected button clicked");

	deleteCounter = 0;

	deleteSelected();
	
	if(!getAllPushes().length) {
		deleteCheckboxes();
	}
}

function deleteCheckboxes() {
	log("Deleting checkboxes");

	var checkboxes = getAllCheckboxes();

	if (!checkboxes.length) {
		return;
	}

	for (var i = checkboxes.length - 1; i >= 0; i--) {
		checkboxes[i].parentElement.removeChild(checkboxes[i]);
	}
}

function getAllCheckboxes(bChecked) {
	bChecked = bChecked || false;
	log("bChecked is '" + bChecked + "'");
	return document.body.getElementsByClassName((bChecked ? "checked " : "") + "pushbully-chk");
}

function getAllPushes() {
	return document.body.getElementsByClassName("push");
}

function deleteAll(prompt) {
	var pushes = getAllPushes();

	if (!pushes.length) {
		log("Deleted " + deleteCounter + " pushes. No more pushes to delete");

		deleteCheckboxes();

		return 0;
	}

	if (prompt && pushes.length > 3 && !confirm("Are you sure you wish to delete " + (pushes.length > 49 ? "50+" : "all " + pushes.length) + " pushes?\n\nThis cannot be interrupted nor undone.")) {
		log("Delete cancelled");

		return 0;
	}

	//var  link, skipCounter = 0;// deleteFiles = -1; //-1 = haven't asked yet, 0 = no, 1 = yes

	for (i = pushes.length - 1; i >= 0; i--) {
		/* wait until you have a settings page
		link = pushes[i].querySelector("a");
		
		if(link !== null && link.getAttribute("href").indexOf("pushbullet-uploads") > -1)
		{
			if(deleteFiles === -1) {
				deleteFiles = (
					(
						prompt("Deleting a push that hosts a file will also delete the file itself.\n\nDelete hosted files? (type yes and hit OK, or hit cancel)") === "yes"
					) ? 1 : 0
				)
			}
			
			if (!deleteFiles) {
				skipCounter++;
				
				continue;
			}
		}
		*/

		pushes[i].getElementsByClassName("push-close pointer")[0].click();

		deleteCounter++;
	}

	var secsToWait = 3;

	log("Waiting " + secsToWait + " seconds")

	window.setTimeout(function() {
		deleteAll(false)
	}, secsToWait * 1000);
}

function selectAll(btn, all) {
	if (all) {
		log("Selecting \"all\" pushes");
	} else {
		log("Deselecting all pushes");
	}

	var boxes = getAllCheckboxes();

	if (!boxes.length) {
		log("No pushes on which to toggle checkboxes");

		return;
	}

	var changed = false;

	for (i = boxes.length - 1; i >= 0; i--) {
		if (boxes[i].checked === all) {
			continue;
		}

		changed = true;

		checkABox(boxes[i],all);
	}

	if (!changed) { 
		log("No pushes on which to toggle checkboxes");
		
		return;
	}
	
	log("Checkboxes toggled");

	btn.innerHTML = (all ? "Deselect all" : "Select 50");
}

function checkABox(box,val){	
	box.checked = val;
	
	box.className = (val ? "checkbox checked pushbully-chk" : "checkbox pushbully-chk");
	
	return val;
}

function deleteSelected() {
	var boxes = getAllCheckboxes(true);

	if (!boxes.length) {
		log("No checked pushes to delete");

		return;
	}

	for (var i = boxes.length - 1; i >= 0; i--) {
		log("clicking delete on boxes["+i+"]")
		
		var elems = boxes[i].parentElement.getElementsByClassName("push-close pointer");
		
		if(elems.length){
			elems[0].click();
			deleteCounter++;
		}
		
		checkABox(boxes[i],false);
	}
}

function log(text) {
	console.log("PUSHBULLY: " + text);
}