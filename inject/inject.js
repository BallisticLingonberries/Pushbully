var deleteCounter = 0;

main();

function main() {
	log("Starting inject");

	var pushDiv = document.querySelector('div[class="pushframe"]');

	if(pushDiv === null) { return; }

	var btn = document.createElement('button');

	btn.innerHTML = 'Delete All Pushes';
	btn.className = "button btn hover-red delete-all-button";

	pushDiv.insertAdjacentElement('afterEnd',btn);

	log("Trying to attach event to button");

	btn.addEventListener('click',clickHandler,false);

	log("Click event attached to button");
}

function clickHandler() {
	log("Delete all button clicked");
	
	deleteCounter = 0;
	
	doDelete(true);
}

function doDelete(prompt) {
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
	
	window.setTimeout(function(){doDelete(false)},secsToWait*1000);
}

function log(text) {
	console.log("PUSHBULLY: " + text);
}