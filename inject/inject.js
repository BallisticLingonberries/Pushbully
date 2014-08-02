var deleteCounter = 0;

main();

function main() {
	injectElements();
}

function injectElements() {
	log("Checking if we should inject");

	var pushDiv = document.querySelector('div[class="pushframe"]');

	if(pushDiv === null) {
		log("No push frame found - we should not inject");
	
		return;
	}
	
	log("Push frame found - beginning to inject");

	var btnDeleteAll = document.createElement('button');
		btnDeleteAll.innerHTML = 'Delete All Pushes';
		btnDeleteAll.className = "button btn hover-red delete-all-button";

		pushDiv.insertAdjacentElement('afterEnd',btnDeleteAll);

		btnDeleteAll.addEventListener('click',deleteAll_Click,false);

		log("Delete All Button injected");
		
	var btnSelectAll = document.createElement('button');
		btnSelectAll.innerHTML = 'Select 50';
		btnSelectAll.className = "button btn hover-red select-all-button";

		btnDeleteAll.insertAdjacentElement('afterEnd',btnSelectAll);

		btnSelectAll.addEventListener('click',selectAll_Click,false);

		log("Select All Button injected");
		
	var chkBox = document.createElement('div');
		chkBox.innerHTML = '<div class="square"><i class="push-check"></i></div>';
		chkBox.className = "checkbox";
		btnSelectAll.insertAdjacentElement('afterEnd',chkBox);
		chkBox.addEventListener('click',chkBox_Click,false);
		
		log("Check box injected");
}

function deleteAll_Click() {
	log("Delete all button clicked");
	
	deleteCounter = 0;
	
	deleteAll(true);
}

function selectAll_Click() {
	log("Select all button clicked");
	
	selectAll();
}

function chkBox_Click(){

}

function deleteAll(prompt) {
	var pushes = document.body.getElementsByClassName("push");
	 
	if(!pushes.length) {
		log("Deleted "+deleteCounter+" pushes. No more pushes to delete");
		
		//if(deleteCounter > 6) { alert("Deleted "+deleteCounter+" pushes, saving you an average of " + (deleteCounter/2) + " seconds."); }
		
		return 0;
	 }
	
	if(prompt && pushes.length > 3 && !confirm("Are you sure you wish to delete " + (pushes.length > 49 ? "50+" : "all " +pushes.length) + " pushes?\n\nThis cannot be interrupted nor undone.")) {
		log("Delete cancelled");
		
		return 0;
	}

	//var  link, skipCounter = 0;// deleteFiles = -1; //-1 = haven't asked yet, 0 = no, 1 = yes

    for (i = 0; i <pushes.length; i++) {
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
	
	log("Waiting "+secsToWait+" seconds")
	
	window.setTimeout(function(){deleteAll(false)},secsToWait*1000);
}

function selectAll() {

}

function log(text) {
	console.log("PUSHBULLY: " + text);
}