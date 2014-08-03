var deleteCounter = 0, //How many have we deleted?
    chkBox, //Checkbox template
    initializing = false; //Are we adding checkboxes?

main();

function main() {
    if (!injectButtons()) {
        return;
    }

    injectBoxes();

    document.getElementById("pushes-list").addEventListener("DOMNodeInserted", onNodeInserted, false);

    log("Attached event listener to pushes-list");
}

function injectButtons(refreshing) {
    refreshing = refreshing || false;

    log("Checking if we should inject");

    var pushDiv = document.querySelector('div[class="pushframe"]');

    if (pushDiv === null) {
        log("No push frame found - we should not inject");

        return false;
    }

    log("Push frame existent - injection initiated");

    //Button divider
    var divButtons = document.createElement('div');
    divButtons.className = "pushbully-button-box";
    pushDiv.insertAdjacentElement('afterEnd', divButtons);

    //BUTTONS AND CHECKBOXES
    var btnClassName = "button btn pushbully-button pushbully"; //So I don't have to copy every time

    //Delete all button
    var btnDeleteAll = document.createElement('button');
    btnDeleteAll.innerHTML = 'Delete All Pushes';
    btnDeleteAll.className = btnClassName + " delete-all-button";
    btnDeleteAll.title = "Click to delete all of your pushes.";
    divButtons.appendChild(btnDeleteAll);
    btnDeleteAll.addEventListener('click', deleteAll_Click, false);

    //Select all button
    var btnSelectAll = document.createElement('button');
    btnSelectAll.className = btnClassName + " select-all-button";
    btnDeleteAll.insertAdjacentElement('beforeBegin', btnSelectAll);
    btnSelectAll.addEventListener('click', selectAll_Click, false);

    //Delete selected button
    var btnDeleteSelected = document.createElement('button');
    btnDeleteSelected.innerHTML = 'Delete Selected';
    btnDeleteSelected.className = btnClassName + " delete-selected-button";
    btnDeleteSelected.title = "Click to delete all of the pushes you have selected.";
    btnSelectAll.insertAdjacentElement('beforeBegin', btnDeleteSelected);
    btnDeleteSelected.addEventListener('click', deleteSelected_Click, false);

    //Refresh boxes button
    var btnRefreshBoxes = document.createElement('button');
    btnRefreshBoxes.innerHTML = 'Refresh Boxes';
    btnRefreshBoxes.className = btnClassName + " refresh-boxes-button";
    btnRefreshBoxes.title = "Sometimes pushes won't have checkboxes on them. Click this to fix that.";
    btnDeleteAll.insertAdjacentElement('afterEnd', btnRefreshBoxes);
    btnRefreshBoxes.addEventListener('click', refreshBoxes_Click, false);

    //Create checkbox template
    chkBox = document.createElement('div'); //No need to declare, it's already global
    chkBox.innerHTML = '<div class="square pushbully-chk-box"><i class="push-check pushbullet-mark"></i></div>'; //Laziness!
    chkBox.className = "checkbox pushbully-chk";
    chkBox.checked = false;

    log("Button box, buttons and checkbox template injected");

    return true;
}

function refreshBoxes_Click() {
    log("Refresh boxes button clicked");

    injectBoxes();
}
function injectBoxes() {
    initializing = true;

    log("Injecting checkboxes");

    deleteAllCheckboxes(false);

    var pushes = getAllPushes();

    if (!pushes.length) {
        log("No pushes on which to inject checkboxes");

        updateSAButton(false, 0);

        initializing = false

        return;
    }

    var currBox, closeButton;

    for (i = 0; i < pushes.length; i++) {
        currBox = addBoxToPush(pushes[i]);

        currBox.setAttribute("num", pushes.length - i);

        pushes[i].setAttribute("num", pushes.length - i);

        closeButton = pushes[i].getElementsByClassName("push-close")[0];

        closeButton.removeEventListener('click', manualPushDeletionHandler, false);
        closeButton.addEventListener('click', manualPushDeletionHandler, false);

        // closeButton.onclick += "manualPushDeletionHandler();";

        log("Attached event listener to push-close button");
    }

    updateSAButton();

    log(pushes.length + " checkboxes injected");

    initializing = false;
}//updates SelectAllButton(select)

function deleteAllCheckboxes(bUpdate) {
    bUpdate = bUpdate || true;

    var checkboxes = getAllCheckboxes(false);

    if (!checkboxes.length) {
        log("No checkboxes to delete");

        return;
    }

    log("Deleting " + checkboxes.length + " checkboxes");

    for (var i = 0; i < checkboxes.length; i++) {
        deleteElement(checkboxes[i]);
    }

    if (bUpdate) {
        updateSAButton(false, 0);
    }
}
function deleteElement(elem) {
    if (elem === null) {
        log("Could not delete elem because it was null");

        return;
    }

    elem.parentElement.removeChild(elem);
}

function onNodeInserted(event) {
    var trgt = event.target;

    if (!(trgt.className === "panel" && trgt.parentNode.className === "push")) {
        return;
    }

    if (initializing) {
        log("Node insertion event canceled; initializing === true.");

        return;
    }

    log("New push received");

    propogateNewPush(trgt.parentNode);
}
function propogateNewPush(newPush) {
    initializing = true;

    newPush = newPush || null;

    log("Beginning propagation of new push");

    var pushes = getAllPushes();

    var boxPrevPush, boxCurrPush;

    for (var i = pushes.length - 1; i >= 0; i--) {
        if (pushes.length === 1) {
            boxPrevPush = null;
        } else {
            boxPrevPush = boxFromPush(pushes[i - 1]);
            boxCurrPush = boxFromPush(pushes[i]);

            if (boxCurrPush !== null) {
                deleteElement(boxCurrPush);
            }
        }

        boxCurrPush = addBoxToPush(pushes[i], boxPrevPush);
    }

    if (newPush !== null) {
        newPush.setAttribute("num", pushes.length);
        boxCurrPush.setAttribute("num", pushes.length);
    }

    updateSAButton(pushes.length);

    log("Propagation of new push finished");

    initializing = false;
}//updates SelectAllButton(select, len)

function addBoxToPush(push, box) {
    box = box || null;

    var wire = false;

    if (box === null) {
        box = chkBox.cloneNode(true);

        log("Cloning chkBox due to null");

        wire = true;
    }

    var newChkBox = push.getElementsByClassName("push-close pointer")[0].insertAdjacentElement("afterEnd", box);

    if (wire) {
        newChkBox.addEventListener('click', chkBox_Click, false);
    }

    return newChkBox;
}
function boxFromPush(push) {
    push = push || null;

    if (push === null) {
        return null;
    }

    var elems = push.getElementsByClassName("pushbully-chk");

    if (!elems.length) {
        return null;
    }

    return elems[0];
}

function getAllPushes() {
    return document.body.getElementsByClassName("push");
}
function getAllCheckboxes(bChecked) {
    bChecked = bChecked || false;

    var allBoxes = document.body.getElementsByClassName((bChecked ? "checked " : "") + "pushbully-chk");

    return allBoxes;
}//sometimes updates SelectAllButton(select, len)

function selectAll_Click() {
    log("Select all button clicked");

    selectAll(this.innerHTML.indexOf("Deselect") == -1);
}
function selectAll(check) {
    var boxes = getAllCheckboxes();

    if (!boxes.length) {
        log("No pushes on which to toggle checkboxes");

        return 0;
    }

    var changed = 0;

    for (i = boxes.length - 1; i >= 0; i--) {
        if (boxes[i].checked === check) {
            continue;
        }

        changed++;

        checkABox(boxes[i], check);
    }

    log(changed + " checkboxes " + (check ? "checked" : "unchecked"));

    return changed;
}
function updateSAButton(deselect, num) {
    deselect = deselect || false;
    num = num || getAllCheckboxes(false, false).length;

    var btn = document.getElementsByClassName("select-all-button")[0];

    btn.innerHTML = (deselect ? "Deselect all" : "Select " + num);
    btn.title = (deselect ? "Click to deselect all selected pushes." : "Click to select all pushes on the first page.");

    //log("Set Select All Button to \"" + btn.innerHTML + "\"");
}

function chkBox_Click() {
    checkABox(this, !this.checked);

    log("Checkbox manually " + (this.checked ? "checked" : "unchecked"));
}
function checkABox(box, val) {
    box.checked = val;

    box.className = (val ? "checkbox checked pushbully-chk" : "checkbox pushbully-chk");

    var chkBoxLen = getAllCheckboxes(false).length;

    updateSAButton(chkBoxLen === getAllCheckboxes(true).length, chkBoxLen);

    return val;
} //updates SelectAllButton(conditional, len)

function deleteAll_Click() {
    log("Delete all button clicked");

    deleteCounter = 0;

    deleteAll(true);
}
function deleteAll(prompt) {
    var pushes = getAllPushes();

    if (!pushes.length) {
        log("Deleted " + deleteCounter + " pushes. No more pushes to delete");

        confirmSuccess();

        deleteAllCheckboxes();

        return 0;
    }

    if (prompt && (pushes.length > 3)) {
        var conf = confirm("Are you sure you wish to delete " + (pushes.length > 49 ? "50+" : "all " + pushes.length) + " pushes?\n\nThis cannot be interrupted nor undone.");

        if (!conf) {
            log("Delete all cancelled");

            return 0;
        }

        log("Delete all confirmed");
    }

    for (i = pushes.length - 1; i >= 0; i--) {
        deletePush(pushes[i]);
    }

    var secsToWait = 3;

    log("Deleted " + deleteCounter + " so far. Waiting " + secsToWait + " seconds.");

    window.setTimeout(function () {
        deleteAll(false)
    }, secsToWait * 1000);

    return deleteCounter;
}
function confirmSuccess() {
    var noteExists = (document.getElementsByClassName("note").length > 0);

    if (noteExists) {
        log("'No more pushes' note was found. Job completion confirmed.");
    } else {
        log("However, the 'no more pushes' note was not found. There may be more notes.");
    }

    return noteExists;
}

function deleteSelected_Click() {
    log("Delete Selected button clicked");

    deleteSelected();
}
function deleteSelected() {
    deleteCounter = 0;

    var boxes = getAllCheckboxes(true, false);

    if (!boxes.length) {
        log("No checked pushes to delete");

        injectBoxes();

        return 0;
    }

    for (var i = boxes.length - 1; i >= 0; i--) {
        log("clicking delete on boxes[" + i + "]")

        deletePush(boxes[i].parentNode);
    }

    log(deleteCounter + " pushes deleted");

    if (!getAllPushes().length) {
        injectBoxes();
    } else {
        updateSAButton();
    }

    return deleteCounter;
}

function deletePush(push) {
    var elems = push.getElementsByClassName("push-close");

    if (!elems.length) {
        return false;
    }

    elems[0].click();

    deleteCounter++;

    return true;
}

function manualPushDeletionHandler() {
    injectBoxes(); //At least until I can think straight.
}

function log(text) {
    console.log("PUSHBULLY: " + text);
}